import { userSchema } from '../models/userSchema.js';
import mongoose from 'mongoose';

const User = mongoose.model('User', userSchema);

export { User };
