import { z } from 'zod';

export const configSchema = z
    .object({
        instance: z.number(),
        type: z.string(),
    })
    .passthrough();

export type IConfig = z.infer<typeof configSchema>;
