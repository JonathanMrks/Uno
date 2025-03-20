import {statisticsSchema} from "../models/statisticsSchema.js";
import mongoose from 'mongoose';

const Statistics = mongoose.model('Statistic', statisticsSchema);

async function saveStatistics(statistics) {
    const existingStats = await Statistics.findOne({
        endpointAccess: statistics.endpointAccess,
        requestMethod: statistics.requestMethod,
    });

    if (existingStats) {
        const newRequestCount = existingStats.requestCount + 1;

        const newAvg = (existingStats.responseTime.avg * existingStats.requestCount + statistics.responseTime.avg) / newRequestCount;
        const newMin = Math.min(existingStats.responseTime.min, statistics.responseTime.avg);
        const newMax = Math.max(existingStats.responseTime.max, statistics.responseTime.avg);

        await Statistics.findByIdAndUpdate(
            existingStats._id,
            {
                $inc: { requestCount: 1 },
                $set: {
                    responseTime: { avg: newAvg, min: newMin, max: newMax },
                    statusCode: statistics.statusCode,
                    timestamp: new Date(),
                    userId: statistics.userId,
                },
            },
            { new: true }
        );
    } else {
        await Statistics.create(statistics);
    }
}

export { Statistics, saveStatistics };
