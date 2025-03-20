import {
    it,
    beforeEach,
    describe,
    expect,
    beforeAll,
    afterAll
} from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {saveStatistics} from "../../../src/repositories/statisticsRepository.js";
import {
    getPopularEndpoints,
    getRequests,
    getResponseTimes,
    getStatusCodes
} from "../../../src/controllers/statisticsController.js";

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

const app = express();
app.use(express.json());
app.get('/requests', getRequests);
app.get('/times', getResponseTimes);
app.get('/codes', getStatusCodes);
app.get('/popular', getPopularEndpoints);

describe('statisticsController', () => {
    it('GET /requests should return all statistics', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 1,
        });

        const response = await request(app).get('/requests');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                endpoint: '/test',
                totalRequests: 1,
                breakdown: { GET: 1 },
            },
        ]);
    });

    it('GET /times should return response times', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 1,
        });

        const response = await request(app).get('/times');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            '/test': { avg: 100, min: 50, max: 150 },
        });
    });

    it('GET /codes should return status codes for a specific endpoint', async () => {
        await saveStatistics({
            endpointAccess: '/test',
            requestMethod: 'GET',
            statusCode: 200,
            responseTime: { avg: 100, min: 50, max: 150 },
            requestCount: 1,
        });

        const response = await request(app).get('/codes').query({ endpoint: '/test' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            200: 1,
        });
    });

    it('GET /popular should return the most popular endpoint', async () => {
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

        const response = await request(app).get('/popular');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            most_popular: '/test',
            request_count: 2,
        });
    });
});
