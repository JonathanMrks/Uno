import mongoose, { Schema } from 'mongoose';

const historySchema = mongoose.Schema({
    game_id: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
        unique: true,
    },
    actions: [
        {
            _id: false,
            user_id: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            action: {
                _id: false,
                value: { type: String },
                color: { type: String },
            },
        },
    ],
    createdAt: { type: Date, default: Date.now, immutable: true },
});

export { historySchema };
