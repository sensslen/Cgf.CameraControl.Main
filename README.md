# Cgf.CameraControl.Main

TypeScript application that uses a Gamepad to control a Video mixer and multiple cameras.

## Quick start

To start using this project use the following steps:

-   install [node.js](https://nodejs.org/en/)
-   clone the repository (`git clone https://github.com/sensslen/Cgf.CameraControl.Main.git`)
-   install dependencies by calling `npm install`
-   edit [Cli/src/config.json](./Cli/src/config.json) to match your setup or just create a new configuration and run the application with the config parameter.
-   compile the app : `npm run build`
-   run the application using `npm start` (which runs `node Cli/dist/index.js`) or pass a custom config via `node Cli/dist/index.js --config path/to/my/config.json`

## Configuration

Configuration of the application is stored as a JSON file. There is a default configuration ([Cli/src/config.json](./Cli/src/config.json)) which is loaded when the config parameter is omitted when starting the application. Additionally, the application may be started with a custom configuration that may be located anywhere on the file system.

The configuration file has three main sections: `cams` (camera connections), `videoMixers` (video mixer connections), and `interfaces` (controller/gamepad configurations).

### Complete Configuration Example

```json
{
    "cams": [
        {
            "instance": 1,
            "type": "websocket/ptzlanc",
            "ip": "192.168.1.100",
            "panTiltInvert": false,
            "showTallyLight": true
        },
        {
            "instance": 2,
            "type": "signalr/ptzlanc",
            "connectionUrl": "http://192.168.1.101:5000",
            "connectionPort": "COM6",
            "panTiltInvert": false
        },
        {
            "instance": 3,
            "type": "viscaoverip",
            "ip": "192.168.1.102",
            "port": 52381,
            "panTiltInvert": false
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
            "serialNumber": "optional-serial-number",
            "videoMixer": 1,
            "enableChangingProgram": true,
            "connectionChange": {
                "type": "direct",
                "default": {
                    "up": 1,
                    "right": 2,
                    "down": 3,
                    "left": 4
                },
                "alt": {
                    "up": 5,
                    "right": 6,
                    "down": 7,
                    "left": 8
                },
                "altLower": {
                    "up": 9,
                    "right": 10,
                    "down": 11,
                    "left": 12
                }
            },
            "specialFunction": {
                "default": {
                    "down": {
                        "type": "key",
                        "index": 1
                    },
                    "up": {
                        "type": "macroToggle",
                        "indexOn": 23,
                        "indexOff": 24,
                        "condition": {
                            "type": "key",
                            "key": 0
                        }
                    },
                    "left": {
                        "type": "macroLoop",
                        "indexes": [1, 2, 3]
                    }
                }
            },
            "cameraMap": {
                "1": 1,
                "2": 2,
                "3": 3,
                "4": 4
            }
        }
    ]
}
```

### Camera Connections

The `cams` array defines the camera connections that the application can control. Each camera has:

-   `instance`: Unique numeric identifier for the camera
-   `type`: Type of camera connection. Supported types:
    -   `"websocket/ptzlanc"`: WebSocket-based PTZ LANC camera control
    -   `"signalr/ptzlanc"`: SignalR-based PTZ LANC camera control
    -   `"viscaoverip"`: VISCA over IP camera control

For detailed module documentation, see:
- [Websocket.PtzLanc.Camera](./Websocket.PtzLanc.Camera/README.md)
- [Signalr.PtzLanc.Camera](./Signalr.PtzLanc.Camera/README.md)
- [ViscaOverIp.Camera](./ViscaOverIp.Camera/README.md)

#### WebSocket PTZ LANC Camera

```json
{
    "instance": 1,
    "type": "websocket/ptzlanc",
    "ip": "192.168.1.100",
    "panTiltInvert": false,
    "showTallyLight": true
}
```

-   `ip`: IP address of the camera controller
-   `panTiltInvert`: (Optional, default: false) Invert pan/tilt controls
-   `showTallyLight`: (Optional, default: true) Enable tally light on camera

#### SignalR PTZ LANC Camera

```json
{
    "instance": 2,
    "type": "signalr/ptzlanc",
    "connectionUrl": "http://192.168.1.101:5000",
    "connectionPort": "COM6",
    "panTiltInvert": false
}
```

-   `connectionUrl`: URL of the SignalR camera controller
-   `connectionPort`: Serial port identifier
-   `panTiltInvert`: (Optional, default: false) Invert pan/tilt controls

#### VISCA over IP Camera (untested)

```json
{
    "instance": 3,
    "type": "viscaoverip",
    "ip": "192.168.1.102",
    "port": 52381,
    "panTiltInvert": false
}
```

-   `ip`: IP address of the camera
-   `port`: (Optional, default: 52381) UDP port of the camera
-   `panTiltInvert`: (Optional, default: false) Invert pan/tilt controls

## Video Mixer Connections

The `videoMixers` array defines the video mixer connections. Multiple video mixers can be configured.

```json
{
    "instance": 1,
    "type": "blackmagicdesign/atem",
    "ip": "192.168.1.240",
    "mixEffectBlock": 0
}
```

-   `instance`: Unique numeric identifier for the video mixer
-   `type`: Type of video mixer. Currently supported: `"blackmagicdesign/atem"`
-   `ip`: IP address of the ATEM switcher
-   `mixEffectBlock`: Zero-based ME block index to control (0-3 depending on ATEM model)

## Gamepads/Controllers (Interfaces)

The `interfaces` array defines the gamepad/controller configurations. Each gamepad connects to exactly one video mixer and controls the cameras mapped to it.

```json
{
    "instance": 1,
    "type": "logitech/gamepadf310",
    "serialNumber": "optional-serial-number",
    "videoMixer": 1,
    "enableChangingProgram": true,
    "connectionChange": { /* ... */ },
    "specialFunction": { /* ... */ },
    "cameraMap": { /* ... */ }
}
```

#### Basic Configuration

-   `instance`: Unique numeric identifier for the interface
-   `type`: Type of gamepad. Supported types:
    -   `"logitech/gamepadf310"`: Logitech F310 gamepad
    -   `"logitech/rumblepad2"`: Logitech Rumblepad 2
-   `serialNumber`: (Optional) Serial number to identify specific gamepad
-   `videoMixer`: Instance number of the video mixer this interface controls
-   `enableChangingProgram`: (Optional, default: true) Allow this controller to cut/switch program output

#### Camera Map

The `cameraMap` maps ATEM input numbers to camera instance numbers:

```json
"cameraMap": {
    "1": 1,  // ATEM input 1 -> camera instance 1
    "2": 2,  // ATEM input 2 -> camera instance 2
    "3": 3,  // ATEM input 3 -> camera instance 3
    "4": 4   // ATEM input 4 -> camera instance 4
}
```

#### Connection Change Configuration

Defines how the D-pad buttons change camera selection. Two types are supported:

**Direct Mode**: Maps each D-pad direction to a specific camera instance

```json
"connectionChange": {
    "type": "direct",
    "default": {
        "up": 1,
        "right": 2,
        "down": 3,
        "left": 4
    },
    "alt": {  // Optional: used when "alt" modifier is held
        "up": 5,
        "right": 6,
        "down": 7,
        "left": 8
    },
    "altLower": {  // Optional: used when "altLower" modifier is held
        "up": 9,
        "right": 10,
        "down": 11,
        "left": 12
    }
}
```

**Directional Mode**: Allows navigation between cameras in a directional manner

```json
"connectionChange": {
    "type": "directional",
    "directions": {
        "1": {  // From camera instance 1
            "right": 2,
            "down": 3
        },
        "2": {  // From camera instance 2
            "left": 1,
            "down": 4
        }
    }
}
```

#### Special Functions

Maps gamepad buttons (A, B, X, Y) to special functions. Available in `default`, `alt`, and `altLower` contexts.

Button directions: `"up"` (Y), `"down"` (A), `"left"` (X), `"right"` (B)

**Key Toggle**: Toggle an ATEM upstream key

```json
{
    "type": "key",
    "index": 1  // Key index (1-based)
}
```

**Macro Loop**: Cycle through a series of macros

```json
{
    "type": "macroLoop",
    "indexes": [1, 2, 3]  // Array of macro indexes to cycle through
}
```

**Macro Toggle**: Toggle between two macros based on a condition

```json
{
    "type": "macroToggle",
    "indexOn": 23,   // Macro to run when condition is false
    "indexOff": 24,  // Macro to run when condition is true
    "condition": {
        "type": "key",  // Check if a key is active
        "key": 0        // Key index to check
    }
}
```

```json
{
    "type": "macroToggle",
    "indexOn": 20,
    "indexOff": 21,
    "condition": {
        "type": "aux_selection",  // Check AUX output selection
        "aux": 5,                 // AUX output index
        "selection": 16           // Expected source selection
    }
}
```

**Connection Change**: Trigger camera selection change via button

```json
{
    "type": "connectionChange"
}
```
