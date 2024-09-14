import { CameraConnectionFactory, ILogger, VideomixerFactory } from 'cgf.cameracontrol.main.core';
import { IConfig as IGamepadConfig, NodeGamepad, ILogger as NodeGamepadLogger } from '@sensslen/node-gamepad';

import { EButtonDirection } from '../../Shared/EButtonDirection';
import { ILogitechFx10Config } from './ILogitechFx10Config';
import { LogitechGamepad } from '../LogitechGamepad';

export class Fx10 extends LogitechGamepad {
    private readonly _pad: NodeGamepad;

    constructor(
        config: ILogitechFx10Config,
        logger: ILogger,
        mixerFactory: VideomixerFactory,
        cameraConnectionFactory: CameraConnectionFactory,
        gamepadConfig: IGamepadConfig
    ) {
        super(config, logger, mixerFactory, cameraConnectionFactory);
        if (config.serialNumber) {
            gamepadConfig.serialNumber = config.serialNumber;
        }

        const gamepadLogger: NodeGamepadLogger = {
            info: (tolog: string) => this.log(tolog),
        };

        this._pad = new NodeGamepad(gamepadConfig, gamepadLogger);

        this._pad.on('left:move', (value) => {
            this.leftJoystickMove(value);
        });

        this._pad.on('right:move', (value) => {
            this.rightJoystickMove(value);
        });

        this._pad.on('dpadLeft:press', () => {
            this.changeConnection(EButtonDirection.left);
        });

        this._pad.on('dpadUp:press', () => {
            this.changeConnection(EButtonDirection.up);
        });

        this._pad.on('dpadRight:press', () => {
            this.changeConnection(EButtonDirection.right);
        });

        this._pad.on('dpadDown:press', () => {
            this.changeConnection(EButtonDirection.down);
        });

        this._pad.on('RB:press', () => {
            this.cut();
        });

        this._pad.on('RT:press', () => {
            this.auto();
        });

        this._pad.on('LB:press', () => {
            this.altKey(true);
        });

        this._pad.on('LB:release', () => {
            this.altKey(false);
        });

        this._pad.on('LT:press', () => {
            this.altLowerKey(true);
        });

        this._pad.on('LT:release', () => {
            this.altLowerKey(false);
        });

        this._pad.on('A:press', () => {
            this.specialFunction(EButtonDirection.down);
        });

        this._pad.on('B:press', () => {
            this.specialFunction(EButtonDirection.right);
        });

        this._pad.on('X:press', () => {
            this.specialFunction(EButtonDirection.left);
        });

        this._pad.on('Y:press', () => {
            this.specialFunction(EButtonDirection.up);
        });

        this._pad.start();
    }

    dispose(): Promise<void> {
        this._pad.stop();
        return Promise.resolve();
    }
}
