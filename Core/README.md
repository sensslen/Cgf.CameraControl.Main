# Cgf.CameraControl.Main.Core [![CodeFactor](https://www.codefactor.io/repository/github/sensslen/cgf.cameracontrol.main.core/badge)](https://www.codefactor.io/repository/github/sensslen/cgf.cameracontrol.main.core)

Core Library of the Camera Control Software initially developed for usage at Viva Kirche Frauenfeld.

## Overview

This is the core library that provides the foundational interfaces and abstractions for the camera control system. It defines the plugin architecture that allows different types of cameras, video mixers, and human-machine interfaces (HMIs) to be integrated into the system.

## Key Features

- **Generic Factory Pattern**: Extensible factory system for registering and building components
- **Configuration Schema**: Zod-based configuration validation using `configSchema` and `rootConfigSchema`
- **Type Safety**: Full TypeScript support with exported type definitions
- **RxJS Integration**: Reactive programming support for event handling

## Usage

This library is used as a dependency by other modules in the Cgf.CameraControl.Main ecosystem:
- CLI application (Cgf.CameraControl.Main.Cli)
- Camera connection modules (SignalR, WebSocket, and VISCA implementations)

## Configuration Schema

The core library exports the base configuration schemas that are extended by specific implementations:

```typescript
import { configSchema, rootConfigSchema } from 'cgf.cameracontrol.main.core';

// Base config for individual components
export const myConfigSchema = configSchema.extend({
    // Add component-specific fields
});

// Root config structure
// {
//   cams: configSchema.array(),
//   videoMixers: configSchema.array(),
//   interfaces: configSchema.array()
// }
```
