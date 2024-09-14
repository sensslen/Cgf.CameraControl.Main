import { EButtonDirection } from './EButtonDirection';
import { configSchema } from 'cgf.cameracontrol.main.core';
import { connectionChangeConfigurationSchema } from './ConnectionChange/IConnectionChangeConfiguration';
import { specialFunctionDefinitionConfigurationSchema } from './SpecialFunctions/ISpecialFunctionDefinition';
import { z } from 'zod';

export const gamepadConfigurationSchema = configSchema
    .extend({
        videoMixer: z.number().int().positive(),
        connectionChange: connectionChangeConfigurationSchema,
        specialFunction: z.object({
            default: z.record(z.nativeEnum(EButtonDirection), specialFunctionDefinitionConfigurationSchema),
            alt: z.record(z.nativeEnum(EButtonDirection), specialFunctionDefinitionConfigurationSchema).optional(),
            altLower: z.record(z.nativeEnum(EButtonDirection), specialFunctionDefinitionConfigurationSchema).optional(),
        }),
        /**
         * This map maps camera indexes to the mixer's input channel.
         * In the map the key is the input number on the mixer and the value is
         * the camera index in the configuration
         */
        cameraMap: z.record(z.coerce.number().int().nonnegative(), z.number().int().nonnegative()),
        enableChangingProgram: z.boolean().default(true),
    })
    .passthrough();

export type IConnectionChangeConfiguration = z.infer<typeof connectionChangeConfigurationSchema>;
export type IGamepadConfiguration = z.infer<typeof gamepadConfigurationSchema>;
export { EButtonDirection };
