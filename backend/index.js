import { App } from './app.js';
import { createServer } from 'http';
import { handleSocketConnection } from './src/sockets/gameSocket.js';
import { WebSocketServer } from 'ws';
import { unoLogger } from './src/middlewares/loggers/unoLogger.js';

(async () => {
    const appInstance = new App();

    appInstance.config().middleware().routes().errorMiddleware();
    await appInstance.database();

    const server = createServer(appInstance.app);
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const playerId = url.searchParams.get('playerId');

        wss.handleUpgrade(request, socket, head, (ws) => {
            handleSocketConnection(ws, playerId);
        });
    });

    server.listen(process.env.PORT || 3000, () => {
        unoLogger.info('Database connected and server started.');
    });
})();
