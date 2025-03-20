import { Schema } from 'mongoose';

const statisticsSchema = new Schema({
    endpointAccess: { type: String, required: true },
    requestMethod: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTime: {
        avg: { type: Number, required: true },
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    requestCount: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now, immutable: true },
});

export { statisticsSchema };
