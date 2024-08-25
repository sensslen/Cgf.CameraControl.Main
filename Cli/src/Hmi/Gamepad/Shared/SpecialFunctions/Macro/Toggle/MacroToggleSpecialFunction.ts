import { ILogger, IVideoMixer } from 'cgf.cameracontrol.main.core';
import { IMacroToggleSpecialFunctionCondition } from './IMacroToggleSpecialFunctionCondition';
import { ISpecialFunction } from '../../ISpecialFunction';
import { ISpecialFunctionMacroToggleConfiguration } from './ISpecialFunctionMacroToggleConfig';
import { MacroToggleSpecialFunctionConditionFactory } from './MacroToggleSpecialFunctionConditionFactory';

export class MacroToggleSpecialFunction implements ISpecialFunction {
    private condition?: IMacroToggleSpecialFunctionCondition;
    constructor(
        private config: ISpecialFunctionMacroToggleConfiguration,
        logger: ILogger
    ) {
        this.condition = MacroToggleSpecialFunctionConditionFactory.get(this.config.condition, logger);
    }

    run(mixer: IVideoMixer): void {
        this.condition
            ?.isActive(mixer)
            .then((isActive) => this.runMacro(isActive, mixer))
            .catch((_error) => {
                // error ignored on purpose
            });
    }

    private runMacro(isActive: boolean, mixer: IVideoMixer) {
        const index = isActive ? this.config.indexOff : this.config.indexOn;
        mixer.runMacro(index);
    }
}
