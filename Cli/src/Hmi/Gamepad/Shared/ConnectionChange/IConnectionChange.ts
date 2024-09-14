import { EButtonDirection } from '../EButtonDirection';
import { IAltKeyConfiguration } from '../IAltKeyConfiguration';

export interface IConnectionChange {
    next(direction: EButtonDirection, currentSelection: number, altKeys: IAltKeyConfiguration): number | undefined;
}
