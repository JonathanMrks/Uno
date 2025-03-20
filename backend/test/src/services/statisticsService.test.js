import {
    it,
    beforeEach,
    describe,
    expect,
    beforeAll,
    afterAll
} from '@jest/globals';
import {
    getAllStatistics,
    popularEndpoints,
    responseTimes,
    statusCodes
} from "../../../src/services/statisticsService.js";
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import {saveStatistics} from "../../../src/repositories/statisticsRepository.js";

const mongod = await MongoMemoryServer.create();

beforeAll(async () => {
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('statisticsService', () => {
    it('getAllStatistics should return aggregated statistics', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 1,
        });

        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'POST',
            statusCode: 201,
            responseTime: { avg: 200, min: 100, max: 300 },
            requestCount: 1,
        });

        const stats = await getAllStatistics();
        expect(stats).toEqual([
            {
                endpoint: '/test',
                totalRequests: 2,
                breakdown: { GET: 1, POST: 1 },
            },
        ]);
    });

    it('responseTimes should return response times for endpoints', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 1,
        });

        const responseTimesResult = await responseTimes();
        expect(responseTimesResult).toEqual({
            '/test': { avg: 100, min: 50, max: 150 },
        });
    });

    it('statusCodes should return status codes for a specific endpoint', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 1,
        });

        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'POST',
            statusCode: 201,
            responseTime: { avg: 200, min: 100, max: 300 },
            requestCount: 1,
        });

        const statusCodesResult = await statusCodes('/test');
        expect(statusCodesResult).toEqual({
            200: 1,
            201: 1,
        });
    });

    it('popularEndpoints should return the most popular endpoint', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 2,
        });

        await saveStatistics({
            endpointAccess: '/another',
            requestMethod: 'POST',
            statusCode: 201,
            responseTime: { avg: 200, min: 100, max: 300 },
            requestCount: 1,
        });

        const popularEndpointsResult = await popularEndpoints();
        expect(popularEndpointsResult).toEqual({
            most_popular: '/test',
            request_count: 2,
        });
    });
});