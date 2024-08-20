import { Gamepad } from '../Shared/Gampepad';
import { linear as interpolate } from 'everpolate-ts';

export interface JoyStickValue {
    x: number;
    y: number;
}

export abstract class LogitechGamepad extends Gamepad {
    private readonly moveInterpolation: number[][] = [
        [0, 63, 95, 127, 128, 160, 192, 255],
        [1, 0.27, 0.08, 0, 0, -0.08, -0.27, -1],
    ];
    private readonly zoomFocusInterpolation: number[][] = [
        [0, 127, 128, 255],
        [1, 0, 0, -1],
    ];

    protected leftJoystickMove(value: JoyStickValue): void {
        this.pan(interpolate(value.x, this.moveInterpolation[0], this.moveInterpolation[1])[0]);
        this.tilt(-interpolate(value.y, this.moveInterpolation[0], this.moveInterpolation[1])[0]);
    }

    protected rightJoystickMove(value: JoyStickValue): void {
        this.zoom(interpolate(value.y, this.zoomFocusInterpolation[0], this.zoomFocusInterpolation[1])[0]);
        this.focus(interpolate(value.x, this.zoomFocusInterpolation[0], this.zoomFocusInterpolation[1])[0]);
    }
}
