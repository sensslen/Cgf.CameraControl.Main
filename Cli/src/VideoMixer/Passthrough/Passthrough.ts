import { IConfig, IImageSelectionChange, ILogger, IVideoMixer } from 'cgf.cameracontrol.main.core';
import { Observable, of } from 'rxjs';

import { EventEmitter } from 'events';
import { StrictEventEmitter } from 'strict-event-emitter-types';

export class Passthrough implements IVideoMixer {
    private readonly _selectedChangeEmitter = new EventEmitter() as StrictEventEmitter<
        EventEmitter,
        IImageSelectionChange
    >;
    private _currentOnAir = -1;
    private _currentPreview = -1;

    constructor(
        _config: IConfig,
        private readonly _logger: ILogger
    ) {
        // nothing to construct here
    }

    public get connectionString(): string {
        return 'passthrough';
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return of(true);
    }

    public async isKeySet(_key: number): Promise<boolean> {
        return false;
    }

    public async getAuxilarySelection(_aux: number): Promise<number> {
        return Promise.resolve(0);
    }

    public imageSelectionChangeGet(): StrictEventEmitter<EventEmitter, IImageSelectionChange> {
        return this._selectedChangeEmitter;
    }

    public cut(): void {
        this.log(`performing cut transition from ${this._currentOnAir} to ${this._currentPreview}`);
        const oldPreview = this._currentPreview;
        this._currentPreview = this._currentOnAir;
        this._currentOnAir = oldPreview;
        this._selectedChangeEmitter.emit('previewChange', this._currentPreview, false);
        this._selectedChangeEmitter.emit('programChange', this._currentOnAir);
    }

    public auto(): void {
        this.log(`performing auto transition from ${this._currentOnAir} to ${this._currentPreview}`);
        const oldPreview = this._currentPreview;
        this._currentPreview = this._currentOnAir;
        this._currentOnAir = oldPreview;
        this._selectedChangeEmitter.emit('previewChange', this._currentPreview, false);
        this._selectedChangeEmitter.emit('programChange', this._currentOnAir);
    }

    public changeInput(newInput: number): void {
        this.log(`changing input to: ${newInput}`);
        this._currentPreview = newInput;
        this._selectedChangeEmitter.emit('previewChange', this._currentPreview, false);
    }

    public toggleKey(_key: number): void {
        this.log(`toggling key: ${_key}`);
    }

    public runMacro(_macro: number): void {
        this.log(`running macro: ${_macro}`);
    }

    dispose(): Promise<void> {
        return Promise.resolve();
    }

    private log(toLog: string): void {
        this._logger.log(`Passthrough video mixer:${toLog}`);
    }
}
