import * as signalR from '@microsoft/signalr';

import { BehaviorSubject, Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';

import { Agent as HttpsAgent } from 'https';
import { ICameraConnection } from 'cgf.cameracontrol.main.core';
import { ILogger } from 'cgf.cameracontrol.main.core';
import { ISignalrPtzLancCameraConfiguration } from './ISignalrPtzLancCameraConfiguration';
import { SignalrPtzLancCameraState } from './SignalrPtzLancCameraState';

export class SignalrPtzLancCamera implements ICameraConnection {
    private readonly _axios: AxiosInstance;
    private readonly _socketConnection: signalR.HubConnection;
    private readonly _currentState = new SignalrPtzLancCameraState();
    private _shouldTransmitState = false;
    private _canTransmit = false;
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);

    constructor(
        private config: ISignalrPtzLancCameraConfiguration,
        private logger: ILogger
    ) {
        this._axios = axios.create({
            httpsAgent: new HttpsAgent({
                rejectUnauthorized: false,
            }),
        });

        this._socketConnection = new signalR.HubConnectionBuilder()
            .withAutomaticReconnect()
            .withUrl(`${this.config.connectionUrl}/statehub`)
            .build();

        this.initialConnect().catch((error) => this.logError(`Initial connection error:${error}`));
    }

    public get connectionString(): string {
        return this.config.connectionUrl;
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    public async dispose(): Promise<void> {
        try {
            await this._socketConnection.stop();
        } catch (error) {
            this.logError(`unable to stop socket connection - ${error}`);
        }
    }

    public pan(value: number): void {
        this._currentState.pan = this.invertIfNecessaryForPanTilt(this.multiplyRoundAndCrop(value * 255, 255));
        this.scheduleStateTransmission();
    }
    public tilt(value: number): void {
        this._currentState.tilt = this.invertIfNecessaryForPanTilt(this.multiplyRoundAndCrop(value * 255, 255));
        this.scheduleStateTransmission();
    }
    public zoom(value: number): void {
        this._currentState.zoom = this.multiplyRoundAndCrop(value * 8, 8);
        this.scheduleStateTransmission();
    }
    public focus(value: number): void {
        this._currentState.focus = this.multiplyRoundAndCrop(value * 1.2, 1);
        this.scheduleStateTransmission();
    }
    public tallyState(_: 'off' | 'preview' | 'program'): void {}

    private async socketReconnected() {
        await this.setupRemote();
        await this.connectionSuccessfullyEstablished();
    }

    private async initialConnect() {
        await this.setupRemote();
        this._socketConnection.onreconnected(() => {
            this.log('reconnect successful');
            this.socketReconnected();
        });
        this._socketConnection.onreconnecting(() => {
            this.log('connection error - trying automatic reconnect');
            this._connectionSubject.next(false);
        });
        try {
            await this._socketConnection.start();
            await this.connectionSuccessfullyEstablished();
        } catch (error) {
            this.logError(`Socket connection setup failed with error:${error} - retrying`);
            await this.initialConnect();
        }
    }

    private async setupRemote() {
        try {
            const response = await this._axios.get(this.config.connectionUrl + '/connections');

            if (!response.data.includes(this.config.connectionPort)) {
                this.logError(`Port:${this.config.connectionPort} is not available. Available Ports:${response.data}`);
                this.logError('Stopping camera.');
                this.dispose();
            }
        } catch (error) {
            this.log(`Failed to connect - ${error}`);
            await this.setupRemote();
            return;
        }
        const connection = {
            connectionName: this.config.connectionPort,
            connected: true,
        };
        try {
            await this._axios.put(`${this.config.connectionUrl}/connection`, connection);
        } catch (error) {
            this.logError(`Failed to connect to Port:${this.config.connectionPort} with error:${error}`);
            this.logError('Stopping camera.');
            this.dispose();
        }
    }

    private async connectionSuccessfullyEstablished() {
        this._canTransmit = true;
        this._connectionSubject.next(true);
        await this.transmitNextStateIfRequestedAndPossible();
    }

    private async transmitNextStateIfRequestedAndPossible() {
        if (!this._canTransmit) {
            return;
        }
        if (!this._connectionSubject.value) {
            return;
        }
        if (this._shouldTransmitState) {
            this._canTransmit = false;
            this._shouldTransmitState = false;
            try {
                const updateSuccessful = await this._socketConnection.invoke('SetState', this._currentState);
                if (!updateSuccessful) {
                    this.log('state update failure returned - retrying');
                    this._shouldTransmitState = true;
                }
                this._canTransmit = true;
            } catch (error) {
                this._shouldTransmitState = true;
                this.log(`state transmission error - ${error}`);
            }
            await this.transmitNextStateIfRequestedAndPossible();
        }
    }

    private scheduleStateTransmission() {
        this._shouldTransmitState = true;
        this.transmitNextStateIfRequestedAndPossible();
    }

    private log(toLog: string) {
        this.logger.log(`CgfPtzCamera(${this.config.connectionUrl}):${toLog}`);
    }

    private logError(toLog: string) {
        this.logger.error(`CgfPtzCamera(${this.config.connectionUrl}):${toLog}`);
    }
    private multiplyRoundAndCrop(value: number, maximumAbsolute: number): number {
        const maximized = Math.max(-maximumAbsolute, Math.min(maximumAbsolute, value));
        return Math.round(maximized);
    }
    private invertIfNecessaryForPanTilt(value: number): number {
        if (this.config.panTiltInvert === true) {
            return -value;
        }
        return value;
    }
}
