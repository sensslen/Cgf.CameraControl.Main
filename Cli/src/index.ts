import * as fs from 'fs';
import * as path from 'path';

import { AtemBuilder } from './VideoMixer/Blackmagicdesign/AtemBuilder';
import { Core } from 'cgf.cameracontrol.main.core';
import { Fx10Builder } from './Hmi/Gamepad/logitech/Fx10/Fx10Builder';
import { Logger } from './Logger';
import { PassthroughBuilder } from './VideoMixer/Passthrough/PassthroughBuilder';
import { Rumblepad2Builder } from './Hmi/Gamepad/logitech/Rumblepad2/Rumblepad2Builder';
import { SignalrPtzLancCameraBuilder } from 'cgf.cameracontrol.signalr.ptzlanc.camera';
import { WebsocketPtzLancCameraBuilder } from 'cgf.cameracontrol.websocket.ptzlanc.camera';
import yargs from 'yargs/yargs';

async function run() {
    const argv = await yargs(process.argv.slice(2))
        .options({
            config: { type: 'string', default: path.join(__dirname, 'config.json') },
        })
        .parseAsync();

    const logger = new Logger();
    let config: undefined;
    try {
        config = JSON.parse(fs.readFileSync(argv.config).toString());
    } catch (error) {
        const typedError = error as Error;
        logger.error(typedError.message);
        return;
    }

    const core = new Core();

    await core.cameraFactory.builderAdd(new WebsocketPtzLancCameraBuilder(logger), logger);
    await core.cameraFactory.builderAdd(new SignalrPtzLancCameraBuilder(logger), logger);
    await core.mixerFactory.builderAdd(new AtemBuilder(logger), logger);
    await core.mixerFactory.builderAdd(new PassthroughBuilder(logger), logger);
    await core.hmiFactory.builderAdd(new Fx10Builder(logger, core.mixerFactory, core.cameraFactory), logger);
    await core.hmiFactory.builderAdd(new Rumblepad2Builder(logger, core.mixerFactory, core.cameraFactory), logger);

    await core.bootstrap(logger, config);
}

run();
