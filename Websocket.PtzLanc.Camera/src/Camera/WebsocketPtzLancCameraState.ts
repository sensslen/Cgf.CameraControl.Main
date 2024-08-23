import { z } from 'zod';

export const speedCameraStateSchema = z.object({
    pan: z.number().min(-255).max(255).default(0),
    tilt: z.number().min(-255).max(255).default(0),
    zoom: z.number().min(-255).max(255).default(0),
    red: z.number().min(0).max(255).default(0),
    green: z.number().min(0).max(255).default(0),
});

export type WebsocketPtzLancCameraSpeedState = z.infer<typeof speedCameraStateSchema>;
