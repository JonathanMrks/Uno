import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import {
    getNextPlayer,
    getPlayers,
    getPlayersScores,
    getPlayersStatuses,
    patchExitGame,
    patchShoutUno,
    patchToggleReady,
    postChallengePlayer,
} from '../controllers/playerController.js';

const playerRoutes = Router();

playerRoutes.post('/challenge/game/:id', authenticateJWT, postChallengePlayer);
playerRoutes.get('/game/:id', authenticateJWT, getPlayers);
playerRoutes.get('/next/game/:id', authenticateJWT, getNextPlayer);
playerRoutes.get('/status/game/:id', authenticateJWT, getPlayersStatuses);
playerRoutes.get('/scores/game/:id', authenticateJWT, getPlayersScores);
playerRoutes.patch('/ready/game/:id', authenticateJWT, patchToggleReady);
playerRoutes.patch('/uno/game/:id', authenticateJWT, patchShoutUno);
playerRoutes.patch('/exit/game/:id', authenticateJWT, patchExitGame);

export default playerRoutes;
