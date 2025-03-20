import {
    getAllStatistics,
    popularEndpoints,
    responseTimes,
    statusCodes,
} from '../services/statisticsService.js';

const getRequests = async (req, res, next) => {
    try {
        const statistics = await getAllStatistics();
        res.json(statistics);
    } catch (error) {
        next(error);
    }
};

const getResponseTimes = async (req, res, next) => {
    try {
        const stats = await responseTimes();
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

const getStatusCodes = async (req, res, next) => {
    const { endpoint } = req.query;
    try {
        const stats = await statusCodes(endpoint);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

const getPopularEndpoints = async (req, res, next) => {
    const { method } = req.params;
    try {
        const stats = await popularEndpoints(method);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

export { getRequests, getResponseTimes, getStatusCodes, getPopularEndpoints };
