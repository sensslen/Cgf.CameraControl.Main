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

    // Command timeout in milliseconds (configurable safety timeout)
    private readonly _commandTimeout = 5000;

    constructor(
        private config: IViscaOverIpCameraConfiguration,
        private logger: ILogger
    ) {
        this._camera = new ViscaCamera(this.config.ip, this.config.port || 52381);

        // Only mark as connected after successful VISCA handshake/ACK or verified command response
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
        this._camera.client.disconnect();

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
        const mode = this.config.tallyMode || 'none';

        if (mode === 'none') {
            this.log(`Tally state changed to ${value}, but tallyMode is 'none'`);
            return;
        }

        let payload: number[] | null = null;

        // Construct vendor-specific raw VISCA payloads
        switch (mode) {
            case 'sony-lumens':
                switch (value) {
                    case 'program':
                        payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x02, 0xff]; // Red
                        break;
                    case 'preview':
                        payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x01, 0xff]; // Green
                        break;
                    case 'off':
                        payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x00, 0xff]; // Off
                        break;
                }
                break;

            case 'avonic':
                switch (value) {
                    case 'program':
                        payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x02, 0x03, 0xff]; // Red
                        break;
                    case 'preview':
                        payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x03, 0x02, 0xff]; // Green
                        break;
                    case 'off':
                        payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x03, 0x03, 0xff]; // Off
                        break;
                }
                break;

            case 'ptzoptics':
                switch (value) {
                    case 'program':
                        payload = [0x81, 0x0a, 0x02, 0x02, 0x02, 0xff]; // On
                        break;
                    case 'preview':
                    case 'off':
                        payload = [0x81, 0x0a, 0x02, 0x02, 0x03, 0xff]; // Off
                        break;
                }
                break;
        }

        if (payload) {
            this.log(`Tally state set to ${value} (Mode: ${mode})`);

            // Create a custom VISCA command from raw bytes and enqueue it
            this.enqueueCommand('tally', ViscaCommand.fromPacket(payload));
        }
    }

    private enqueuePanTilt(): void {
        const rawPanSpeed = Math.min(Math.round(Math.abs(this._currentPan) * 24), 24);
        const rawTiltSpeed = Math.min(Math.round(Math.abs(this._currentTilt) * 20), 20);

        const panMode = rawPanSpeed === 0 ? 3 : this._currentPan > 0 ? 2 : 1;
        const tiltMode = rawTiltSpeed === 0 ? 3 : this._currentTilt > 0 ? 1 : 2;

        const finalPanSpeed = rawPanSpeed === 0 ? 1 : rawPanSpeed;
        const finalTiltSpeed = rawTiltSpeed === 0 ? 1 : rawTiltSpeed;

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

        this._commandQueue.delete(category);

        let handled = false;

        const releaseAndNext = () => {
            if (handled) return;
            handled = true;
            // Clear the safety timeout
            clearTimeout(timeoutHandle);
            this._isSending = false;
            this.processQueue();
        };

        command.on('ack', () => releaseAndNext());

        command.on('complete', () => releaseAndNext());

        command.on('error', (err: unknown) => {
            this.logError(`Command Error (${category}): ${err}`);
            releaseAndNext();
        });

        // Safety timeout to prevent hanging
        const timeoutHandle = setTimeout(() => {
            if (!handled) {
                this.logError(`Command timeout (${category}) after ${this._commandTimeout}ms`);
                releaseAndNext();
            }
        }, this._commandTimeout);

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
