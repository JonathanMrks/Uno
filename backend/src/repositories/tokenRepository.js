import { tokenSchema } from '../models/tokenSchema.js';
import mongoose from 'mongoose';

const Token = mongoose.model('Token', tokenSchema);

export { Token };
