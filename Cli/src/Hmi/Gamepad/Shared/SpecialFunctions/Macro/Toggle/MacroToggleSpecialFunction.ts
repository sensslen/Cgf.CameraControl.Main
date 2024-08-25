import { ILogger, IVideoMixer } from 'cgf.cameracontrol.main.core';
import { IMacroToggleSpecialFunctionCondition } from './IMacroToggleSpecialFunctionCondition';
import { ISpecialFunction } from '../../ISpecialFunction';
import { ISpecialFunctionMacroToggleConfiguration } from './ISpecialFunctionMacroToggleConfig';
import { MacroToggleSpecialFunctionConditionFactory } from './MacroToggleSpecialFunctionConditionFactory';

export class MacroToggleSpecialFunction implements ISpecialFunction {
    private _condition?: IMacroToggleSpecialFunctionCondition;
    constructor(
        private readonly _config: ISpecialFunctionMacroToggleConfiguration,
        logger: ILogger
    ) {
        this._condition = MacroToggleSpecialFunctionConditionFactory.get(this._config.condition, logger);
    }

    run(mixer: IVideoMixer): void {
        this._condition
            ?.isActive(mixer)
            .then((isActive) => this.runMacro(isActive, mixer))
            .catch((_error) => {
                // error ignored on purpose
            });
    }

    private runMacro(isActive: boolean, mixer: IVideoMixer) {
        const index = isActive ? this._config.indexOff : this._config.indexOn;
        mixer.runMacro(index);
    }
}
