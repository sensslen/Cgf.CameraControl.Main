import { z } from 'zod';

export enum ESpecialFunctionType {
    key = 'key',
    macroLoop = 'macroLoop',
    connectionChange = 'connectionChange',
    macroToggle = 'macroToggle',
}

export const specialFunctionDefinitionConfigurationSchema = z
    .object({
        type: z.nativeEnum(ESpecialFunctionType),
    })
    .passthrough();

export type ISpecialFunctionDefinition = z.infer<typeof specialFunctionDefinitionConfigurationSchema>;
