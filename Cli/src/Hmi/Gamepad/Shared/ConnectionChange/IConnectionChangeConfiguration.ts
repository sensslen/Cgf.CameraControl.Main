import { EButtonDirection } from '../EButtonDirection';
import { z } from 'zod/v4';

export enum EConnectionChangeType {
    direct = 'direct',
    directional = 'directional',
}

export const connectionChangeConfigurationSchema = z.looseObject({
    type: z.enum(EConnectionChangeType),
});

export type IConnectionChangeDefinition = z.infer<typeof connectionChangeConfigurationSchema>;

export const directConnectionChangeConfigurationSchema = connectionChangeConfigurationSchema.extend({
    default: z.partialRecord(z.enum(EButtonDirection), z.int().nonnegative().optional()),
    alt: z.partialRecord(z.enum(EButtonDirection), z.int().nonnegative().optional()).optional(),
    altLower: z.partialRecord(z.enum(EButtonDirection), z.int().nonnegative().optional()).optional(),
});

export const directionalConnectionChangeConfigurationSchema = connectionChangeConfigurationSchema.extend({
    directions: z.record(z.int().nonnegative(), z.record(z.enum(EButtonDirection), z.int().nonnegative())),
});

export type IDirectConnectionChangeDefinition = z.infer<typeof directConnectionChangeConfigurationSchema>;
export type IDirectionalConnectionChangeDefinition = z.infer<typeof directionalConnectionChangeConfigurationSchema>;
