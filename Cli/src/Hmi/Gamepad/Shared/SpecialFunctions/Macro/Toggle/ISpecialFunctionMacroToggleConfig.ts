import { specialFunctionDefinitionConfigurationSchema } from '../../ISpecialFunctionDefinition';

export enum EMacroToggleConditionType {
    key = 'key',
    auxSelection = 'aux_selection',
}

import { z } from 'zod';

export const specialFunctionMacroToggleConditionConfigurationSchema = z
    .object({
        type: z.nativeEnum(EMacroToggleConditionType),
    })
    .passthrough();

export type ISpecialFunctionMacroToggleConditionConfiguration = z.infer<
    typeof specialFunctionMacroToggleConditionConfigurationSchema
>;

export const specialFunctionMacroToggleConfigurationSchema = specialFunctionDefinitionConfigurationSchema
    .extend({
        indexOn: z.number().int().nonnegative(),
        indexOff: z.number().int().nonnegative(),
        condition: specialFunctionMacroToggleConditionConfigurationSchema,
    })
    .passthrough();

export type ISpecialFunctionMacroToggleConfiguration = z.infer<typeof specialFunctionMacroToggleConfigurationSchema>;

export const specialFunctionMacroToggleConfigConditionKeyConfigurationSchema =
    specialFunctionMacroToggleConditionConfigurationSchema
        .extend({
            key: z.number().int().nonnegative(),
        })
        .passthrough();

export type ISpecialFunctionMacroToggleConfigConditionKeyConfiguration = z.infer<
    typeof specialFunctionMacroToggleConfigConditionKeyConfigurationSchema
>;

export const specialFunctionMacroToggleConfigConditionAuxSelectionConfigurationSchema =
    specialFunctionMacroToggleConditionConfigurationSchema
        .extend({
            aux: z.number().int().nonnegative(),
            selection: z.number().int().nonnegative(),
        })
        .passthrough();

export type ISpecialFunctionMacroToggleConfigConditionAuxSelectionConfiguration = z.infer<
    typeof specialFunctionMacroToggleConfigConditionAuxSelectionConfigurationSchema
>;
