import { BehaviorSubject, Observable } from 'rxjs';
import {
    CameraConnectionFactory,
    ICameraConnection,
    IHmi,
    ILogger,
    IVideoMixer,
    VideomixerFactory,
} from 'cgf.cameracontrol.main.core';
import { Key, emitKeypressEvents } from 'readline';

import { IKeyboardConfiguration } from './IKeyboardConfiguration';

type MixerTransition = 'cut' | 'auto';

export class Keyboard implements IHmi {
    private readonly _mixer?: IVideoMixer;
    private readonly _cameras: { [key: number]: ICameraConnection } = {};
    private readonly _moveSpeed: number;
    private readonly _stopDelayMs: number;
    private readonly _enterAction?: MixerTransition;
    private readonly _spaceAction?: MixerTransition;
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);
    private readonly _keypressListener: (str: string | undefined, key: Key | undefined) => void;
    private _selectedPreviewCamera?: ICameraConnection;
    private _selectedOnAirCamera?: ICameraConnection;
    private _panStopTimeout?: NodeJS.Timeout;
    private _tiltStopTimeout?: NodeJS.Timeout;

    constructor(
        config: IKeyboardConfiguration,
        private logger: ILogger,
        mixerFactory: VideomixerFactory,
        cameraConnectionFactory: CameraConnectionFactory
    ) {
        this._moveSpeed = config.moveSpeed;
        this._stopDelayMs = config.stopDelayMs;
        this._enterAction = config.transitionKeys?.enter;
        this._spaceAction = config.transitionKeys?.space;
        this._mixer = mixerFactory.get(config.videoMixer);

        for (const [key, value] of Object.entries(config.cameraMap)) {
            const camera = cameraConnectionFactory.get(value);
            if (camera !== undefined) {
                this._cameras[Number(key)] = camera;
            }
        }

        const connectionChangeEmitter = this._mixer?.imageSelectionChangeGet();
        if (connectionChangeEmitter !== undefined) {
            connectionChangeEmitter.on('previewChange', (preview: number, onAir: boolean) =>
                this.mixerPreviewChange(preview, onAir)
            );
            connectionChangeEmitter.on('programChange', (program: number) => this.mixerProgramChange(program));
        }

        this._keypressListener = (str, key) => this.handleKeypress(str, key);
        this.startReading();
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    public dispose(): Promise<void> {
        this.stopReading();
        clearTimeout(this._panStopTimeout);
        clearTimeout(this._tiltStopTimeout);
        return Promise.resolve();
    }

    private startReading(): void {
        const stdin = process.stdin;
        if (!stdin.isTTY) {
            this.logError('cannot read the keyboard because the standard input is not a terminal (TTY)');
            return;
        }

        emitKeypressEvents(stdin);
        stdin.setRawMode(true);
        stdin.on('keypress', this._keypressListener);
        this._connectionSubject.next(true);
        this.log('ready - use the arrow keys to move and the keys 1-9 to select a camera (ctrl+c to quit)');
    }

    private stopReading(): void {
        const stdin = process.stdin;
        stdin.off('keypress', this._keypressListener);
        if (stdin.isTTY) {
            stdin.setRawMode(false);
        }
        this._connectionSubject.next(false);
    }

    private handleKeypress(str: string | undefined, key: Key | undefined): void {
        if (key === undefined) {
            return;
        }

        // Ctrl+c does not raise SIGINT while the terminal is in raw mode, so we
        // have to restore the terminal and terminate the application ourselves.
        if (key.ctrl && key.name === 'c') {
            this.log('received ctrl+c - shutting down');
            this.stopReading();
            process.exit(0);
        }

        switch (key.name) {
            case 'left':
                this.move('pan', -this._moveSpeed);
                return;
            case 'right':
                this.move('pan', this._moveSpeed);
                return;
            case 'up':
                this.move('tilt', this._moveSpeed);
                return;
            case 'down':
                this.move('tilt', -this._moveSpeed);
                return;
            case 'return':
            case 'enter':
                this.runTransition(this._enterAction);
                return;
            case 'space':
                this.runTransition(this._spaceAction);
                return;
        }

        if (str !== undefined && /^[1-9]$/.test(str)) {
            this._mixer?.changeInput(Number(str));
        }
    }

    private runTransition(action?: MixerTransition): void {
        switch (action) {
            case 'cut':
                this._mixer?.cut();
                return;
            case 'auto':
                this._mixer?.auto();
                return;
        }
    }

    private move(axis: 'pan' | 'tilt', value: number): void {
        const camera = this._selectedPreviewCamera;
        if (camera === undefined) {
            return;
        }

        if (axis === 'pan') {
            camera.pan(value);
            clearTimeout(this._panStopTimeout);
            this._panStopTimeout = setTimeout(() => camera.pan(0), this._stopDelayMs);
        } else {
            camera.tilt(value);
            clearTimeout(this._tiltStopTimeout);
            this._tiltStopTimeout = setTimeout(() => camera.tilt(0), this._stopDelayMs);
        }
    }

    private mixerPreviewChange(preview: number, onAir: boolean): void {
        const selectedCamera = this._cameras[preview];
        if (selectedCamera !== this._selectedPreviewCamera) {
            if (this._selectedOnAirCamera !== this._selectedPreviewCamera) {
                this._selectedPreviewCamera?.tallyState('off');
            }
            // stop any residual movement on the previously selected camera
            clearTimeout(this._panStopTimeout);
            clearTimeout(this._tiltStopTimeout);
            this._selectedPreviewCamera?.pan(0);
            this._selectedPreviewCamera?.tilt(0);
        }

        this._selectedPreviewCamera = selectedCamera;
        if (selectedCamera !== undefined) {
            this.log(`selected input:${preview} (${selectedCamera.connectionString})${onAir ? ' - OnAir' : ''}`);
            if (this._selectedOnAirCamera !== selectedCamera) {
                selectedCamera.tallyState('preview');
            }
        } else {
            this.log(`selected input:${preview} (not a camera)${onAir ? ' - OnAir' : ''}`);
        }
    }

    private mixerProgramChange(program: number): void {
        const newOnAirCamera = this._cameras[program];
        if (newOnAirCamera !== this._selectedOnAirCamera) {
            if (this._selectedOnAirCamera !== this._selectedPreviewCamera) {
                this._selectedOnAirCamera?.tallyState('off');
            } else {
                this._selectedPreviewCamera?.tallyState('preview');
            }
            this._selectedOnAirCamera = newOnAirCamera;
            this._selectedOnAirCamera?.tallyState('program');
        }
    }

    private log(toLog: string): void {
        this.logger.log(`Keyboard:${toLog}`);
    }

    private logError(toLog: string): void {
        this.logger.error(`Keyboard:${toLog}`);
    }
}
