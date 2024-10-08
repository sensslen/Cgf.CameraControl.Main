import { BehaviorSubject, Observable } from 'rxjs';
import { WebsocketPtzLancCameraSpeedState, speedCameraStateSchema } from './WebsocketPtzLancCameraState';
import { ICameraConnection } from 'cgf.cameracontrol.main.core';
import { ILogger } from 'cgf.cameracontrol.main.core';
import { IWebsocketPtzLancCameraConfiguration } from './IWebsocketPtzLancCameraConfiguration';
import WS from 'ws';
import { WebSocket } from 'partysocket';

export class WebsocketPtzLancCamera implements ICameraConnection {
    private _websocket: WebSocket;
    private _requestState = speedCameraStateSchema.parse({});
    private _canSend = false;
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);

    constructor(
        private readonly config: IWebsocketPtzLancCameraConfiguration,
        private readonly logger: ILogger
    ) {
        const connectionId = `ws://${this.config.ip}/ws`;
        this._websocket = new WebSocket(connectionId, null, {
            /* eslint-disable @typescript-eslint/naming-convention */
            WebSocket: WS,
            /* eslint-enable @typescript-eslint/naming-convention */
        });

        this._websocket.onopen = (_) => {
            this.log(`websocket connected: ${connectionId}`);
            this._connectionSubject.next(true);
        };

        this._websocket.onerror = (errorevent) => {
            this.log(`websocket error on connection: ${connectionId}\n${errorevent.message}\n${errorevent.error}`);
        };

        this._websocket.onclose = (closeevent) => {
            this.log(
                `websocket closed - trying automatic reconnect: ${connectionId}\n${closeevent.code}-${closeevent.reason}`
            );
            this._connectionSubject.next(false);
        };

        this._websocket.onmessage = (message) => {
            const parseResult = speedCameraStateSchema.safeParse(message.data);
            if (parseResult.success !== false && !this.equals(this._requestState, parseResult.data)) {
                this.send();
            } else {
                this._canSend = true;
            }
        };
    }

    public get connectionString(): string {
        return this._websocket.url;
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    public async dispose(): Promise<void> {
        try {
            this._websocket.close();
        } catch (error) {
            this.logError(`unable to stop socket connection - ${error}`);
        }
    }

    public pan(value: number): void {
        value = this.interpolateSpeed(value);
        this.setState((state) => {
            state.pan = this.invertIfNecessaryForPanTilt(this.multiplyRoundAndCrop(value * 255, 255));
            return state;
        });
    }
    public tilt(value: number): void {
        value = this.interpolateSpeed(value);
        this.setState((state) => {
            state.tilt = this.invertIfNecessaryForPanTilt(this.multiplyRoundAndCrop(value * 255, 255));
            return state;
        });
    }
    public zoom(value: number): void {
        this.setState((state) => {
            state.zoom = this.multiplyRoundAndCrop(value * 255, 255);
            return state;
        });
    }
    public focus(_: number): void {}
    public tallyState(tallyState: 'off' | 'preview' | 'program'): void {
        if (this.config.showTallyLight) {
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
    }

    private setState(change: (state: WebsocketPtzLancCameraSpeedState) => WebsocketPtzLancCameraSpeedState): void {
        this._requestState = change(this._requestState);
        if (this._canSend) {
            this.send();
        }
    }

    private log(toLog: string) {
        this.logger.log(`WebsocketCamera(${this.config.ip}):${toLog}`);
    }

    private logError(toLog: string) {
        this.logger.error(`WebsocketCamera(${this.config.ip}):${toLog}`);
    }
    private interpolateSpeed(input: number): number {
        if (input > 0) {
            return input * input;
        } else {
            return -input * input;
        }
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

    private equals(value1: WebsocketPtzLancCameraSpeedState, value2: WebsocketPtzLancCameraSpeedState): boolean {
        const equal = value1.pan === value2.pan && value1.tilt === value2.tilt && value1.zoom === value2.zoom;

        if (this.config.showTallyLight) {
            return equal && value1.red === value2.red && value1.green === value2.green;
        }
        return equal;
    }

    private send() {
        this._canSend = false;
        this._websocket.send(JSON.stringify(this._requestState));
    }
}
