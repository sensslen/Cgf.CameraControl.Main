import { specialFunctionDefinitionConfigurationSchema } from '../ISpecialFunctionDefinition';
import { z } from 'zod/v4';

export const specialFunctionMacroLoopConfigurationSchema = specialFunctionDefinitionConfigurationSchema.extend({
    indexes: z.array(z.number()).min(1),
});

export type ISpecialFunctionMacroLoopConfig = z.infer<typeof specialFunctionMacroLoopConfigurationSchema>;
