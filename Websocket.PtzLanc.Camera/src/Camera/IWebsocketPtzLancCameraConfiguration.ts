import { configSchema } from 'cgf.cameracontrol.main.core';
import { z } from 'zod/v4';

export const websocketPtzLancCameraConfigurationSchema = configSchema.extend({
    ip: z.string(),
    panTiltInvert: z.boolean().default(false).optional(),
    showTallyLight: z.boolean().default(true).optional(),
});

export type IWebsocketPtzLancCameraConfiguration = z.infer<typeof websocketPtzLancCameraConfigurationSchema>;
