# Cgf.CameraControl.Main [![CodeFactor](https://www.codefactor.io/repository/github/sensslen/cgf.cameracontrol.main.cli/badge)](https://www.codefactor.io/repository/github/sensslen/cgf.cameracontrol.main.cli)

Typescript application that uses a Gamepad to control a Video mixer and multiple cameras.

## Quick start

To start using this project use the following steps:

-   install [node.js](https://nodejs.org/en/)
-   clone the repository (`git clone https://github.com/sensslen/Cgf.CameraControl.Main.Cli.git`)
-   install dependencies by calling `npm install`
-   edit [src/config.json](./src/config.json) to match your setup or just create a new configuration and run the application with the config parameter.
-   compile the app : `npm run build`
-   run the application using `node dist/index.js --config path/to/my/specail/config.json` or use one of the starter scripts available for Windows and Mac

> **⚠ WARNING: Under Construction.**  
> The following chapters need to be rebuilt. These reflect the configuration of version 1 and do no longer apply
## Configuration

Configuration of the Application is storead as JSON File. There is the default configuration ([src/config.json](./src/config.json)) which is loaded when the config parameter is omitted when starting the application. Additionally the application may be started with a custom configuration that may be located anywhere on the file system.

The configuration format is basically shown in [src/config.json](./src/config.json). Please keep reading for further explanations.

### Video mixer connections

The application basically supports connections to multiple video mixers. These are configured in the videoMixers array which is located in the root element of the configuration file directly.

```json5
    "videoMixers": [
        {
            // Type of the Video Mixer
            "type": "blackmagicdesign/atem",

            // Instance of the Video Mixer: is used later to access the right Mixer
            "instance": 1,

            "ip": "192.168.1.123",

            // Selection of the mixEffectBlock: The Atem which is used hat 4 different mixEffectBlocks starting by 0 up to 3
            "mixEffectBlock": 0
        }
    ],
```

### Gamepads

Also there are multiple gamepads supported by one instance of the application. Each gamepad connects to exactly one ME Block on the video mixer and allows to control it. Then there may be an arbitrary number of [Image Connections](#image_connections) associated with it. Each gamepad also supports executing a number of special functions (setting Keys or executing macros).

> :warning: **Currently there is the unfortunate restriction to only support one gamepad per gamepad type. This is a restriction of the gamepad connection library used. This is planned to be changed in the future.**

```json5
 "interfaces": [
        {
            // Type of the interface to connect to
            "type": "logitech/gamepadf310",

            // Serial number of the gamepad (used to identify the exact gamepad to connect to. This parameter is optional)
            "serialNumber": 123553,

            // Every Interface needs a unique instance to seperate them from each other: The first Gamepad has an instance of 1
            "instance": 1,

            // Every Interface can only controll one Video Mixer. The Video Mixer is selectet by the Number from videoMixer
            "videoMixer": 1,

            // If there is one person controlling the cameras and another person is cutting as a savety measure you can disable cutting. Default value is true
            "enableChangingProgram":false,
            // If the "enableChangingProgram" is set to false, the person who is controlling the cameras is not able to cut with his controller

            // To control the cameras the buttons of the gamepad needs to be configurated:
            "connectionChange": {

                // There are three different posibilities to select something through the directionpad: default, alt and altlower. Example:
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
                "altlower": {
                    "up": 9,
                    "right": 10,
                    "down": 11,
                    "left": 12
                },

                // Key mapping for the special function keys on the Gamepad: A, B, X, Y. It could be similat to the onfigurating obove with default, alt and altlower but there is no need for that much keys. The only who is used is default.
                "specialFunction": {
                    "default": {

                        // Definition which button is calling the folowing part
                        "down": {

                            // Definition which type the folowing part of code is
                            "type": "macroToggle",

                            // Name of the macro which is called (macro 23 is showing the banner and macro 24 is hiding the banner)
                            "indexOn": 23,
                            "indexOff": 24,

                            // Condition to check if the banner needs to be shown or hidden:
                            "condition": {

                            // Search for the key 0 on the Atem
                            "type": "key",
                            "key": 0
                            // If the Key is not active call indexOn: It is going to show the banner
                            // If the Key is allready pressed call indexOff: It is going to hide the banner
                            }
                        },
                        "up": {
                            "type": "macroToggle",
                            "indexOn": 20,
                            "indexOff": 21,
                            "condition": {

                            // Search for the AUX output 5 on the Atem. If selection 16 is active the toggle is on
                            // If the Toggle is off change the output for the livestream to show the slides of the Pre-Programm
                            // If the Toggle is on change the output for the livestream to show the livestream output
                            "type": "aux_selection",
                            "aux": 5,
                            "selection": 16
                            }
                        }
                    }
                }
            },

            // Selection on thich port of the Atem is which camera connected
            "cameraMap": {
                "1": 1,
                "2": 2,
                "3": 3,
                "4": 4,
                "7": 6
            }
        }
    ]
```