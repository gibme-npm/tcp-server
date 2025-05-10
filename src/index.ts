// Copyright (c) 2022-2025, Brandon Lehmann <brandonlehmann@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { createConnection, Server, ServerOpts, Socket } from 'net';
import { createHash } from 'crypto';

export { ServerOpts, Server, Socket, createConnection };

/**
 * Creates a new TCP server with the provided options
 *
 * @param options
 * @param connectionListener
 */
export const createServer = (
    options: ServerOpts = {},
    connectionListener?: (socket: Socket) => void
): TCPServer => new TCPServer(options, connectionListener);

export default class TCPServer extends Server {
    private __connections = new Map<string, Socket>();

    /**
     * Constructs a new instance of the server
     *
     * @param options
     * @param connectionListener
     */
    constructor (
        options: ServerOpts = {},
        connectionListener?: (socket: Socket) => void
    ) {
        super(options, connectionListener);

        this.on('connection', socket => {
            const id = TCPServer.socket_id(socket);

            socket.on('close', () => this.__connections.delete(id));
            socket.on('end', () => this.__connections.delete(id));
            socket.on('error', () => this.__connections.delete(id));
            socket.on('timeout', () => this.__connections.delete(id));

            this.__connections.set(id, socket);
        });
    }

    /**
     * Returns an iterator of currently connected sockets
     */
    public get sockets (): Socket[] {
        const result: Socket[] = [];

        for (const [, socket] of this.__connections) {
            result.push(socket);
        }

        return result;
    }

    /**
     * Returns the interface address that the server is bound to
     */
    public get bindIP (): string {
        const normalize = (host: string): string => {
            switch (host) {
                case '0.0.0.0':
                case '::':
                    return '0.0.0.0';
                default:
                    return host;
            }
        };

        const result = this.address();

        if (!result) {
            throw new Error('Server not running!');
        } else if (typeof result === 'string') {
            return normalize(result);
        } else {
            return normalize(result.address);
        }
    }

    /**
     * Returns the interface port that the server is bound to
     */
    public get bindPort (): number {
        const result = this.address();

        if (!result || typeof result === 'string') {
            throw new Error('Server not running!');
        } else {
            return result.port;
        }
    }

    /**
     * Creates a new TCP server with the provided options
     *
     * @param options
     * @param connectionListener
     */
    public static create (
        options: ServerOpts = {},
        connectionListener?: (socket: Socket) => void
    ): TCPServer {
        return createServer(options, connectionListener);
    }

    /**
     * Calculates a unit ID for a socket
     *
     * @param socket
     * @private
     */
    private static socket_id (socket: Socket): string {
        return createHash('sha512')
            .update(socket.remoteAddress || '')
            .update((socket.remotePort || 0).toString())
            .update(socket.remoteFamily || '')
            .digest('hex');
    }

    /**
     * Starts the TCP server
     *
     * @param port
     * @param hostname
     * @param backlog
     */
    public async start (
        port?: number,
        hostname?: string,
        backlog = 511
    ): Promise<void> {
        if (this.listening) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.once('error', reject);

            this.listen(port, hostname, backlog, () => {
                this.removeListener('error', reject);

                return resolve();
            });
        });
    }

    /**
     * Destroys all connected sockets and stops the TCP server
     */
    public async stop (): Promise<void> {
        return new Promise(resolve => {
            for (const socket of this.sockets) {
                if (!socket.destroyed) {
                    socket.destroy();
                }
            }

            if (!this.listening) {
                return resolve();
            }

            this.close(() => {
                return resolve();
            });
        });
    }
}

export { TCPServer };
