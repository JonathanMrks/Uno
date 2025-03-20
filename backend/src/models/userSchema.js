import mongoose, { Schema } from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, maxlength: 12 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    games: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
    win_count: { type: Number },
    createdAt: { type: Date, default: Date.now, immutable: true },
});

export { userSchema };
