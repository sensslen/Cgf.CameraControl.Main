import { Gamepad } from '../Shared/Gampepad';
import { linear as interpolate } from 'everpolate-ts';

export interface JoyStickValue {
    x: number;
    y: number;
}

export abstract class LogitechGamepad extends Gamepad {
    private readonly _moveInterpolation: number[][] = [
        [0, 127, 128, 255],
        [1, 0, 0, -1],
    ];
    private readonly _zoomFocusInterpolation: number[][] = [
        [0, 127, 128, 255],
        [1, 0, 0, -1],
    ];

    protected leftJoystickMove(value: JoyStickValue): void {
        this.pan(interpolate(value.x, this._moveInterpolation[0], this._moveInterpolation[1])[0]);
        this.tilt(-interpolate(value.y, this._moveInterpolation[0], this._moveInterpolation[1])[0]);
    }

    protected rightJoystickMove(value: JoyStickValue): void {
        this.zoom(interpolate(value.y, this._zoomFocusInterpolation[0], this._zoomFocusInterpolation[1])[0]);
        this.focus(interpolate(value.x, this._zoomFocusInterpolation[0], this._zoomFocusInterpolation[1])[0]);
    }
}
