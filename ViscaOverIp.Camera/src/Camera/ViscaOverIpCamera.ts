import { BehaviorSubject, Observable } from 'rxjs';
import { ICameraConnection, ILogger } from 'cgf.cameracontrol.main.core';
import { ViscaCamera, ViscaCommand } from 'node-visca-over-ip';
import { IViscaOverIpCameraConfiguration } from './IViscaOverIpCameraConfiguration';
import { ViscaCommandFactory } from './ViscaCommandFactory';

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

        // FIX: Changed 'any' to 'unknown' to satisfy ESLint
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

        this._connectionSubject.next(true);
    }

    public get connectionString(): string {
        return `visca://${this.config.ip}:${this.config.port || 52381}`;
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    public async dispose(): Promise<void> {
        // Safe check in case the library changes or doesn't expose disconnect
        if (
            'disconnect' in this._camera &&
            typeof (this._camera as { disconnect?: () => void }).disconnect === 'function'
        ) {
            (this._camera as { disconnect: () => void }).disconnect();
        }
        this._connectionSubject.next(false);
    }

    public pan(value: number): void {
        this._currentPan = this.config.panTiltInvert ? -value : value;
        this.enqueuePanTilt();
    }

    public tilt(value: number): void {
        this._currentTilt = this.config.panTiltInvert ? -value : value;
        this.enqueuePanTilt();
    }

    public zoom(value: number): void {
        this.enqueueCommand('zoom', ViscaCommandFactory.zoom(value));
    }

    public focus(value: number): void {
        this.enqueueCommand('focus', ViscaCommandFactory.focus(value));
    }

    public tallyState(value: 'off' | 'preview' | 'program'): void {
        this.enqueueCommand('tally', ViscaCommandFactory.tally(value));
    }

    private enqueuePanTilt(): void {
        const command = ViscaCommandFactory.panTilt(this._currentPan, this._currentTilt);
        // By using 'panTilt' as the key, rapid joystick updates will continually overwrite
        // the pending command rather than growing the queue.
        this.enqueueCommand('panTilt', command);
    }

    private enqueueCommand(category: CommandCategory, command: ViscaCommand): void {
        // Set or overwrite the command for this category
        this._commandQueue.set(category, command);
        this.processQueue();
    }

    private processQueue(): void {
        // Only proceed if we aren't currently waiting on an ACK, have items to send, and are connected
        if (this._isSending || this._commandQueue.size === 0 || !this._connectionSubject.value) {
            return;
        }

        this._isSending = true;

        // FIX: Extract the item safely to prevent TypeScript destructuring errors
        const nextEntry = this._commandQueue.entries().next().value;
        if (!nextEntry) {
            this._isSending = false;
            return;
        }

        const [category, command] = nextEntry;

        // Remove it from the pending queue so we don't send it again
        this._commandQueue.delete(category);

        // Define a helper to release the lock and trigger the next command
        const releaseAndNext = () => {
            this._isSending = false;
            command.removeAllListeners('ack');
            command.removeAllListeners('error');
            this.processQueue();
        };

        // Listen for acknowledgment that the camera accepted the command
        command.once('ack', () => releaseAndNext());

        // FIX: Changed 'any' to 'unknown' to satisfy ESLint
        command.once('error', (err: unknown) => {
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
