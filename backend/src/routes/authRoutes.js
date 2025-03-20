import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import {
    deleteLogout,
    getInfo,
    postLogin,
} from '../controllers/authController.js';

const authRoutes = Router();

authRoutes.post('/login', postLogin);
authRoutes.get('/info', authenticateJWT, getInfo);
authRoutes.delete('/logout', authenticateJWT, deleteLogout);

export default authRoutes;
