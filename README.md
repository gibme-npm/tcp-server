# @gibme/tcp-server

A lightweight wrapper around Node.js `net.Server` that simplifies TCP server lifecycle management and connection tracking.

## Requirements

- Node.js >= 22

## Installation

```bash
npm install @gibme/tcp-server
```

or

```bash
yarn add @gibme/tcp-server
```

## Documentation

Full API documentation is available at [https://gibme-npm.github.io/tcp-server/](https://gibme-npm.github.io/tcp-server/)

## Quick Start

```typescript
import { createServer } from '@gibme/tcp-server';

const server = createServer();

server.on('connection', socket => {
    socket.on('data', data => {
        console.log('Received:', data.toString());
        socket.write(data); // echo back
    });
});

await server.start(8080);

console.log('Listening on %s:%s', server.bindIP, server.bindPort);
```

## API

### `createServer(options?, connectionListener?)`

Factory function that returns a new `TCPServer` instance.

- `options` — Optional `net.ServerOpts`
- `connectionListener` — Optional callback invoked on each new connection

### Class: `TCPServer`

Extends `net.Server` with automatic socket tracking and a promise-based lifecycle.

#### Constructor

```typescript
new TCPServer(options?: ServerOpts, connectionListener?: (socket: Socket) => void)
```

#### Static Methods

| Method | Description |
|---|---|
| `TCPServer.create(options?, connectionListener?)` | Alias for `createServer()` |

#### Properties

| Property | Type | Description |
|---|---|---|
| `sockets` | `Socket[]` | All currently connected sockets |
| `bindIP` | `string` | Bound IP address (throws if not listening) |
| `bindPort` | `number` | Bound port number (throws if not listening) |

#### Methods

| Method | Description |
|---|---|
| `start(port?, hostname?, backlog?)` | Start listening. Returns `Promise<void>`. Defaults: OS-assigned port, all interfaces, backlog `511`. |
| `stop()` | Destroy all connected sockets and close the server. Returns `Promise<void>`. |

### Re-exports

The following are re-exported directly from the `net` module for convenience:

- `Server`
- `ServerOpts`
- `Socket`
- `createConnection`

## Examples

### Echo Server

```typescript
import { createServer } from '@gibme/tcp-server';

const server = createServer();

server.on('connection', socket => {
    socket.on('data', data => socket.write(data));
});

await server.start(3000, '127.0.0.1');
```

### Connecting to a Server

```typescript
import { createServer, createConnection } from '@gibme/tcp-server';

const server = createServer();

server.on('connection', socket => {
    socket.on('data', data => socket.write(data));
});

await server.start();

const client = createConnection(server.bindPort, '127.0.0.1');

client.on('data', data => {
    console.log('Server replied:', data.toString());
});

client.write('Hello, server!');
```

### Broadcasting to All Clients

```typescript
import { createServer } from '@gibme/tcp-server';

const server = createServer();

server.on('connection', socket => {
    socket.on('data', data => {
        // broadcast to all connected clients
        for (const peer of server.sockets) {
            peer.write(data);
        }
    });
});

await server.start(4000);
```

## License

MIT
