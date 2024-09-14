import { BehaviorSubject, Observable } from 'rxjs';
import {
    CameraConnectionFactory,
    ICameraConnection,
    IHmi,
    ILogger,
    IVideoMixer,
    VideomixerFactory,
} from 'cgf.cameracontrol.main.core';
import { EButtonDirection, IGamepadConfiguration } from './IGamepadConfiguration';

import { ConnectionChangeFactory } from './ConnectionChange/ConnectionChangeFactory';
import { IAltKeyConfiguration } from './IAltKeyConfiguration';
import { IConnectionChange } from './ConnectionChange/IConnectionChange';
import { ISpecialFunction } from './SpecialFunctions/ISpecialFunction';
import { ISpecialFunctionDefinition } from './SpecialFunctions/ISpecialFunctionDefinition';
import { SpecialFunctionFactory } from './SpecialFunctions/SpecialFunctionFactory';

enum EAltKey {
    none,
    alt,
    altLower,
}

export abstract class Gamepad implements IHmi {
    private _altKeyState = EAltKey.none;
    private readonly _mixer?: IVideoMixer;
    private readonly _cameras: { [key: number]: ICameraConnection } = {};
    private _selectedPreviewCamera?: ICameraConnection;
    private _selectedOnAirCamera?: ICameraConnection;
    private readonly _connectionChange: IConnectionChange | undefined;
    private readonly _enableChangingProgram: boolean;
    private _selectedInput = -1;

