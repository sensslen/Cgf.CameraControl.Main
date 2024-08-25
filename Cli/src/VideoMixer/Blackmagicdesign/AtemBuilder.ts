import { IBuilder, IConfig, ILogger, IVideoMixer } from 'cgf.cameracontrol.main.core';
import { Atem } from './Atem';
import { AtemFactory } from './AtemFactory';
import { atemConfigurationSchema } from './IAtemConfig';
import { fromZodError } from 'zod-validation-error';

export class AtemBuilder implements IBuilder<IVideoMixer> {
    private readonly _atemFactory;
    constructor(logger: ILogger) {
        this._atemFactory = new AtemFactory(logger);
    }
    public supportedTypes(): Promise<string[]> {
        return Promise.resolve(['blackmagicdesign/atem']);
    }

    public async build(config: IConfig): Promise<IVideoMixer> {
        const parseResult = atemConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            return Promise.reject(fromZodError(parseResult.error));
        }

        const atem = new Atem(parseResult.data, this._atemFactory);
        await atem.startup();
        return atem;
    }
}
