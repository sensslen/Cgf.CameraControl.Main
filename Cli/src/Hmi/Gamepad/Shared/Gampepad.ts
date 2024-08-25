import { BehaviorSubject, Observable } from 'rxjs';
import {
    CameraConnectionFactory,
    ICameraConnection,
    IHmi,
    ILogger,
    IVideoMixer,
    VideomixerFactory,
} from 'cgf.cameracontrol.main.core';
import { EButtonDirection, IConnectionChangeConfiguration, IGamepadConfiguration } from './IGamepadConfiguration';

import { ISpecialFunction } from './SpecialFunctions/ISpecialFunction';
import { ISpecialFunctionDefinition } from './SpecialFunctions/ISpecialFunctionDefinition';
import { SpecialFunctionFactory } from './SpecialFunctions/SpecialFunctionFactory';

enum EAltKey {
    none,
    alt,
    altLower,
}

export abstract class Gamepad implements IHmi {
    private altKeyState = EAltKey.none;
    private readonly mixer?: IVideoMixer;
    private readonly cameras: { [key: number]: ICameraConnection } = {};
    private selectedPreviewCamera?: ICameraConnection;
    private selectedOnAirCamera?: ICameraConnection;
    private readonly connectionChange: IConnectionChangeConfiguration;
    private readonly enableChangingProgram: boolean;

    private readonly specialFunctionDefault: { [key in EButtonDirection]?: ISpecialFunction } = {};
    private readonly specialFunctionAlt: { [key in EButtonDirection]?: ISpecialFunction } = {};
    private readonly specialFunctionAltLower: { [key in EButtonDirection]?: ISpecialFunction } = {};
    private readonly _connectionSubject = new BehaviorSubject<boolean>(false);

    constructor(
        config: IGamepadConfiguration,
        private logger: ILogger,
        mixerFactory: VideomixerFactory,
        cameraConnectionFactory: CameraConnectionFactory
    ) {
        this.mixer = mixerFactory.get(config.videoMixer);

        for (const [key, value] of Object.entries(config.cameraMap)) {
            const camera = cameraConnectionFactory.get(value);
            if (camera !== undefined) {
                this.cameras[Number(key)] = camera;
            }
        }

        this.connectionChange = config.connectionChange;
        this.enableChangingProgram = config.enableChangingProgram;

        this.parseSpecialFunctionConfig(config.specialFunction.default, (key, config) => {
            this.specialFunctionDefault[key] = SpecialFunctionFactory.get(config);
        });

        if (config.specialFunction.alt) {
            this.parseSpecialFunctionConfig(config.specialFunction.alt, (key, config) => {
                this.specialFunctionAlt[key] = SpecialFunctionFactory.get(config);
            });
        }

        if (config.specialFunction.altLower) {
            this.parseSpecialFunctionConfig(config.specialFunction.altLower, (key, config) => {
                this.specialFunctionAltLower[key] = SpecialFunctionFactory.get(config);
            });
        }

        const connectionChangeEmitter = this.mixer?.imageSelectionChangeGet();
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
        let nextInput = this.connectionChange.default[direction];
        switch (this.altKeyState) {
            case EAltKey.alt:
                if (this.connectionChange.alt) {
                    nextInput = this.connectionChange.alt[direction];
                }
                break;
            case EAltKey.altLower:
                if (this.connectionChange.altLower) {
                    nextInput = this.connectionChange.altLower[direction];
                }
                break;
            default:
                break;
        }

        if (nextInput) {
            this.mixer?.changeInput(nextInput);
        }
    }

    protected specialFunction(key: EButtonDirection): void {
        if (this.mixer === undefined) {
            return;
        }

        let specialFunction = this.specialFunctionDefault[key];
        switch (this.altKeyState) {
            case EAltKey.alt: {
                const altVariant = this.specialFunctionAlt[key];
                if (altVariant) {
                    specialFunction = altVariant;
                }
                break;
            }
            case EAltKey.altLower: {
                const altLowerVariant = this.specialFunctionAltLower[key];
                if (altLowerVariant) {
                    specialFunction = altLowerVariant;
                }
                break;
            }
            default:
                break;
        }

        if (specialFunction) {
            specialFunction.run(this.mixer);
        }
    }

    protected pan(value: number): void {
        this.selectedPreviewCamera?.pan(value);
    }

    protected tilt(value: number): void {
        this.selectedPreviewCamera?.tilt(value);
    }

    protected zoom(value: number): void {
        this.selectedPreviewCamera?.zoom(value);
    }

    protected focus(value: number): void {
        this.selectedPreviewCamera?.focus(value);
    }

    protected cut(): void {
        if (this.enableChangingProgram) {
            this.mixer?.cut();
        }
    }

    protected auto(): void {
        if (this.enableChangingProgram) {
            this.mixer?.auto();
        }
    }

    protected altKey(press: boolean): void {
        if (press && this.altKeyState == EAltKey.none) {
            this.altKeyState = EAltKey.alt;
        } else if (!press && this.altKeyState == EAltKey.alt) {
            this.altKeyState = EAltKey.none;
        }
    }

    protected altLowerKey(press: boolean): void {
        if (press && this.altKeyState == EAltKey.none) {
            this.altKeyState = EAltKey.altLower;
        } else if (!press && this.altKeyState == EAltKey.altLower) {
            this.altKeyState = EAltKey.none;
        }
    }

    protected log(toLog: string): void {
        this.logger.log(`Gamepad:${toLog}`);
    }

    protected logError(toLog: string): void {
        this.logger.error(`Gamepad:${toLog}`);
    }

    private mixerPreviewChange(preview: number, onAir: boolean): void {
        const selectedCamera = this.cameras[preview];
        if (selectedCamera !== this.selectedPreviewCamera) {
            if (this.selectedOnAirCamera !== this.selectedPreviewCamera) {
                this.selectedOnAirCamera?.tallyState('off');
            }
            this.zoom(0);
            this.focus(0);
            this.pan(0);
            this.tilt(0);
        }

        this.selectedPreviewCamera = selectedCamera;
        if (selectedCamera !== undefined) {
            this.printConnectionMessage(preview, selectedCamera.connectionString, onAir);
            if (this.selectedOnAirCamera !== selectedCamera) {
                selectedCamera.tallyState('preview');
            }
        } else {
            this.printConnectionMessage(preview, 'not a camera', onAir);
        }
    }

    private mixerProgramChange(program: number): void {
        const newOnAirCamera = this.cameras[program];
        if (newOnAirCamera !== this.selectedOnAirCamera) {
            if (this.selectedOnAirCamera !== this.selectedPreviewCamera) {
                this.selectedOnAirCamera?.tallyState('off');
            } else {
                this.selectedPreviewCamera?.tallyState('preview');
            }
            this.selectedOnAirCamera = newOnAirCamera;
            if (this.selectedOnAirCamera !== undefined) {
                this.selectedOnAirCamera.tallyState('program');
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

    abstract dispose(): Promise<void>;
}
