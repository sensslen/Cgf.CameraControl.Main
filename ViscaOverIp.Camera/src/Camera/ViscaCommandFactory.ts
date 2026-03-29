import { ViscaCommand } from 'node-visca-over-ip';

export class ViscaCommandFactory {
    public static zoom(value: number): ViscaCommand {
        let payload: number[];
        if (value === 0) {
            payload = [0x81, 0x01, 0x04, 0x07, 0x00, 0xff]; // Stop
        } else {
            const speed = Math.min(7, Math.max(0, Math.round(Math.abs(value) * 7)));
            const direction = value > 0 ? 0x20 : 0x30; // 2=Tele(in), 3=Wide(out)
            payload = [0x81, 0x01, 0x04, 0x07, direction | speed, 0xff];
        }
        return new ViscaCommand(payload);
    }

    public static focus(value: number): ViscaCommand {
        let payload: number[];
        if (value === 0) {
            payload = [0x81, 0x01, 0x04, 0x08, 0x00, 0xff]; // Stop
        } else {
            const speed = Math.min(7, Math.max(0, Math.round(Math.abs(value) * 7)));
            const direction = value > 0 ? 0x20 : 0x30; // 2=Far, 3=Near
            payload = [0x81, 0x01, 0x04, 0x08, direction | speed, 0xff];
        }
        return new ViscaCommand(payload);
    }

    public static panTilt(pan: number, tilt: number): ViscaCommand {
        const panSpeed = Math.min(24, Math.max(1, Math.round(Math.abs(pan) * 24)));
        const tiltSpeed = Math.min(20, Math.max(1, Math.round(Math.abs(tilt) * 20)));

        let panDir = 0x03; // Stop
        if (pan > 0)
            panDir = 0x02; // Right
        else if (pan < 0) panDir = 0x01; // Left

        let tiltDir = 0x03; // Stop
        if (tilt > 0)
            tiltDir = 0x01; // Up
        else if (tilt < 0) tiltDir = 0x02; // Down

        const payload = [0x81, 0x01, 0x06, 0x01, panSpeed, tiltSpeed, panDir, tiltDir, 0xff];
        return new ViscaCommand(payload);
    }

    public static tally(state: 'off' | 'preview' | 'program'): ViscaCommand {
        let payload: number[];
        switch (state) {
            case 'program':
                payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x02, 0xff]; // Red
                break;
            case 'preview':
                payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x01, 0x02, 0xff]; // Green
                break;
            case 'off':
            default:
                payload = [0x81, 0x01, 0x7e, 0x01, 0x0a, 0x00, 0x03, 0xff]; // Off
                break;
        }
        return new ViscaCommand(payload);
    }
}
