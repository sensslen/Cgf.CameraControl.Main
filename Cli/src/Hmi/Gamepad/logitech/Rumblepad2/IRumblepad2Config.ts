import { gamepadConfigurationSchema } from '../../Shared/IGamepadConfiguration';
import { z } from 'zod';

export const rumblepad2ConfigurationShema = gamepadConfigurationSchema
    .extend({
        serialNumber: z.string().optional(),
    })
    .passthrough();

export type IRumblepad2Config = z.infer<typeof rumblepad2ConfigurationShema>;
