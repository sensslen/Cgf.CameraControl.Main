import { ESpecialFunctionType, ISpecialFunctionDefinition } from './ISpecialFunctionDefinition';
import { ConnectionChangeSpecialFunction } from './ConnectionChangeSpecialFunction';
import { ILogger } from 'cgf.cameracontrol.main.core';
import { ISpecialFunction } from './ISpecialFunction';
import { KeySpecialFunction } from './KeySpecialFunction';
import { MacroLoopSpecialFunction } from './Macro/MacroLoopSpecialFunction';
import { MacroToggleSpecialFunction } from './Macro/Toggle/MacroToggleSpecialFunction';
import { specialFunctionConnectionChangeConfigurationSchema } from './ISpecialFunctionConnectionChangeConfig';
import { specialFunctionKeyConfigurationSchema } from './ISpecialFunctionKeyConfig';
import { specialFunctionMacroLoopConfigurationSchema } from './Macro/ISpecialFunctionMacroLoopConfig';
import { specialFunctionMacroToggleConfigurationSchema } from './Macro/Toggle/ISpecialFunctionMacroToggleConfig';

export class SpecialFunctionFactory {
    public static get(config: ISpecialFunctionDefinition, logger: ILogger): ISpecialFunction | undefined {
        switch (config.type) {
            case ESpecialFunctionType.key:
                return SpecialFunctionFactory.buildKeySpecialFunction(config, logger);
            case ESpecialFunctionType.macroLoop:
                return SpecialFunctionFactory.buildMacroLoopSpecialFunction(config, logger);
            case ESpecialFunctionType.connectionChange:
                return SpecialFunctionFactory.buildConnectionChangeSpecialFunction(config, logger);
            case ESpecialFunctionType.macroToggle:
                return SpecialFunctionFactory.buildMacroToggleSpecialFunction(config, logger);
            default:
                return undefined;
        }
    }

    private static buildKeySpecialFunction(
        config: ISpecialFunctionDefinition,
        logger: ILogger
    ): ISpecialFunction | undefined {
        const parseResult = specialFunctionKeyConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse key special function configuration: ${parseResult.error}`);
            return undefined;
        }

        return new KeySpecialFunction(parseResult.data);
    }

    private static buildMacroLoopSpecialFunction(
        config: ISpecialFunctionDefinition,
        logger: ILogger
    ): ISpecialFunction | undefined {
        const parseResult = specialFunctionMacroLoopConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse macro loop special function configuration: ${parseResult.error}`);
            return undefined;
        }

        return new MacroLoopSpecialFunction(parseResult.data);
    }

    private static buildConnectionChangeSpecialFunction(
        config: ISpecialFunctionDefinition,
        logger: ILogger
    ): ISpecialFunction | undefined {
        const parseResult = specialFunctionConnectionChangeConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse connection change special function configuration: ${parseResult.error}`);
            return undefined;
        }

        return new ConnectionChangeSpecialFunction(parseResult.data);
    }

    private static buildMacroToggleSpecialFunction(
        config: ISpecialFunctionDefinition,
        logger: ILogger
    ): ISpecialFunction | undefined {
        const parseResult = specialFunctionMacroToggleConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse macro toggle special function configuration: ${parseResult.error}`);
            return undefined;
        }

        return new MacroToggleSpecialFunction(parseResult.data, logger);
    }
}
