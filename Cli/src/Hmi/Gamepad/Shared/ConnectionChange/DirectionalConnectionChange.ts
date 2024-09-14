import { EButtonDirection } from '../EButtonDirection';
import { IAltKeyConfiguration } from '../IAltKeyConfiguration';
import { IConnectionChange } from './IConnectionChange';
import { IDirectionalConnectionChangeDefinition } from './IConnectionChangeConfiguration';

export class DirectionalConnectionChange implements IConnectionChange {
    constructor(private _config: IDirectionalConnectionChangeDefinition) { }

    next(direction: EButtonDirection, currentSelection: number, _: IAltKeyConfiguration): number | undefined {
        let nextSelectionMap = this._config.directions[currentSelection];
        if (nextSelectionMap === undefined) {
            const lowestDefinedKey = Number(Object.keys(this._config.directions)[0]);
            nextSelectionMap = this._config.directions[lowestDefinedKey];
        }
        const directionMap = this._config.directions[currentSelection];
        return directionMap[direction];
    }
}
