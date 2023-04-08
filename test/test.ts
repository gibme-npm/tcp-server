// Copyright (c) 2022-2023, Brandon Lehmann <brandonlehmann@gmail.com>
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

import * as assert from 'assert';
import { it, before, after, describe } from 'mocha';
import { createServer, createConnection, Socket } from '../src/tcp-server';

describe('Unit Tests', () => {
    const message = Buffer.from('The quick brown fox jumped over the lazy dog', 'utf-8');

    const server = createServer();
    let client: Socket;

    before(async () => {
        server.on('connection', socket => {
            socket.on('data', data => {
                // echo back whatever is sent
                socket.write(data);
            });
        });

        await server.start();

        return new Promise(resolve => {
            client = createConnection(
                server.bindPort,
                server.bindIP === '0.0.0.0' ? '127.0.0.1' : server.bindIP,
                () => {
                    return resolve();
                });
        });
    });

    after(async () => {
        await server.stop();

        if (client) {
            client.destroy();
        }
    });

    it('Receive', async () => {
        return new Promise((resolve, reject) => {
            client.once('data', (payload: Buffer) => {
                assert.deepEqual(payload, message);

                return resolve();
            });

            client.write(message, error => {
                if (error) {
                    return reject(error);
                }
            });
        });
    });

    it('Send', async () => {
        return new Promise((resolve, reject) => {
            client.once('data', (payload: Buffer) => {
                // echo data back
                client.write(payload, error => {
                    if (error) {
                        return reject(error);
                    }
                });
            });

            for (const socket of server.sockets) {
                socket.once('data', (payload: Buffer) => {
                    assert.deepEqual(payload, message);

                    return resolve();
                });

                socket.write(message, error => {
                    if (error) {
                        return reject(error);
                    }
                });
            }
        });
    });
});
