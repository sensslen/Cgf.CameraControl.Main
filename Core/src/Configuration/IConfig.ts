import { z } from 'zod/v4';

export const configSchema = z.looseObject({
    instance: z.number(),
    type: z.string(),
});

export type IConfig = z.infer<typeof configSchema>;
