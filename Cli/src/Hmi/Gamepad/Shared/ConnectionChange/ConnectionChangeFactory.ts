import {
    EConnectionChangeType,
    IConnectionChangeDefinition,
    directConnectionChangeConfigurationSchema,
    directionalConnectionChangeConfigurationSchema,
} from './IConnectionChangeConfiguration';

import { DirectConnectionChange } from './DirectConnectionChange';
import { DirectionalConnectionChange } from './DirectionalConnectionChange';
import { IConnectionChange } from './IConnectionChange';
import { ILogger } from 'cgf.cameracontrol.main.core';

export class ConnectionChangeFactory {
    public static get(config: IConnectionChangeDefinition, logger: ILogger): IConnectionChange | undefined {
        switch (config.type) {
            case EConnectionChangeType.direct:
                return ConnectionChangeFactory.buildDirect(config, logger);
            case EConnectionChangeType.directional:
                return ConnectionChangeFactory.buildDirectional(config, logger);
            default:
                logger.error(`Unknown connection change type: ${config.type}`);
                return undefined;
        }
    }

    private static buildDirect(config: IConnectionChangeDefinition, logger: ILogger): IConnectionChange | undefined {
        const parseResult = directConnectionChangeConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse key special function configuration: ${parseResult.error}`);
            return undefined;
        }

        return new DirectConnectionChange(parseResult.data);
    }

    private static buildDirectional(
        config: IConnectionChangeDefinition,
        logger: ILogger
    ): IConnectionChange | undefined {
        const parseResult = directionalConnectionChangeConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse key special function configuration: ${parseResult.error}`);
            return undefined;
        }

        return new DirectionalConnectionChange(parseResult.data);
    }
}
