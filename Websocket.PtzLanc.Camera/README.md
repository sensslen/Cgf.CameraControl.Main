# Cgf.CameraControl.Websocket.PtzLanc.Camera

WebSocket-based PTZ LANC camera control module for the Cgf.CameraControl.Main system.

## Overview

This module provides a WebSocket connection implementation for controlling PTZ (Pan-Tilt-Zoom) LANC cameras. It allows the camera control system to communicate with camera controllers via WebSocket protocol for real-time, low-latency control.

## Configuration

This module is configured as part of the `cams` array in the main configuration file:

```json
{
    "instance": 1,
    "type": "websocket/ptzlanc",
    "ip": "192.168.1.100",
    "panTiltInvert": false,
    "showTallyLight": true
}
```

### Configuration Options

- `instance`: Unique numeric identifier for this camera
- `type`: Must be `"websocket/ptzlanc"`
- `ip`: IP address of the camera controller
- `panTiltInvert`: (Optional, default: false) Invert pan/tilt control directions
- `showTallyLight`: (Optional, default: true) Enable tally light on camera when it's on program/preview

## Features

- Real-time camera control via WebSocket
- Pan and tilt control
- Zoom control
- Tally light support (preview/program indication)
- Configurable pan/tilt inversion
- Low-latency communication
