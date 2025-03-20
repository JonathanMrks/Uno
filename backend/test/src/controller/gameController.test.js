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
import { Game } from '../../../src/repositories/gameRepository.js';
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

describe('Game Controller', () => {
    describe('POST /create', () => {
        it('should create a new game successfully', async () => {
            const response = await request(app)
                .post('/api/games')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'UNO',
                    rules: 'Standard Rules',
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('UNO');
            expect(response.body.rules).toBe('Standard Rules');
        });
    });

    describe('GET /game/:id', () => {
        it('should return the game details', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'waiting',
            });
            await game.save();

            const response = await request(app)
                .get(`/api/games/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('UNO');
            expect(response.body.rules).toBe('Standard Rules');
            expect(response.body.status).toBe('waiting');
        });

        it('should return 404 if game not found', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/games/${nonExistentId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(
                'Game with specified ID not found.'
            );
        });
    });

    describe('DELETE /game/:id', () => {
        it('should delete the game successfully', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'waiting',
            });
            await game.save();

            const response = await request(app)
                .delete(`/api/games/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(204);
        });
    });
});

describe('Game Session Controller', () => {
    describe('POST /game/:id/join', () => {
        it('should successfully join a game', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'waiting',
                players: [],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/games/${game._id}/join`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe(
                'User joined the game successfully!'
            );
        });

        it('should return 404 if the game is not found', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post(`/api/games/${nonExistentId}/join`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(
                'Game with specified ID not found.'
            );
        });

        it('should return 400 if the user is already in the game', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'waiting',
                players: [{ user_id: userId }],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/games/${game._id}/join`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('User is already in this game.');
        });
    });

    describe('PATCH /game/:id/start', () => {
        it('should successfully start a game', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'waiting',
                players: [{ user_id: userId, ready: true }],
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/games/${game._id}/start`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.game_status).toBe('playing');
        });

        it('should return 404 if the game is not found', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/games/${nonExistentId}/start`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(
                'Game with specified ID not found.'
            );
        });

        it('should return 400 if the game has already started', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [{ user_id: userId }],
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/games/${game._id}/start`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(405);
            expect(response.body.error).toBe('This game has already started.');
        });
    });
});
