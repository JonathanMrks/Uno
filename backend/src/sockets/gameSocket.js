import WebSocket from 'ws';
import { Game } from '../repositories/gameRepository.js';
import { unoLogger } from '../middlewares/loggers/unoLogger.js';

const playerConnections = new Map();

function handleSocketConnection(ws, playerId) {
    playerConnections.set(playerId, ws);
    unoLogger.info('WSS: Player connected ID: ' + playerId);

    ws.on('close', () => {
        unoLogger.info('WSS: Player disconnected ID: ' + playerId);
        playerConnections.delete(playerId);
    });
}

function _notifyPlayer(playerId, message) {
    const ws = playerConnections.get(playerId);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

async function notifyRoom(gameId, message, sendingPlayerId) {
    const room = await Game.findById(gameId);

    room.players.forEach((player) => {
        const playerId = player.user_id.toString();

        if (playerId !== sendingPlayerId) {
            _notifyPlayer(playerId, message);
        }
    });
}

export { handleSocketConnection, notifyRoom };
