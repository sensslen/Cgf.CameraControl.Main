# Cgf.CameraControl.ViscaOverIp.Camera

VISCA over IP camera control module for the Cgf.CameraControl.Main system.

## Overview

This module provides a VISCA over IP connection implementation for controlling PTZ (Pan-Tilt-Zoom) cameras. It allows the camera control system to communicate with VISCA-compatible cameras via UDP.

## Configuration

This module is configured as part of the `cams` array in the main configuration file:

```json
{
    "instance": 3,
    "type": "viscaoverip",
    "ip": "192.168.1.102",
    "port": 52381,
    "panTiltInvert": false
}
```

### Configuration Options

- `instance`: Unique numeric identifier for this camera
- `type`: Must be `"viscaoverip"`
- `ip`: IP address of the VISCA over IP camera
- `port`: (Optional, default: 52381) UDP port of the camera
- `panTiltInvert`: (Optional, default: false) Invert pan/tilt control directions
