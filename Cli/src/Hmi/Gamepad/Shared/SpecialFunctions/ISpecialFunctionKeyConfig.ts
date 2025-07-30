import { specialFunctionDefinitionConfigurationSchema } from './ISpecialFunctionDefinition';
import { z } from 'zod/v4';

export const specialFunctionKeyConfigurationSchema = specialFunctionDefinitionConfigurationSchema.extend({
    index: z.int().positive(),
});

export type ISpecialFunctionKeyConfiguration = z.infer<typeof specialFunctionKeyConfigurationSchema>;
