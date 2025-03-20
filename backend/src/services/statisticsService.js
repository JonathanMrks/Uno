import { Statistics } from '../repositories/statisticsRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';
import BadRequestError from '../middlewares/Errors/BadRequestError.js';

async function getAllStatistics() {
    try {
        return Statistics.aggregate([
            {
                $group: {
                    _id: '$endpointAccess',
                    totalRequests: { $sum: '$requestCount' },
                    methods: {
                        $push: { k: '$requestMethod', v: '$requestCount' },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    endpoint: '$_id',
                    totalRequests: 1,
                    breakdown: { $arrayToObject: '$methods' },
                },
            },
        ]);
    } catch (err) {
        if (err.name === 'MongoError') {
            throw new BadRequestError(
                'Database error occurred while fetching statistics.'
            );
        } else {
            throw new NotFoundError(
                'Was not possible to get all the statistics'
            );
        }
    }
}

async function responseTimes() {
    try {
        const docs = await Statistics.aggregate([
            {
                $group: {
                    _id: '$endpointAccess',
                    avgResponseTime: { $avg: '$responseTime.avg' },
                    minResponseTime: { $min: '$responseTime.min' },
                    maxResponseTime: { $max: '$responseTime.max' },
                },
            },
            {
                $project: {
                    _id: 0,
                    endpoint: '$_id',
                    avgResponseTime: 1,
                    minResponseTime: 1,
                    maxResponseTime: 1,
                },
            },
        ]);

        if (docs.length === 0) {
            throw new NotFoundError('No statistics found for any endpoints');
        }

        return docs.reduce((acc, doc) => {
            acc[doc.endpoint] = {
                avg: doc.avgResponseTime,
                min: doc.minResponseTime,
                max: doc.maxResponseTime,
            };
            return acc;
        }, {});
    } catch (err) {
        if (err.name === 'MongoError') {
            throw new BadRequestError(
                'Database error occurred while fetching response times.'
            );
        } else {
            throw new NotFoundError(
                'Was not possible to get response times for all endpoints'
            );
        }
    }
}

async function statusCodes(endpoint) {
    try {
        const stats = await Statistics.aggregate([
            { $match: { endpointAccess: endpoint } },
            {
                $group: {
                    _id: '$statusCode',
                    count: { $sum: '$requestCount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    statusCode: '$_id',
                    count: 1,
                },
            },
        ]);

        if (stats.length === 0) {
            throw new NotFoundError(
                `No status codes found for endpoint: ${endpoint}`
            );
        }

        return stats.reduce((acc, stat) => {
            acc[stat.statusCode] = stat.count;
            return acc;
        }, {});
    } catch (err) {
        if (err.name === 'MongoError') {
            throw new BadRequestError(
                'Database error occurred while fetching status codes.'
            );
        } else {
            throw new NotFoundError(
                `No status codes found for endpoint: ${endpoint}`
            );
        }
    }
}

async function popularEndpoints() {
    try {
        const docs = await Statistics.aggregate([
            {
                $group: {
                    _id: '$endpointAccess',
                    request_count: { $sum: '$requestCount' }
                },
            },
            {
                $sort: { request_count: -1 },
            },
            { $limit: 1 },
        ]);

        if (docs.length === 0) {
            throw new NotFoundError('No popular endpoints found.');
        }

        return {
            most_popular: docs[0]._id,
            request_count: docs[0].request_count
        };
    } catch (err) {
        if (err.name === 'MongoError') {
            throw new BadRequestError(
                'Database error occurred while finding popular endpoints.'
            );
        } else {
            throw new NotFoundError('No popular endpoints found.');
        }
    }
}

export { getAllStatistics, responseTimes, statusCodes, popularEndpoints };
