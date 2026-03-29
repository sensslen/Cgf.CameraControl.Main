import { configSchema } from 'cgf.cameracontrol.main.core';
import { z } from 'zod/v4';

export const viscaOverIpCameraConfigurationSchema = configSchema.extend({
    ip: z.string(),
    port: z.number().default(52381).optional(),
    panTiltInvert: z.boolean().default(false).optional(),
    // Add tallyMode to support vendor-specific tally payloads
    tallyMode: z.enum(['none', 'sony-lumens', 'avonic', 'ptzoptics']).default('none').optional(),
});

export type IViscaOverIpCameraConfiguration = z.infer<typeof viscaOverIpCameraConfigurationSchema>;
