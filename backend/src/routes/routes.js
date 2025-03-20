import { Router } from 'express';
import userRoutes from './userRoutes.js';
import gameRoutes from './gameRoutes.js';
import playerRoutes from './playerRoutes.js';
import cardRoutes from './cardRoutes.js';
import authRoutes from './authRoutes.js';
import { historyRoutes } from './historyRoutes.js';
import { statisticsRoutes } from './statisticsRoutes.js';

const routes = Router();

routes.use('/users', userRoutes);
routes.use('/games', gameRoutes);
routes.use('/players', playerRoutes);
routes.use('/cards', cardRoutes);
routes.use('/auth', authRoutes);
routes.use('/history', historyRoutes);
routes.use('/stats', statisticsRoutes);

export default routes;
