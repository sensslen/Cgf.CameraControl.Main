import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { ICameraConnection } from 'cgf.cameracontrol.main.core';
import { ILogger } from 'cgf.cameracontrol.main.core';
import { IWebsocketPtzLancCameraConfiguration } from './IWebsocketPtzLancCameraConfiguration';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import { WebsocketPtzLancCameraSpeedState } from './WebsocketPtzLancCameraState';

export class WebsocketPtzLancCamera implements ICameraConnection {
    private _websocket: ReconnectingWebSocket;
    private readonly stateSubject = new BehaviorSubject<WebsocketPtzLancCameraSpeedState>(
        new WebsocketPtzLancCameraSpeedState()
    );
    private readonly connectionSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private readonly transmitSubscription: Subscription;

    constructor(
        private config: IWebsocketPtzLancCameraConfiguration,
        private logger: ILogger
    ) {
        const connectionId = `ws://${this.config.ip}/ws`;
        this._websocket = new ReconnectingWebSocket(connectionId, [], {
            /* eslint-disable @typescript-eslint/naming-convention */
            WebSocket: WS,
            /* eslint-enable @typescript-eslint/naming-convention */
        });

        this._websocket.onopen = (_) => {
            this.log(`websocket connected: ${connectionId}`);
            this.connectionSubject.next(true);
        };

        this._websocket.onerror = (errorevent) => {
            this.log(`websocket error on connection: ${connectionId}\n${errorevent.message}\n${errorevent.error}`);
        };

        this._websocket.onclose = (closeevent) => {
            this.log(
                `websocket closed - trying automatic reconnect: ${connectionId}\n${closeevent.code}-${closeevent.reason}`
            );
            this.connectionSubject.next(false);
        };

        this.transmitSubscription = combineLatest([this.connectionSubject, this.stateSubject]).subscribe(
            ([isConnected, state]) => {
                if (isConnected) {
                    this._websocket.send(JSON.stringify(state));
                }
            }
        );
    }

    public get connectionString(): string {
        return this._websocket.url;
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this.connectionSubject;
    }

    public async dispose(): Promise<void> {
        try {
            this.transmitSubscription.unsubscribe();
            this._websocket.close();
        } catch (error) {
            this.logError(`unable to stop socket connection - ${error}`);
        }
    }

    public pan(value: number): void {
        this.setState((state) => {
            state.pan = this.invertIfNecessaryForPanTilt(this.multiplyRoundAndCrop(value * 255, 255));
            return state;
        });
    }
    public tilt(value: number): void {
        this.setState((state) => {
            state.tilt = this.invertIfNecessaryForPanTilt(this.multiplyRoundAndCrop(value * 255, 255));
            return state;
        });
    }
    public zoom(value: number): void {
        this.setState((state) => {
            state.zoom = this.multiplyRoundAndCrop(value * 8, 8);
            return state;
        });
    }
    public focus(_: number): void {}
    public tallyState(tallyState: 'off' | 'preview' | 'program'): void {
        this.setState((state) => {
            switch (tallyState) {
                case 'off':
                    state.green = 0;
                    state.red = 0;
                    break;
                case 'preview':
                    state.green = 255;
                    state.red = 0;
                    break;
                case 'program':
                    state.green = 0;
                    state.red = 255;
                    break;
            }
            return state;
        });
    }

    private setState(change: (state: WebsocketPtzLancCameraSpeedState) => WebsocketPtzLancCameraSpeedState): void {
        const newState = change(this.stateSubject.value);
        this.stateSubject.next(newState);
    }

    private log(toLog: string) {
        this.logger.log(`WebsocketCamera(${this.config.ip}):${toLog}`);
    }

    private logError(toLog: string) {
        this.logger.error(`WebsocketCamera(${this.config.ip}):${toLog}`);
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
