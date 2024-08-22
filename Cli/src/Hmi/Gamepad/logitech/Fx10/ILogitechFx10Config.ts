import { gamepadConfigurationSchema } from '../../Shared/IGamepadConfiguration';
import { z } from 'zod';

export const logitechFx10ConfigurationShema = gamepadConfigurationSchema
    .extend({
        serialNumber: z.string().optional(),
    })
    .passthrough();

export type ILogitechFx10Config = z.infer<typeof logitechFx10ConfigurationShema>;
