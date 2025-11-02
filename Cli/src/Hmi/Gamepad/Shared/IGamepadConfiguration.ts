import { EButtonDirection } from './EButtonDirection';
import { configSchema } from 'cgf.cameracontrol.main.core';
import { connectionChangeConfigurationSchema } from './ConnectionChange/IConnectionChangeConfiguration';
import { specialFunctionDefinitionConfigurationSchema } from './SpecialFunctions/ISpecialFunctionDefinition';
import { z } from 'zod/v4';

export const gamepadConfigurationSchema = configSchema.extend({
    videoMixer: z.int().positive(),
    connectionChange: connectionChangeConfigurationSchema,
    specialFunction: z.object({
        default: z.partialRecord(z.enum(EButtonDirection), specialFunctionDefinitionConfigurationSchema),
        alt: z.partialRecord(z.enum(EButtonDirection), specialFunctionDefinitionConfigurationSchema).optional(),
        altLower: z.partialRecord(z.enum(EButtonDirection), specialFunctionDefinitionConfigurationSchema).optional(),
    }),
    /**
     * This map maps camera indexes to the mixer's input channel.
     * In the map the key is the input number on the mixer and the value is
     * the camera index in the configuration
     */
    cameraMap: z
        .record(z.string().regex(/^\d+$/, 'Key must be a non-negative integer'), z.int().nonnegative())
        .transform((obj) => {
            const result: Record<number, number> = {};
            for (const [key, value] of Object.entries(obj)) {
                const numKey = parseInt(key, 10);
                result[numKey] = value;
            }
            return result;
        }),
    enableChangingProgram: z.boolean().default(true),
});

export type IGamepadConfiguration = z.infer<typeof gamepadConfigurationSchema>;
export { EButtonDirection };
