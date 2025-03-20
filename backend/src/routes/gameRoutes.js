import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import {
    deleteGame,
    getGame,
    patchStartGame,
    postGame,
    postJoinGame,
} from '../controllers/gameController.js';

const gameRoutes = Router();

// Game Entity CRUD
gameRoutes.post('/', authenticateJWT, postGame);
gameRoutes.get('/:id', authenticateJWT, getGame);
gameRoutes.delete('/:id', authenticateJWT, deleteGame);

// Session Managing
gameRoutes.post('/:id/join', authenticateJWT, postJoinGame);
gameRoutes.patch('/:id/start', authenticateJWT, patchStartGame);

export default gameRoutes;
