import mongoose, { Schema } from 'mongoose';

const gameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    rules: { type: String, required: true },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting',
    },
    players: [
        {
            _id: false,
            user_id: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            score: { type: Number, required: true, default: 0 },
            give_up: { type: Boolean, default: false },
            uno: { type: Boolean, default: false },
            ready: { type: Boolean, default: false },
            cards: [
                {
                    _id: false,
                    value: { type: String },
                    color: { type: String },
                },
            ],
        },
    ],
    deck: [
        {
            _id: false,
            value: { type: String },
            color: { type: String },
        },
    ],
    last_card: {
        _id: false,
        value: { type: String },
        color: { type: String },
    },
    in_default_direction: { type: Boolean, default: true },
    current_player_id: { type: Schema.Types.ObjectId, ref: 'User' },
    winner: { type: Schema.Types.ObjectId, ref: 'User' },
    maxPlayers: { type: Number, default: 4 },
    createdAt: { type: Date, default: Date.now, immutable: true },
});

export { gameSchema };
