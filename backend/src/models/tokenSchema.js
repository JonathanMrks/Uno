import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
});

export { tokenSchema };