    private readonly _specialFunctionDefault: { [key in EButtonDirection]?: ISpecialFunction } = {};
    private readonly _specialFunctionAlt: { [key in EButtonDirection]?: ISpecialFunction } = {};
    private readonly _specialFunctionAltLower: { [key in EButtonDirection]?: ISpecialFunction } = {};
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);

    constructor(
        config: IGamepadConfiguration,
        private logger: ILogger,
        mixerFactory: VideomixerFactory,
        cameraConnectionFactory: CameraConnectionFactory
    ) {
        this._mixer = mixerFactory.get(config.videoMixer);

        for (const [key, value] of Object.entries(config.cameraMap)) {
            const camera = cameraConnectionFactory.get(value);
            if (camera !== undefined) {
                this._cameras[Number(key)] = camera;
            }
        }

        this._enableChangingProgram = config.enableChangingProgram;

        this.parseSpecialFunctionConfig(config.specialFunction.default, (key, config) => {
            this._specialFunctionDefault[key] = SpecialFunctionFactory.get(config, logger);
        });

        if (config.specialFunction.alt) {
            this.parseSpecialFunctionConfig(config.specialFunction.alt, (key, config) => {
                this._specialFunctionAlt[key] = SpecialFunctionFactory.get(config, logger);
            });
        }

        if (config.specialFunction.altLower) {
            this.parseSpecialFunctionConfig(config.specialFunction.altLower, (key, config) => {
                this._specialFunctionAltLower[key] = SpecialFunctionFactory.get(config, logger);
            });
        }

        this._connectionChange = ConnectionChangeFactory.get(config.connectionChange, logger);

        const connectionChangeEmitter = this._mixer?.imageSelectionChangeGet();
        if (connectionChangeEmitter !== undefined) {
            connectionChangeEmitter.on('previewChange', (preview: number, onAir: boolean) =>
                this.mixerPreviewChange(preview, onAir)
            );
            connectionChangeEmitter.on('programChange', (program: number) => {
                this.mixerProgramChange(program);
            });
        }
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectionSubject;
    }

    protected changeConnection(direction: EButtonDirection): void {
        if (this._connectionChange === undefined) {
            return;
        }

        const nextInput = this._connectionChange.next(direction, this._selectedInput, this.getAltKeyState());

        if (nextInput) {
            this._mixer?.changeInput(nextInput);
        }
    }

    protected specialFunction(key: EButtonDirection): void {
        if (this._mixer === undefined) {
            return;
        }

        let specialFunction = this._specialFunctionDefault[key];
        switch (this._altKeyState) {
            case EAltKey.alt: {
                const altVariant = this._specialFunctionAlt[key];
                if (altVariant) {
                    specialFunction = altVariant;
                }
                break;
            }
            case EAltKey.altLower: {
                const altLowerVariant = this._specialFunctionAltLower[key];
                if (altLowerVariant) {
                    specialFunction = altLowerVariant;
                }
                break;
            }
            default:
                break;
        }

        if (specialFunction) {
            specialFunction.run(this._mixer);
        }
    }

    protected pan(value: number): void {
        this._selectedPreviewCamera?.pan(value);
    }

    protected tilt(value: number): void {
        this._selectedPreviewCamera?.tilt(value);
    }

    protected zoom(value: number): void {
        this._selectedPreviewCamera?.zoom(value);
    }

    protected focus(value: number): void {
        this._selectedPreviewCamera?.focus(value);
    }

    protected cut(): void {
        if (this._enableChangingProgram) {
            this._mixer?.cut();
        }
    }

    protected auto(): void {
        if (this._enableChangingProgram) {
            this._mixer?.auto();
        }
    }

    protected altKey(press: boolean): void {
        if (press && this._altKeyState == EAltKey.none) {
            this._altKeyState = EAltKey.alt;
        } else if (!press && this._altKeyState == EAltKey.alt) {
            this._altKeyState = EAltKey.none;
        }
    }

    protected altLowerKey(press: boolean): void {
        if (press && this._altKeyState == EAltKey.none) {
            this._altKeyState = EAltKey.altLower;
        } else if (!press && this._altKeyState == EAltKey.altLower) {
            this._altKeyState = EAltKey.none;
        }
    }

    protected log(toLog: string): void {
        this.logger.log(`Gamepad:${toLog}`);
    }

    protected logError(toLog: string): void {
        this.logger.error(`Gamepad:${toLog}`);
    }

    private mixerPreviewChange(preview: number, onAir: boolean): void {
        this._selectedInput = preview;
        const selectedCamera = this._cameras[preview];
        if (selectedCamera !== this._selectedPreviewCamera) {
            if (this._selectedOnAirCamera !== this._selectedPreviewCamera) {
                this._selectedOnAirCamera?.tallyState('off');
            }
            this.zoom(0);
            this.focus(0);
            this.pan(0);
            this.tilt(0);
        }

        this._selectedPreviewCamera = selectedCamera;
        if (selectedCamera !== undefined) {
            this.printConnectionMessage(preview, selectedCamera.connectionString, onAir);
            if (this._selectedOnAirCamera !== selectedCamera) {
                selectedCamera.tallyState('preview');
            }
        } else {
            this.printConnectionMessage(preview, 'not a camera', onAir);
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
            if (this._selectedOnAirCamera !== undefined) {
                this._selectedOnAirCamera.tallyState('program');
            }
        }
    }

    private printConnectionMessage(index: number, connection: string, onAir: boolean) {
        this.log(`Selected input:${index} (${connection})${this.getOnAirMessage(onAir)}`);
    }

    private getOnAirMessage(onAir: boolean): string {
        return onAir ? ' - OnAir' : '';
    }

    private parseSpecialFunctionConfig(
        config: Partial<Record<EButtonDirection, ISpecialFunctionDefinition>>,
        run: (key: EButtonDirection, config: ISpecialFunctionDefinition) => void
    ) {
        for (const [key, value] of Object.entries(config) as [EButtonDirection, ISpecialFunctionDefinition][]) {
            if (value !== undefined) {
                run(key, value);
            }
        }
    }

    private getAltKeyState(): IAltKeyConfiguration {
        switch (this._altKeyState) {
            case EAltKey.alt:
                return { alt: true, altLower: false };
            case EAltKey.altLower:
                return { alt: false, altLower: true };
            default:
                return { alt: false, altLower: false };
        }
    }

    abstract dispose(): Promise<void>;
}
