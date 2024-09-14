import { EButtonDirection } from '../EButtonDirection';
import { IAltKeyConfiguration } from '../IAltKeyConfiguration';
import { IConnectionChange } from './IConnectionChange';
import { IDirectConnectionChangeDefinition } from './IConnectionChangeConfiguration';

export class DirectConnectionChange implements IConnectionChange {
    constructor(private _config: IDirectConnectionChangeDefinition) {}

    next(direction: EButtonDirection, _: number, altKeys: IAltKeyConfiguration): number | undefined {
        if (altKeys.alt && this._config.alt !== undefined) {
            return this._config.alt[direction];
        } else if (altKeys.altLower && this._config.altLower !== undefined) {
            return this._config.altLower[direction];
        }
        return this._config.default[direction];
    }
}
