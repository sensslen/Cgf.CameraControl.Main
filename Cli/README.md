# Cgf.CameraControl.Main.Cli [![CodeFactor](https://www.codefactor.io/repository/github/sensslen/cgf.cameracontrol.main.cli/badge)](https://www.codefactor.io/repository/github/sensslen/cgf.cameracontrol.main.cli)

Typescript CLI application that uses a Gamepad to control a Video mixer and multiple cameras.

## Quick start

To start using this project use the following steps:

-   install [node.js](https://nodejs.org/en/)
-   clone the parent repository (`git clone https://github.com/sensslen/Cgf.CameraControl.Main.git`)
-   install dependencies by calling `npm install` from the root directory
-   edit [src/config.json](./src/config.json) to match your setup or create a custom configuration file
-   compile the app from the root directory: `npm run build`
-   run the application using `npm start` from the root directory or `node Cli/dist/index.js --config path/to/my/config.json`

## Configuration

Configuration of the application is stored as a JSON file. There is a default configuration ([src/config.json](./src/config.json)) which is loaded when the config parameter is omitted when starting the application. Additionally, the application may be started with a custom configuration that may be located anywhere on the file system.

For complete configuration documentation, see the [main repository README](../README.md#configuration).

### Supported Components

#### Camera Types
- `websocket/ptzlanc` - WebSocket-based PTZ LANC camera control
- `signalr/ptzlanc` - SignalR-based PTZ LANC camera control

#### Video Mixer Types
- `blackmagicdesign/atem` - Blackmagic Design ATEM switchers

#### Interface/Gamepad Types
- `logitech/gamepadf310` - Logitech F310 gamepad
- `logitech/rumblepad2` - Logitech Rumblepad 2

### Quick Configuration Example

```json
{
    "cams": [
        {
            "instance": 1,
            "type": "websocket/ptzlanc",
            "ip": "192.168.1.100"
        }
    ],
    "videoMixers": [
        {
            "instance": 1,
            "type": "blackmagicdesign/atem",
            "ip": "192.168.1.240",
            "mixEffectBlock": 0
        }
    ],
    "interfaces": [
        {
            "instance": 1,
            "type": "logitech/gamepadf310",
            "videoMixer": 1,
            "connectionChange": {
                "type": "direct",
                "default": {
                    "up": 1,
                    "right": 2,
                    "down": 3,
                    "left": 4
                }
            },
            "specialFunction": {
                "default": {
                    "down": {
                        "type": "key",
                        "index": 1
                    }
                }
            },
            "cameraMap": {
                "1": 1,
                "2": 2
            }
        }
    ]
}
```
