import { CameraConnectionFactory, IBuilder, IHmi, VideomixerFactory } from 'cgf.cameracontrol.main.core';
import { IConfig } from 'cgf.cameracontrol.main.core';
import { ILogger } from 'cgf.cameracontrol.main.core';
import { Keyboard } from './Keyboard';
import { fromZodError } from 'zod-validation-error';
import { keyboardConfigurationSchema } from './IKeyboardConfiguration';

export class KeyboardBuilder implements IBuilder<IHmi> {
    constructor(
        private logger: ILogger,
        private mixerFactory: VideomixerFactory,
        private cameraFactory: CameraConnectionFactory
    ) {}
    public supportedTypes(): Promise<string[]> {
        return Promise.resolve(['keyboard']);
    }

    public build(config: IConfig): Promise<IHmi> {
        const parseResult = keyboardConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            return Promise.reject(fromZodError(parseResult.error));
        }

        return Promise.resolve(new Keyboard(parseResult.data, this.logger, this.mixerFactory, this.cameraFactory));
    }
}
