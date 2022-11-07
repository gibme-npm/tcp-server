// Copyright (c) 2022 Brandon Lehmann
//
// Please see the included LICENSE file for more information.

import { Server, ServerOpts, Socket } from 'net';
export { ServerOpts, Server, Socket };

export default class TCPServer extends Server {
    public async start (
        port?: number,
        hostname?: string,
        backlog?: number
    ): Promise<void> {
        if (this.listening) {
            throw new Error('Server is already listening');
        }

        return new Promise((resolve, reject) => {
            this.once('error', reject);

            this.listen(port, hostname, backlog, () => {
                this.removeListener('error', reject);

                return resolve();
            });
        });
    }

    public async stop (): Promise<void> {
        return new Promise(resolve => {
            if (!this.listening) {
                return resolve();
            }

            this.close(() => {
                return resolve();
            });
        });
    }
}

export const createServer = (
    options?: ServerOpts,
    connectionListener?: (socket: Socket) => void
): TCPServer => new TCPServer(options, connectionListener);
