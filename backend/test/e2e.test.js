import {
    afterAll,
    afterEach,
    beforeAll,
    jest,
    describe,
    expect,
    beforeEach,
    it,
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { App } from '../app.js';

describe('E2E Tests', () => {
    let app;
    let mongoServer;
    let token;
    let user;

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

    afterEach(async () => {
        jest.clearAllMocks();
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    });

    describe('User Flow Tests', () => {
        it('create account -> login -> get user info', async () => {
            // Create account
            let response = await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('username', 'Jane_doe');

            // Login
            response = await request(app).post('/api/auth/login').send({
                username: 'Jane_doe',
                password: '1234',
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            token = response.body.token;

            // Get user info
            response = await request(app)
                .get('/api/auth/info')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: expect.any(String),
                username: 'Jane_doe',
                email: 'jane@example.com',
            });
        });

        it('login -> host -> ready', async () => {
            // Create account
            let response = await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });
            user = response.body;
            expect(response.status).toBe(201);

            // Login
            response = await request(app).post('/api/auth/login').send({
                username: 'Jane_doe',
                password: '1234',
            });
            expect(response.status).toBe(200);
            token = response.body.token;

            response = await request(app)
                .post('/api/games')
                .send({
                    title: 'UNO',
                    rules: 'Standard Rules',
                    status: 'waiting',
                    players: [
                        { user_id: user.id, ready: true },
                        { user_id: new mongoose.Types.ObjectId(), ready: true },
                    ],
                })
                .set('Authorization', `Bearer ${token}`);

            const game = response.body;

            // Ready up
            response = await request(app)
                .patch(`/api/games/${game.id}/start`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.game_status).toBe('playing');
        });

        it('login -> join -> ready', async () => {
            // Create account
            let response = await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });
            user = response.body;
            expect(response.status).toBe(201);

            // Login
            response = await request(app).post('/api/auth/login').send({
                username: 'Jane_doe',
                password: '1234',
            });
            expect(response.status).toBe(200);
            token = response.body.token;

            response = await request(app)
                .post('/api/games')
                .send({
                    title: 'UNO',
                    rules: 'Standard Rules',
                    status: 'waiting',
                    players: [
                        { user_id: new mongoose.Types.ObjectId(), ready: true },
                    ],
                })
                .set('Authorization', `Bearer ${token}`);

            const game = response.body;

            // Join the game
            response = await request(app)
                .post(`/api/games/${game.id}/join`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe(
                'User joined the game successfully!'
            );

            // Ready up
            response = await request(app)
                .patch(`/api/players/ready/game/${game.id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
        });
    });

    describe('Game Flow Tests', () => {
        let game;
        let otherPlayer;
        beforeEach(async () => {
            // Create account
            let response = await request(app).post('/api/users').send({
                username: 'Jane_doe',
                password: '1234',
                email: 'jane@example.com',
            });
            user = response.body;
            expect(response.status).toBe(201);

            // Create OtherPlayer account
            response = await request(app).post('/api/users').send({
                username: 'Anny_Doe',
                password: '1234',
                email: 'anny@example.com',
            });
            otherPlayer = response.body;

            // Login
            response = await request(app).post('/api/auth/login').send({
                username: 'Jane_doe',
                password: '1234',
            });
            token = response.body.token;
            expect(response.status).toBe(200);

            // Create a game
            response = await request(app)
                .post('/api/games')
                .send({
                    title: 'UNO',
                    rules: 'Standard Rules',
                    status: 'waiting',
                    players: [
                        { user_id: user.id, ready: true },
                        { user_id: otherPlayer.id, ready: true },
                    ],
                })
                .set('Authorization', `Bearer ${token}`);

            game = response.body;
        });

        it('start -> check -> play a card', async () => {
            // Start the game
            let response = await request(app)
                .patch(`/api/games/${game.id}/start`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.game_status).toBe('playing');

            // Check the game cards state
            response = await request(app)
                .get(`/api/cards/check/game/${game.id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.isPossibleToPlay).toEqual(true);

            // Get the player Cards Info
            response = await request(app)
                .get(`/api/cards/hand/game/${game.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Play a card
            const playedCard = response.body.cards[0]; // Example card
            response = await request(app)
                .post(`/api/cards/play/game/${game.id}`)
                .send(playedCard)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('nextPlayer');
        });

        it('start -> give up', async () => {
            // Start the game
            let response = await request(app)
                .patch(`/api/games/${game.id}/start`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.game_status).toBe('playing');

            // Give up
            response = await request(app)
                .patch(`/api/players/exit/game/${game.id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.winner);
        });
    });
});
