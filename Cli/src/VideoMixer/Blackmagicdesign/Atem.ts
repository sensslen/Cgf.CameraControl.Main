import { AtemFactory, IAtemConnection } from './AtemFactory';
import { BehaviorSubject, Observable } from 'rxjs';
import { IImageSelectionChange, IVideoMixer } from 'cgf.cameracontrol.main.core';

import { AtemState } from 'atem-connection';
import { EventEmitter } from 'events';
import { IAtemConfiguration } from './IAtemConfig';
import { MixEffect } from 'atem-connection/dist/state/video';
import { StrictEventEmitter } from 'strict-event-emitter-types';

export class Atem implements IVideoMixer {
    private readonly connection: IAtemConnection;
    private readonly _selectedChangeEmitter = new EventEmitter() as StrictEventEmitter<
        EventEmitter,
        IImageSelectionChange
    >;
    private readonly _currentSelectionState: { previewInput: number; previewOnAir: boolean; programInput: number } = {
        previewInput: -1,
        previewOnAir: false,
        programInput: -1,
    };
    private readonly _connectedSubject = new BehaviorSubject<boolean>(false);

    constructor(
        private config: IAtemConfiguration,
        private atemFactory: AtemFactory
    ) {
        this.connection = atemFactory.get(config.ip);

        this.connection.atem.on('stateChanged', (state, _pathToChange) => {
            this.stateChange(state);
        });
    }

    public get whenConnectedChanged(): Observable<boolean> {
        return this._connectedSubject;
    }

    public get connectionString(): string {
        return `${this.config.ip}:${this.config.mixEffectBlock}`;
    }

    public async isKeySet(key: number): Promise<boolean> {
        const atemState = await this.getCurrentSwitcherState();
        return this.isKeySetInState(atemState, key);
    }

    public async getAuxilarySelection(aux: number): Promise<number> {
        const atemState = await this.getCurrentSwitcherState();
        const auxSelection = this.getAuxSelectionInState(atemState, aux);
        if (auxSelection !== undefined) {
            return auxSelection;
        } else {
            throw new Error('could not find proper aux selection');
        }
    }

    public startup(): Promise<void> {
        return this.connection.startup().then((_) => {
            if (this.connection.atem.state !== undefined) {
                this.stateChange(this.connection.atem.state);
            }
        });
    }

    public imageSelectionChangeGet(): StrictEventEmitter<EventEmitter, IImageSelectionChange> {
        return this._selectedChangeEmitter;
    }

    public cut(): void {
        if (this.connection.connected) {
            this.connection.atem.cut(this.config.mixEffectBlock);
        }
    }

    public auto(): void {
        if (this.connection.connected) {
            this.connection.atem.autoTransition(this.config.mixEffectBlock);
        }
    }

    public changeInput(newInput: number): void {
        if (this.connection.connected) {
            this.connection.atem.changePreviewInput(newInput, this.config.mixEffectBlock);
        }
    }

    public toggleKey(key: number): void {
        if (this.connection.connected && this.connection.atem.state !== undefined) {
            const meState = this.connection.atem.state.video.mixEffects[this.config.mixEffectBlock];
            if (meState !== undefined) {
                const keyState = meState.upstreamKeyers[key];
                if (keyState !== undefined) {
                    this.connection.atem.setUpstreamKeyerOnAir(!keyState.onAir, key);
                }
            }
        }
    }

    public runMacro(macro: number): void {
        if (this.connection.connected) {
            this.connection.atem.macroRun(macro);
        }
    }

    async dispose(): Promise<void> {
        await this.atemFactory.release(this.config.ip);
    }

    private stateChange(state: AtemState): void {
        const meState = state.video.mixEffects[this.config.mixEffectBlock];
        if (meState !== undefined) {
            this.updateActiveInputs(meState);
        }
    }

    private updateActiveInputs(state: MixEffect) {
        const onAirInputs = this.connection.atem.listVisibleInputs('program', this.config.mixEffectBlock);
        const newPreviewIsOnAir = onAirInputs.some((input) => input === state.previewInput);
        console.log(`new preview input:${state.previewInput}`);

        if (
            this._currentSelectionState.previewInput !== state.previewInput ||
            this._currentSelectionState.previewOnAir !== newPreviewIsOnAir
        ) {
            this._selectedChangeEmitter.emit('previewChange', state.previewInput, newPreviewIsOnAir);
            this._currentSelectionState.previewInput = state.previewInput;
            this._currentSelectionState.previewOnAir = newPreviewIsOnAir;
        }

        if (this._currentSelectionState.programInput !== state.programInput) {
            this._selectedChangeEmitter.emit('programChange', state.programInput);
            this._currentSelectionState.programInput = state.programInput;
        }
    }

    private isKeySetInState(state: AtemState, key: number): boolean {
        const meState = state.video.mixEffects[this.config.mixEffectBlock];
        if (meState !== undefined) {
            const keyState = meState.upstreamKeyers[key];
            if (keyState !== undefined) {
                return keyState.onAir;
            }
        }
        return false;
    }

    private getAuxSelectionInState(state: AtemState, aux: number): number | undefined {
        return state.video.auxilliaries[aux];
    }

    private getCurrentSwitcherState(): Promise<AtemState> {
        return new Promise((resolve, reject) => {
            if (this.connection.connected === undefined) {
                reject('no connection');
            }
            if (this.connection.atem.state !== undefined) {
                resolve(this.connection.atem.state);
            } else {
                this.connection.atem.once('stateChanged', (state, _pathToChange) => {
                    resolve(state);
                });
            }
        });
    }
}
