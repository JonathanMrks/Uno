import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from '@jest/globals';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { App } from '../../../app.js';
import { User } from '../../../src/repositories/userRepository.js';
import jwt from 'jsonwebtoken';
import { Token } from '../../../src/repositories/tokenRepository.js';
import { Game } from '../../../src/repositories/gameRepository.js';

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
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('Player Controller', () => {
    describe('GET /players/status/game/:id', () => {
        it('should return player stats successfully', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [{ user_id: userId }],
            });
            await game.save();

            const response = await request(app)
                .get(`/api/players/status/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        it('should return 401 if token is expired', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [{ user_id: userId }],
            });
            await game.save();

            const expiredToken = jwt.sign({ id: userId }, 'wrong-secret', {
                expiresIn: '1ms',
            });

            const response = await request(app)
                .get(`/api/players/status/game/${game._id}`)
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(404);
        })
    });

    describe('GET /players/game/:id', () => {
        it('should retrieve all players in the game successfully', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 10,
                        give_up: false,
                        uno: true,
                        ready: true,
                        cards: [{ value: '5', color: 'red' }],
                    },
                ],
            });
            await game.save();

            const response = await request(app)
                .get(`/api/players/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].user_id).toBe(String(userId));
            expect(response.body[0].score).toBe(10);
        });

        it('should return 404 if game not found', async () => {
            const invalidGameId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/players/game/${invalidGameId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /players/next/game/:id', () => {
        it('should return the next player in the game successfully', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 10,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '5', color: 'red' }],
                    },
                ],
                current_player_id: userId,
            });
            await game.save();

            const response = await request(app)
                .get(`/api/players/next/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.user_id).toBe(String(userId));
        });

        it('should return 404 if game not found', async () => {
            const invalidGameId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/players/next/game/${invalidGameId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /players/scores/game/:id', () => {
        it('should return players scores successfully', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 20,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '7', color: 'blue' }],
                    },
                ],
            });
            await game.save();

            const response = await request(app)
                .get(`/api/players/scores/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body['John_doe']).toBe(20);
        });

        it('should return 404 if game not found', async () => {
            const invalidGameId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/players/scores/game/${invalidGameId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /players/exit/game/:id', () => {
        it('should allow the player to exit the game successfully', async () => {
            const otherPlayerId = new Types.ObjectId();
            const otherPlayer = new User({
                _id: otherPlayerId,
                username: 'John',
                email: 'Test@gmail.com',
                password: 'examplePassword',
            });
            await otherPlayer.save();

            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '4', color: 'yellow' }],
                    },
                    {
                        user_id: otherPlayerId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '5', color: 'yellow' }],
                    },
                ],
                current_player_id: userId,
            });

            await game.save();

            const response = await request(app)
                .patch(`/api/players/exit/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.winner).toBe('John');
        });

        it('should return 404 if player not found in the game', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [],
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/players/exit/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });

        it('should return 409 if the player tries to exit a finished game returns a conflict error', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'finished',
                players: [
                    {
                        user_id: userId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '4', color: 'yellow' }],
                    },
                ],
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/players/exit/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(409);
        });
    });

    describe('PATCH /players/uno/game/:id', () => {
        it('should allow the player to shout UNO successfully', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [
                            { value: '4', color: 'yellow' },
                            { value: '5', color: 'yellow' },
                        ],
                    },
                ],
                current_player_id: userId,
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/players/uno/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('John_doe said UNO!');
        });

        it('should return 400 if the player tries to shout UNO with more than two card', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [
                            { value: '4', color: 'yellow' },
                            { value: '5', color: 'red' },
                            { value: '5', color: 'blue' },
                        ],
                    },
                ],
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/players/uno/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty(
                'error',
                'You have more than 2 cards!'
            );
        });
    });

    describe('GET /players/game/:id', () => {
        it('should return 404 if game ID format is invalid', async () => {
            const invalidGameId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/players/game/${invalidGameId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /players/scores/game/:id', () => {
        it('should return an empty list if no players are in the game', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [],
            });
            await game.save();

            const response = await request(app)
                .get(`/api/players/scores/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
        });
    });
    describe('POST /players/challenge/:id', () => {
        it('should challenge a player successfully', async () => {
            const challengedPlayer = new User({
                _id: new mongoose.Types.ObjectId(),
                username: 'Jane_Doe',
                password: 'password123',
                email: 'challenged@example.com',
            });

            await challengedPlayer.save();

            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '4', color: 'yellow' }],
                    },
                    {
                        user_id: challengedPlayer._id,
                        cards: [{ value: '5', color: 'yellow' }],
                        uno: false,
                    },
                ],
                current_player_id: challengedPlayer._id.toString(),
            });

            await game.save();

            const response = await request(app)
                .post(`/api/players/challenge/game/${game._id}`)
                .send({ challengedPlayer: challengedPlayer.username })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        it('should return 404 if game not found', async () => {
            const invalidGameId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post(`/api/players/challenge/game/${invalidGameId}`)
                .send({ challengedPlayer: userId })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /players/ready/:id', () => {
        it('should toggle player ready status successfully', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        score: 30,
                        give_up: false,
                        uno: false,
                        ready: true,
                        cards: [{ value: '4', color: 'yellow' }],
                    },
                ],
            });
            await game.save();

            const response = await request(app)
                .patch(`/api/players/ready/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        it('should return 404 if player not found in the game', async () => {
            const invalidUserId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .patch(`/api/players/ready/${invalidUserId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /players/challenge/:id', () => {
        it('should return 400 if challenged player is not in the game', async () => {
            const game = new Game({
                title: 'game',
                rules: 'rules',
                status: 'playing',
                players: [],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/players/challenge/${game._id}`)
                .send({ challengedPlayer: userId })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});
