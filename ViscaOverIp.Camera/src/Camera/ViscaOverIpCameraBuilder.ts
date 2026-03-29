import { IBuilder, ICameraConnection, IConfig, ILogger } from 'cgf.cameracontrol.main.core';
import { ViscaOverIpCamera } from './ViscaOverIpCamera';
import { fromZodError } from 'zod-validation-error';
import { viscaOverIpCameraConfigurationSchema } from './IViscaOverIpCameraConfiguration';

export class ViscaOverIpCameraBuilder implements IBuilder<ICameraConnection> {
    constructor(private logger: ILogger) {}

    public supportedTypes(): Promise<string[]> {
        return Promise.resolve(['viscaoverip']);
    }

    public build(config: IConfig): Promise<ICameraConnection> {
        const parseResult = viscaOverIpCameraConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            return Promise.reject(fromZodError(parseResult.error));
        }

        return Promise.resolve(new ViscaOverIpCamera(parseResult.data, this.logger));
    }
}
