import { BehaviorSubject, Observable } from 'rxjs';
import { ICameraConnection, ILogger } from 'cgf.cameracontrol.main.core';
import { ViscaCamera, ViscaCommand } from 'node-visca-over-ip';
import { IViscaOverIpCameraConfiguration } from './IViscaOverIpCameraConfiguration';

// Define the available command categories for deduplication
type CommandCategory = 'panTilt' | 'zoom' | 'focus' | 'tally';

export class ViscaOverIpCamera implements ICameraConnection {
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);
    private readonly _camera: ViscaCamera;

    // The Map naturally deduplicates commands by category while preserving execution order
    private _commandQueue: Map<CommandCategory, ViscaCommand> = new Map();
    private _isSending = false;

    private _currentPan = 0;
    private _currentTilt = 0;

    constructor(
        private config: IViscaOverIpCameraConfiguration,
        private logger: ILogger
    ) {
        this._camera = new ViscaCamera(this.config.ip, this.config.port || 52381);

        this._camera.on('connected', () => {
            this.log('Connected');
            this._connectionSubject.next(true);
        });

        this._camera.on('error', (err: unknown) => {
            this.logError(`Camera Error: ${err}`);
            this._connectionSubject.next(false);

            // Clear the queue entirely on a connection error
            this._commandQueue.clear();
            this._isSending = false;
        });

        this._camera.on('closed', () => {
            this.log('Closed');
            this._connectionSubject.next(false);
        });
    }

    public get connectionString(): string {
        return `visca://${this.config.ip}:${this.config.port || 52381}`;
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    public async dispose(): Promise<void> {
        this._connectionSubject.next(false);
    }

    public pan(value: number): void {
        // value is between -1 and 1
        this._currentPan = this.config.panTiltInvert ? -value : value;
        this.enqueuePanTilt();
    }

    public tilt(value: number): void {
        // value is between -1 and 1
        this._currentTilt = this.config.panTiltInvert ? -value : value;
        this.enqueuePanTilt();
    }

    public zoom(value: number): void {
        // Scale [-1, 1] to a VISCA speed of 0 to 7
        const speed = Math.round(Math.abs(value) * 7);
        let command: ViscaCommand;

        if (value === 0 || speed === 0) {
            command = ViscaCommand.cameraZoomStop();
        } else if (value > 0) {
            command = ViscaCommand.cameraZoomIn(speed);
        } else {
            command = ViscaCommand.cameraZoomOut(speed);
        }

        this.enqueueCommand('zoom', command);
    }

    public focus(value: number): void {
        // Scale [-1, 1] to a VISCA speed of 0 to 7
        const speed = Math.round(Math.abs(value) * 7);
        let command: ViscaCommand;

        if (value === 0 || speed === 0) {
            command = ViscaCommand.cameraFocusStop();
        } else if (value > 0) {
            command = ViscaCommand.cameraFocusFar(speed);
        } else {
            command = ViscaCommand.cameraFocusNear(speed);
        }

        this.enqueueCommand('focus', command);
    }

    public tallyState(value: 'off' | 'preview' | 'program'): void {
        // Tally commands are often vendor-specific in VISCA.
        this.log(`Tally state set to ${value}`);
    }

    private enqueuePanTilt(): void {
        // 1. Calculate raw speeds
        const rawPanSpeed = Math.min(Math.round(Math.abs(this._currentPan) * 24), 24);
        const rawTiltSpeed = Math.min(Math.round(Math.abs(this._currentTilt) * 20), 20);

        // 2. Determine the modes (xMode: 1=Left, 2=Right, 3=Stop | yMode: 1=Up, 2=Down, 3=Stop)
        const panMode = rawPanSpeed === 0 ? 3 : this._currentPan > 0 ? 2 : 1;
        const tiltMode = rawTiltSpeed === 0 ? 3 : this._currentTilt > 0 ? 1 : 2;

        // 3. Apply the VISCA quirk: Speed bytes must be >= 1, even during a Stop (Mode 3) command
        const finalPanSpeed = rawPanSpeed === 0 ? 1 : rawPanSpeed;
        const finalTiltSpeed = rawTiltSpeed === 0 ? 1 : rawTiltSpeed;

        // 4. Build and enqueue the command
        const command = ViscaCommand.cameraPanTilt(finalPanSpeed, finalTiltSpeed, panMode, tiltMode);
        this.enqueueCommand('panTilt', command);
    }

    private enqueueCommand(category: CommandCategory, command: ViscaCommand): void {
        this._commandQueue.set(category, command);
        this.processQueue();
    }

    private processQueue(): void {
        if (this._isSending || this._commandQueue.size === 0 || !this._connectionSubject.value) {
            return;
        }

        this._isSending = true;

        const nextEntry = this._commandQueue.entries().next().value;
        if (!nextEntry) {
            this._isSending = false;
            return;
        }

        const [category, command] = nextEntry;

        // Remove it from the pending queue so we don't send it again
        this._commandQueue.delete(category);

        // Since ViscaCommand doesn't support .once() or removing listeners,
        // we use a flag to ensure we only release the queue lock once per command.
        let handled = false;

        const releaseAndNext = () => {
            if (handled) return;
            handled = true;
            this._isSending = false;
            this.processQueue();
        };

        // Use the explicitly supported .on() method
        command.on('ack', () => releaseAndNext());

        command.on('error', (err: unknown) => {
            this.logError(`Command Error (${category}): ${err}`);
            releaseAndNext();
        });

        // Ship it
        this._camera.sendCommand(command);
    }

    private log(toLog: string): void {
        this.logger.log(`ViscaOverIpCamera(${this.config.ip}): ${toLog}`);
    }

    private logError(toLog: string): void {
        this.logger.error(`ViscaOverIpCamera(${this.config.ip}): ${toLog}`);
    }
}
