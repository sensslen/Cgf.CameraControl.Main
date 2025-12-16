# Cgf.CameraControl.Signalr.PtzLanc.Camera

SignalR-based PTZ LANC camera control module for the Cgf.CameraControl.Main system.

## Overview

This module provides a SignalR connection implementation for controlling PTZ (Pan-Tilt-Zoom) LANC cameras. It allows the camera control system to communicate with camera controllers via SignalR real-time communication protocol.

## Configuration

This module is configured as part of the `cams` array in the main configuration file:

```json
{
    "instance": 1,
    "type": "signalr/ptzlanc",
    "connectionUrl": "http://192.168.1.101:5000",
    "connectionPort": "COM6",
    "panTiltInvert": false
}
```

### Configuration Options

- `instance`: Unique numeric identifier for this camera
- `type`: Must be `"signalr/ptzlanc"`
- `connectionUrl`: URL of the SignalR camera controller server
- `connectionPort`: Serial port identifier (e.g., "COM6" on Windows, "/dev/ttyUSB0" on Linux)
- `panTiltInvert`: (Optional, default: false) Invert pan/tilt control directions

## Features

- Real-time camera control via SignalR
- Pan and tilt control
- Zoom control
- Serial port communication for LANC protocol
- Configurable pan/tilt inversion
