import { configSchema } from 'cgf.cameracontrol.main.core';
import { z } from 'zod/v4';

export const keyboardConfigurationSchema = configSchema.extend({
    videoMixer: z.int().positive(),
    /**
     * This map maps the mixer's input channel to a camera index.
     * The key is the input number on the mixer (which is also the number key
     * that selects it) and the value is the camera index in the configuration.
     */
    cameraMap: z
        .record(z.string().regex(/^\d+$/, 'Key must be a non-negative integer'), z.int().nonnegative())
        .transform((obj) => {
            const result: Record<number, number> = {};
            for (const [key, value] of Object.entries(obj)) {
                const numKey = parseInt(key, 10);
                result[numKey] = value;
            }
            return result;
        }),
    /**
     * The speed (in the range ]0 .. 1]) at which the camera pans/tilts while an
     * arrow key is held.
     */
    moveSpeed: z.number().gt(0).max(1).default(1),
    /**
     * The time in milliseconds after the last arrow key event before the camera
     * movement is stopped. This needs to be larger than the operating system's
     * key repeat interval so that holding an arrow key results in continuous
     * movement.
     */
    stopDelayMs: z.int().positive().default(250),
    /**
     * Optional mixer transitions bound to the Enter and Space keys.
     * 'cut' performs an immediate cut from preview to program, 'auto' performs
     * an auto (transitioned) cut. Either key may be omitted to leave it
     * unassigned.
     */
    transitionKeys: z
        .object({
            enter: z.enum(['cut', 'auto']).optional(),
            space: z.enum(['cut', 'auto']).optional(),
        })
        .optional(),
});

export type IKeyboardConfiguration = z.infer<typeof keyboardConfigurationSchema>;
