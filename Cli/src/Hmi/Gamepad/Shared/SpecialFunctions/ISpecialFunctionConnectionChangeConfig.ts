import { specialFunctionDefinitionConfigurationSchema } from './ISpecialFunctionDefinition';
import { z } from 'zod/v4';

export const specialFunctionConnectionChangeConfigurationSchema = specialFunctionDefinitionConfigurationSchema.extend({
    index: z.int().positive(),
});

export type ISpecialFunctionConnectionChangeConfig = z.infer<typeof specialFunctionConnectionChangeConfigurationSchema>;
