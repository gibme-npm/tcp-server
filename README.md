# Simple TCP Server Wrapper

## Documentation

[https://gibme-npm.github.io/tcp-server/](https://gibme-npm.github.io/tcp-server/)

## Sample Code

```typescript
import { createServer } from '@gibme/tcp-server';

(async () => {
    const server = createServer();
    
    server.on('connection', socket => {
        socket.on('data', payload => {
            // do something useful
            console.log(payload.toString()); 
        });
    })
    
    await server.start();
    
    console.log('Server started on %s:%s', server.bindIP, server.bindPort);
})();
```
