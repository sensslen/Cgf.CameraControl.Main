import { EButtonDirection } from '../EButtonDirection';
import { z } from 'zod';

export enum EConnectionChangeType {
    direct = 'direct',
    directional = 'directional',
}

export const connectionChangeConfigurationSchema = z
    .object({
        type: z.nativeEnum(EConnectionChangeType),
    })
    .passthrough();

export type IConnectionChangeDefinition = z.infer<typeof connectionChangeConfigurationSchema>;

export const directConnectionChangeConfigurationSchema = connectionChangeConfigurationSchema
    .extend({
        default: z.record(z.nativeEnum(EButtonDirection), z.number().int().nonnegative().optional()),
        alt: z.record(z.nativeEnum(EButtonDirection), z.number().int().nonnegative().optional()).optional(),
        altLower: z.record(z.nativeEnum(EButtonDirection), z.number().int().nonnegative().optional()).optional(),
    })
    .passthrough();

export const directionalConnectionChangeConfigurationSchema = connectionChangeConfigurationSchema
    .extend({
        directions: z.record(
            z.coerce.number().int().nonnegative(),
            z.record(z.nativeEnum(EButtonDirection), z.number().int().nonnegative())
        ),
    })
    .passthrough();

export type IDirectConnectionChangeDefinition = z.infer<typeof directConnectionChangeConfigurationSchema>;
export type IDirectionalConnectionChangeDefinition = z.infer<typeof directionalConnectionChangeConfigurationSchema>;
