import * as dgram from 'dgram';
import { BehaviorSubject, Observable } from 'rxjs';
import { ICameraConnection, ILogger } from 'cgf.cameracontrol.main.core';
import { IViscaOverIpCameraConfiguration } from './IViscaOverIpCameraConfiguration';

export class ViscaOverIpCamera implements ICameraConnection {
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);
    private readonly _socket: dgram.Socket;
    private _sequenceNumber = 1;

    private _currentPan = 0;
    private _currentTilt = 0;

    constructor(
        private config: IViscaOverIpCameraConfiguration,
        private logger: ILogger
    ) {
        this._socket = dgram.createSocket('udp4');

        this._socket.on('error', (err) => {
            this.logError(`Error: ${err}`);
            this._socket.close();
            this._connectionSubject.next(false);
        });

        this._socket.on('close', () => {
            this.log('Closed');
            this._connectionSubject.next(false);
        });

        // UDP is connectionless; assume connected upon creation
        this._connectionSubject.next(true);
    }

    public get connectionString(): string {
        return `visca://${this.config.ip}:${this.config.port || 52381}`;
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    public async dispose(): Promise<void> {
        this._socket.close();
    }

    public pan(value: number): void {
        this._currentPan = this.config.panTiltInvert ? -value : value;
        this.sendPanTilt();
    }

    public tilt(value: number): void {
        this._currentTilt = this.config.panTiltInvert ? -value : value;
        this.sendPanTilt();
    }

    public zoom(value: number): void {
        let command: Buffer;
        if (value === 0) {
            command = Buffer.from([0x81, 0x01, 0x04, 0x07, 0x00, 0xff]); // Stop
        } else {
            const speed = Math.min(7, Math.max(0, Math.round(Math.abs(value) * 7)));
            const direction = value > 0 ? 0x20 : 0x30; // 2=Tele(in), 3=Wide(out)
            command = Buffer.from([0x81, 0x01, 0x04, 0x07, direction | speed, 0xff]);
        }
        this.sendViscaCommand(command);
    }

    public focus(value: number): void {
        let command: Buffer;
        if (value === 0) {
            command = Buffer.from([0x81, 0x01, 0x04, 0x08, 0x00, 0xff]); // Stop
        } else {
            const speed = Math.min(7, Math.max(0, Math.round(Math.abs(value) * 7)));
            const direction = value > 0 ? 0x20 : 0x30; // 2=Far, 3=Near
            command = Buffer.from([0x81, 0x01, 0x04, 0x08, direction | speed, 0xff]);
        }
        this.sendViscaCommand(command);
    }

    public tallyState(value: 'off' | 'preview' | 'program'): void {
        // Tally commands are often vendor-specific in VISCA.
        this.log(`Tally state set to ${value}`);
    }

    private sendPanTilt() {
        const panSpeed = Math.min(24, Math.max(1, Math.round(Math.abs(this._currentPan) * 24)));
        const tiltSpeed = Math.min(20, Math.max(1, Math.round(Math.abs(this._currentTilt) * 20)));

        let panDir = 0x03; // Stop
        if (this._currentPan > 0)
            panDir = 0x02; // Right
        else if (this._currentPan < 0) panDir = 0x01; // Left

        let tiltDir = 0x03; // Stop
        if (this._currentTilt > 0)
            tiltDir = 0x01; // Up
        else if (this._currentTilt < 0) tiltDir = 0x02; // Down

        const command = Buffer.from([0x81, 0x01, 0x06, 0x01, panSpeed, tiltSpeed, panDir, tiltDir, 0xff]);

        this.sendViscaCommand(command);
    }

    private sendViscaCommand(payload: Buffer) {
        if (!this._connectionSubject.value) return;

        const header = Buffer.alloc(8);
        header.writeUInt16BE(0x0100, 0); // Payload type (VISCA command)
        header.writeUInt16BE(payload.length, 2); // Payload length
        header.writeUInt32BE(this._sequenceNumber++, 4); // Sequence number

        const packet = Buffer.concat([header, payload]);

        this._socket.send(packet, this.config.port || 52381, this.config.ip, (err) => {
            if (err) this.logError(`Failed to send command: ${err}`);
        });
    }

    private log(toLog: string) {
        this.logger.log(`ViscaOverIpCamera(${this.config.ip}): ${toLog}`);
    }

    private logError(toLog: string) {
        this.logger.error(`ViscaOverIpCamera(${this.config.ip}): ${toLog}`);
    }
}
