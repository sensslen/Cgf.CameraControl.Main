import { configSchema } from './IConfig';
import { z } from 'zod';

export const rootConfigSchema = z
    .object({
        cams: configSchema.array(),
        videoMixers: configSchema.array(),
        interfaces: configSchema.array(),
    })
    .passthrough();

export type IRootConfig = z.infer<typeof rootConfigSchema>;
