import { gameSchema } from '../models/gameSchema.js';
import mongoose from 'mongoose';

const Game = mongoose.model('Game', gameSchema);

export { Game };
