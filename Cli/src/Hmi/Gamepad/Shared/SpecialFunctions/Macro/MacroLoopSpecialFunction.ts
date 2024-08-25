import { ISpecialFunction } from '../ISpecialFunction';
import { ISpecialFunctionMacroLoopConfig } from './ISpecialFunctionMacroLoopConfig';
import { IVideoMixer } from 'cgf.cameracontrol.main.core';

export class MacroLoopSpecialFunction implements ISpecialFunction {
    private _nextIndex = 0;
    constructor(private readonly _config: ISpecialFunctionMacroLoopConfig) {}

    run(mixer: IVideoMixer): void {
        mixer.runMacro(this._config.indexes[this._nextIndex]);
        this._nextIndex++;
        if (this._nextIndex >= this._config.indexes.length) {
            this._nextIndex = 0;
        }
    }
}
