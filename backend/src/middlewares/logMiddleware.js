import { unoLogger } from './loggers/unoLogger.js';
import { saveStatistics } from '../repositories/statisticsRepository.js';
import mongoose from "mongoose";

const logMiddleware = async (req, res, next) => {
    const { method } = req;
    const start = Date.now();
    let userId = null;

    res.on('finish', async () => {
        if (req.user && req.user.id) {
            userId = new mongoose.Types.ObjectId(userId);
        }
        const duration = Date.now() - start;
        const statistics = {
            endpointAccess: req.originalUrl,
            requestMethod: method,
            statusCode: res.statusCode,
            responseTime: { avg: duration, min: duration, max: duration },
            requestCount: 1,
            timestamp: new Date(),
            userId: userId,
        };

        await saveStatistics(statistics);

        unoLogger.log('info', JSON.stringify(statistics), statistics);
    });

    next();
};

export { logMiddleware };
