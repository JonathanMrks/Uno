import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import {
    getPopularEndpoints,
    getRequests,
    getResponseTimes,
    getStatusCodes
} from '../controllers/statisticsController.js';

const statisticsRoutes = Router();

statisticsRoutes.get('/requests', authenticateJWT, getRequests);
statisticsRoutes.get('/times', authenticateJWT, getResponseTimes);
statisticsRoutes.get('/codes', authenticateJWT, getStatusCodes);
statisticsRoutes.get('/popular', authenticateJWT, getPopularEndpoints);

export { statisticsRoutes };
