import { configSchema } from 'cgf.cameracontrol.main.core';
import { z } from 'zod/v4';

export const atemConfigurationSchema = configSchema.extend({
    ip: z.string(),
    mixEffectBlock: z.int().nonnegative(),
});

export type IAtemConfiguration = z.infer<typeof atemConfigurationSchema>;
