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
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { App } from '../../../app.js';
import { Game } from '../../../src/repositories/gameRepository.js';
import { User } from '../../../src/repositories/userRepository.js';
import jwt from 'jsonwebtoken';
import { Token } from '../../../src/repositories/tokenRepository.js';
import { History } from '../../../src/repositories/historyRepository.js';

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

describe('Card Controller', () => {
    describe('POST /play/game/:id', () => {
        it('should play a card successfully', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [
                            { value: '2', color: 'red' },
                            { value: '3', color: 'red' },
                        ],
                    },
                ],
                current_player_id: userId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const history = new History({ game_id: game._id });
            history.save();

            const response = await request(app)
                .post(`/api/cards/play/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ value: '2', color: 'red' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Card played successfully.');
            expect(response.body.nextPlayer).toBe('John_doe');
        });

        it('should add the played card to the history actions', async () => {
            const playedCard = { value: '2', color: 'red' };
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [playedCard, { value: '3', color: 'red' }],
                    },
                ],
                current_player_id: userId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const history = new History({
                game_id: game._id,
                actions: [],
            });
            await history.save();

            const response = await request(app)
                .post(`/api/cards/play/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(playedCard);

            expect(response.status).toBe(200);

            const updatedHistory = await History.findOne({ game_id: game._id });
            const lastAction = updatedHistory.actions.pop();

            expect(lastAction).toBeDefined();
            expect(lastAction.action).toMatchObject(playedCard);
            expect(lastAction.user_id.toString()).toBe(userId.toString());
        });
    });

    describe('GET /last/game/:id', () => {
        it('should return the last played card', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                last_card: { value: 'wild', color: 'black' },
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/last/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ value: 'wild', color: 'black' });
        });
    });

    describe('GET /draw/game/:id', () => {
        it('should return the top card from the deck', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [],
                    },
                ],
                deck: [{ value: '2', color: 'red' }],
                current_player_id: userId.toString(),
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/draw/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.newCard.value).toBe('2');
            expect(response.body.newCard.color).toBe('red');
        });
    });

    describe('GET /hand/game/:id', () => {
        it('should return all hand cards from the player', async () => {
            const cards = [
                { value: '2', color: 'red' },
                { value: '6', color: 'blue' },
                { value: '0', color: 'yellow' },
            ];
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: cards,
                    },
                ],
                deck: [{ value: '2', color: 'red' }],
                current_player_id: userId.toString(),
            });

            await game.save();

            const response = await request(app)
                .get(`/api/cards/hand/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.player).toEqual(
                (await User.findById(userId)).username
            );
            expect(response.body.cards).toEqual(cards);
        });
    });

    describe('GET /check-if-possible-to-play/game/:id', () => {
        it('should return true if a card can be played', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [
                            { value: '2', color: 'red' },
                            { value: '3', color: 'red' },
                        ],
                    },
                ],
                last_card: { value: '2', color: 'red' },
                current_player_id: userId.toString(),
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/check/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.isPossibleToPlay).toBe(true);
        });

        it('should return the drawn card if no card can be played', async () => {
            jest.mock('../../../src/services/cardsService.js', () => ({
                isPossibleToPlay: jest.fn().mockResolvedValue({
                    newCard: { value: '4', color: 'blue' },
                    nextPlayer: 'Jane_doe',
                }),
            }));

            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [
                            { value: '2', color: 'green' },
                            { value: '3', color: 'yellow' },
                        ],
                    },
                ],
                last_card: { value: '4', color: 'red' },
                current_player_id: userId.toString(),
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/check/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.nextPlayer).toBe('John_doe');
        });
    });
    describe('GET /last/game/:id', () => {
        it('should return null if there is no last card', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [{ value: '3', color: 'red' }],
                    },
                ],
                current_player_id: userId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/last/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
        });
    });

    describe('GET /hand/game/:id', () => {
        it('should return an empty object if the player has no cards', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [],
                    },
                ],
                deck: [{ value: '2', color: 'red' }],
                current_player_id: userId.toString(),
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/hand/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.player).toEqual('John_doe');
            expect(response.body.cards).toEqual([]);
        });

        it('should return an empty object if the game is finished', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'finished',
                players: [
                    {
                        user_id: userId,
                        cards: [{ value: '3', color: 'red' }],
                    },
                ],
                current_player_id: userId.toString(),
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/hand/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(405);
            expect(response.body.error).toBe('The Game is not running.');
        });
    });
});

describe('Card Controller Edge Cases', () => {
    describe('POST /play/game/:id (Edge Cases)', () => {
        it('should return an error if the card is not in the player’s hand', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [
                            { value: '3', color: 'red' },
                            { value: '3', color: 'blue' },
                        ],
                    },
                ],
                current_player_id: userId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/cards/play/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ value: '5', color: 'blue' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Player does not have the card.');
        });

        it('should return an error if the game is over', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'finished',
                players: [
                    {
                        user_id: userId,
                        cards: [{ value: '3', color: 'red' }],
                    },
                ],
                current_player_id: userId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/cards/play/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ value: '3', color: 'red' });

            expect(response.status).toBe(405);
            expect(response.body.error).toBe('The Game is not running.');
        });
    });

    describe('GET /draw/game/:id (Edge Cases)', () => {
        it('should return a 400 if the deck is empty', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [],
                    },
                ],
                deck: [],
                current_player_id: userId.toString(),
            });
            await game.save();

            const response = await request(app)
                .get(`/api/cards/draw/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Deck is empty.');
        });
    });
    describe('POST /play/game/:id (Edge Cases)', () => {
        it('should return an error if the game does not exist', async () => {
            const response = await request(app)
                .post(`/api/cards/play/game/${new Types.ObjectId()}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ value: '5', color: 'blue' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(
                'Game with specified ID not found.'
            );
        });

        it('should return an error if the user is not playing', async () => {
            const otherPlayerId = new Types.ObjectId();
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'playing',
                players: [
                    {
                        user_id: userId,
                        cards: [{ value: '3', color: 'red' }],
                    },
                    {
                        user_id: otherPlayerId,
                        cards: [{ value: '3', color: 'blue' }],
                    },
                ],
                current_player_id: otherPlayerId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/cards/play/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ value: '3', color: 'red' });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe("It is not the player's turn.");
        });

        it('should return an error if the game has finished', async () => {
            const game = new Game({
                title: 'UNO',
                rules: 'Standard Rules',
                status: 'finished',
                players: [
                    {
                        user_id: userId,
                        cards: [{ value: '3', color: 'red' }],
                    },
                ],
                current_player_id: userId.toString(),
                deck: [{ value: '4', color: 'red' }],
            });
            await game.save();

            const response = await request(app)
                .post(`/api/cards/play/game/${game._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ value: '3', color: 'red' });

            expect(response.status).toBe(405);
            expect(response.body.error).toBe('The Game is not running.');
        });
    });
});
