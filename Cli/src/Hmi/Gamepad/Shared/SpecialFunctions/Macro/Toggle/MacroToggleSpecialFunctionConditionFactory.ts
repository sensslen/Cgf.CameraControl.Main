import {
    EMacroToggleConditionType,
    ISpecialFunctionMacroToggleConditionConfiguration,
    specialFunctionMacroToggleConfigConditionAuxSelectionConfigurationSchema,
    specialFunctionMacroToggleConfigConditionKeyConfigurationSchema,
} from './ISpecialFunctionMacroToggleConfig';
import { ILogger } from 'cgf.cameracontrol.main.core';
import { IMacroToggleSpecialFunctionCondition } from './IMacroToggleSpecialFunctionCondition';
import { MacroToggleSpecialFunctionConditionAuxSelection } from './MacroToggleSpecialFunctionConditionAuxSelection';
import { MacroToggleSpecialFunctionConditionKey } from './MacroToggleSpecialFunctionConditionKey';
import { fromZodError } from 'zod-validation-error';

export class MacroToggleSpecialFunctionConditionFactory {
    public static get(
        config: ISpecialFunctionMacroToggleConditionConfiguration,
        logger: ILogger
    ): IMacroToggleSpecialFunctionCondition | undefined {
        switch (config.type) {
            case EMacroToggleConditionType.key:
                return MacroToggleSpecialFunctionConditionFactory.getKeyCondition(config, logger);
            case EMacroToggleConditionType.auxSelection:
                return MacroToggleSpecialFunctionConditionFactory.getAuxSelectionCondition(config, logger);
            default:
                return undefined;
        }
    }

    private static getKeyCondition(
        config: ISpecialFunctionMacroToggleConditionConfiguration,
        logger: ILogger
    ): IMacroToggleSpecialFunctionCondition | undefined {
        const parseResult = specialFunctionMacroToggleConfigConditionKeyConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse key condition configuration: ${fromZodError(parseResult.error)}`);
            return undefined;
        }
        return new MacroToggleSpecialFunctionConditionKey(parseResult.data);
    }

    private static getAuxSelectionCondition(
        config: ISpecialFunctionMacroToggleConditionConfiguration,
        logger: ILogger
    ): IMacroToggleSpecialFunctionCondition | undefined {
        const parseResult = specialFunctionMacroToggleConfigConditionAuxSelectionConfigurationSchema.safeParse(config);
        if (parseResult.success === false) {
            logger.error(`Failed to parse aux selection condition configuration: ${fromZodError(parseResult.error)}`);
            return undefined;
        }
        return new MacroToggleSpecialFunctionConditionAuxSelection(parseResult.data);
    }
}
