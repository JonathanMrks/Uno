import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import {
    getCheckIfIsPossibleToPlay,
    getDrawCard,
    getHandCards,
    getLastCard,
    postPlayCard,
} from '../controllers/cardController.js';

const cardRoutes = Router();

cardRoutes.post('/play/game/:id', authenticateJWT, postPlayCard);
cardRoutes.get('/last/game/:id', authenticateJWT, getLastCard);
cardRoutes.get('/draw/game/:id', authenticateJWT, getDrawCard);
cardRoutes.get('/check/game/:id', authenticateJWT, getCheckIfIsPossibleToPlay);
cardRoutes.get('/hand/game/:id', authenticateJWT, getHandCards);

export default cardRoutes;
