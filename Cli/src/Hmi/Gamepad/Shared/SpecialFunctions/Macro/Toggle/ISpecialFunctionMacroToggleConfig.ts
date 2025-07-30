import { specialFunctionDefinitionConfigurationSchema } from '../../ISpecialFunctionDefinition';

export enum EMacroToggleConditionType {
    key = 'key',
    auxSelection = 'aux_selection',
}

import { z } from 'zod/v4';

export const specialFunctionMacroToggleConditionConfigurationSchema = z.looseObject({
    type: z.enum(EMacroToggleConditionType),
});

export type ISpecialFunctionMacroToggleConditionConfiguration = z.infer<
    typeof specialFunctionMacroToggleConditionConfigurationSchema
>;

export const specialFunctionMacroToggleConfigurationSchema = specialFunctionDefinitionConfigurationSchema.extend({
    indexOn: z.int().nonnegative(),
    indexOff: z.int().nonnegative(),
    condition: specialFunctionMacroToggleConditionConfigurationSchema,
});

export type ISpecialFunctionMacroToggleConfiguration = z.infer<typeof specialFunctionMacroToggleConfigurationSchema>;

export const specialFunctionMacroToggleConfigConditionKeyConfigurationSchema =
    specialFunctionMacroToggleConditionConfigurationSchema.extend({
        key: z.int().nonnegative(),
    });

export type ISpecialFunctionMacroToggleConfigConditionKeyConfiguration = z.infer<
    typeof specialFunctionMacroToggleConfigConditionKeyConfigurationSchema
>;

export const specialFunctionMacroToggleConfigConditionAuxSelectionConfigurationSchema =
    specialFunctionMacroToggleConditionConfigurationSchema.extend({
        aux: z.int().nonnegative(),
        selection: z.int().nonnegative(),
    });

export type ISpecialFunctionMacroToggleConfigConditionAuxSelectionConfiguration = z.infer<
    typeof specialFunctionMacroToggleConfigConditionAuxSelectionConfigurationSchema
>;
