import { specialFunctionDefinitionConfigurationSchema } from './ISpecialFunctionDefinition';
import { z } from 'zod';

export const specialFunctionKeyConfigurationSchema = specialFunctionDefinitionConfigurationSchema
    .extend({
        index: z.number().int().positive(),
    })
    .passthrough();

export type ISpecialFunctionKeyConfiguration = z.infer<typeof specialFunctionKeyConfigurationSchema>;
