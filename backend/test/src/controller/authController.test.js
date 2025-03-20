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
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { App } from '../../../app.js';
import { User } from '../../../src/repositories/userRepository.js';
import { Token } from '../../../src/repositories/tokenRepository.js';
import * as dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

let user;
let token;
let app;
let mongoServer;

describe('Auth Controller', () => {
    beforeAll(async () => {
        app = new App().config().middleware().routes().errorMiddleware().app;
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    beforeEach(async () => {
        user = new User({
            username: 'testuser',
            password: await bcrypt.hash('password', 10),
            email: 'testuser@example.com',
            age: 20,
        });
        await user.save();

        token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        const newToken = new Token({ token, enabled: true });
        await newToken.save();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    });

    describe('POST /signin', () => {
        it('should return 200 and a token for valid signin', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'password' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should return 401 for invalid username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'invaliduser', password: 'password' });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid username or password.');
        });

        it('should return 401 for invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid username or password.');
        });
    });

    describe('GET /info', () => {
        it('should return user info for valid token', async () => {
            const response = await request(app)
                .get('/api/auth/info')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: user.id,
                username: user.username,
                email: user.email,
            });
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app).get('/api/auth/info');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('User not logged in.');
        });

        it('should return 403 if token is disabled', async () => {
            await Token.updateOne({ token }, { enabled: false });

            const response = await request(app)
                .get('/api/auth/info')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Token disabled.');
        });
    });

    describe('DELETE /logout', () => {
        it('should logout user and disable token', async () => {
            const response = await request(app)
                .delete('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User logged out successfully');

            const disabledToken = await Token.findOne({ token: token });
            expect(disabledToken.enabled).toBe(false);
        });

        it('should return 404 if token is invalid', async () => {
            const invalidToken = jwt.sign(
                { id: user._id, username: user.username, email: user.email },
                'wrong_secret',
                { expiresIn: '2h' }
            );

            const response = await request(app)
                .delete('/api/auth/logout')
                .set('Authorization', `Bearer ${invalidToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Invalid token.');
        });
    });
});
