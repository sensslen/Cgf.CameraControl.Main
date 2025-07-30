import { configSchema } from 'cgf.cameracontrol.main.core';
import { z } from 'zod/v4';

export const signalrPtzLancCameraConfigurationSchema = configSchema.extend({
    connectionUrl: z.string(),
    connectionPort: z.string(),
    panTiltInvert: z.boolean().default(false).optional(),
});

export type ISignalrPtzLancCameraConfiguration = z.infer<typeof signalrPtzLancCameraConfigurationSchema>;
