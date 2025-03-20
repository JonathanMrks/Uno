import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { getHistory } from '../controllers/historyController.js';

const historyRoutes = Router();

historyRoutes.get('/game/:id', authenticateJWT, getHistory);

export { historyRoutes };
