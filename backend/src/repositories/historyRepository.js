import mongoose from 'mongoose';
import { historySchema } from '../models/historySchema.js';

const History = mongoose.model('History', historySchema);

export { History };
