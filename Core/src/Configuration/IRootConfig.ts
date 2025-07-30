import { configSchema } from './IConfig';
import { z } from 'zod/v4';

export const rootConfigSchema = z.looseObject({
    cams: configSchema.array(),
    videoMixers: configSchema.array(),
    interfaces: configSchema.array(),
});

export type IRootConfig = z.infer<typeof rootConfigSchema>;
