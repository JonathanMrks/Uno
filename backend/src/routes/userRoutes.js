import { Router } from 'express';
import {
    deleteUser,
    getUserById,
    postUser,
    putUser,
} from '../controllers/userController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { memoizationMiddleware } from '../middlewares/memoizationMiddleware.js';

const userRoutes = Router();

userRoutes.post('/', postUser);
userRoutes.get('/:id', authenticateJWT, memoizationMiddleware({max:100, maxAge: 300000}), getUserById);
userRoutes.put('/:id', authenticateJWT, putUser);
userRoutes.delete('/:id', authenticateJWT, deleteUser);

export default userRoutes;
