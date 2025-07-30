import { gamepadConfigurationSchema } from '../../Shared/IGamepadConfiguration';
import { z } from 'zod/v4';

export const rumblepad2ConfigurationShema = gamepadConfigurationSchema.extend({
    serialNumber: z.string().optional(),
});

export type IRumblepad2Config = z.infer<typeof rumblepad2ConfigurationShema>;
