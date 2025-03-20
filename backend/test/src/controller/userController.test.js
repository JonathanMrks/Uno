import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { App } from '../../../app.js';
import { User } from '../../../src/repositories/userRepository.js';
import jwt from 'jsonwebtoken';
import { Token } from '../../../src/repositories/tokenRepository.js';

let mongoServer;
let token;
let userId;
let app;

beforeAll(async () => {
    app = new App().config().middleware().routes().errorMiddleware().app;
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    const user = new User({
        _id: userId,
        username: 'John_doe',
        password: '123',
        age: 20,
        email: 'teste@email.com',
    });
    await user.save();

    token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    const newToken = new Token({ token: token, enabled: true });
    await newToken.save();
});

afterEach(async () => {
    jest.clearAllMocks();
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('User Controller', () => {
    describe('POST /users', () => {
        it('should create a new user successfully', async () => {
            const response = await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('username', 'Jane_doe');
        });

        it('should return 409 if username already exists', async () => {
            await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });

            const response = await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane2@example.com',
            });

            expect(response.status).toBe(409);
        });

        it('should return 409 if email already exists', async () => {
            await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });

            const response = await request(app).post('/api/users').send({
                username: 'Jane_doe2',
                password: '1234',
                email: 'jane@example.com',
            });

            expect(response.status).toBe(409);
        });
    });

    describe('GET /users/:id', () => {
        it('should return a user by ID', async () => {
            const response = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('username', 'John_doe');
        });

        it('should return 404 if user not found', async () => {
            const invalidUserId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/users/${invalidUserId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /users/:id', () => {
        it('should update a user successfully', async () => {
            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'John_updated',
                    password: '1234',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('username', 'John_updated');
        });

        it('should return 403 if unauthorized to update another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const otherUser = new User({
                _id: otherUserId,
                username: 'AnotherUser',
                password: '1234',
                email: 'anotheruser@example.com',
            });
            await otherUser.save();

            const response = await request(app)
                .put(`/api/users/${otherUserId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'Hacker',
                    password: '4321',
                    age: 22,
                });

            expect(response.status).toBe(403);
        });

        it('should return 403 for unauthorized user', async () => {
            const invalidUserId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put(`/api/users/${invalidUserId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'John_updated',
                    password: '1234',
                });

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /users/:id', () => {
        it('should delete a user successfully', async () => {
            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(204);
        });

        it('should return 403 if unauthorized to delete another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const otherUser = new User({
                _id: otherUserId,
                username: 'AnotherUser',
                password: '1234',
                age: 30,
                email: 'anotheruser@example.com',
            });
            await otherUser.save();

            const response = await request(app)
                .delete(`/api/users/${otherUserId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });
    });
});
