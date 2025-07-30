import { z } from 'zod/v4';

export enum ESpecialFunctionType {
    key = 'key',
    macroLoop = 'macroLoop',
    connectionChange = 'connectionChange',
    macroToggle = 'macroToggle',
}

export const specialFunctionDefinitionConfigurationSchema = z.looseObject({
    type: z.enum(ESpecialFunctionType),
});

export type ISpecialFunctionDefinition = z.infer<typeof specialFunctionDefinitionConfigurationSchema>;
