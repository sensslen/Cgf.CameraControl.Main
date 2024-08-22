import { specialFunctionDefinitionConfigurationSchema } from '../ISpecialFunctionDefinition';
import { z } from 'zod';

export const specialFunctionMacroLoopConfigurationSchema = specialFunctionDefinitionConfigurationSchema
    .extend({
        indexes: z.array(z.number()).min(1),
    })
    .passthrough();

export type ISpecialFunctionMacroLoopConfig = z.infer<typeof specialFunctionMacroLoopConfigurationSchema>;
