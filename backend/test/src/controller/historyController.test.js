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
import { History } from '../../../src/repositories/historyRepository.js';
import jwt from 'jsonwebtoken';
import { Token } from '../../../src/repositories/tokenRepository.js';
import { Game } from '../../../src/repositories/gameRepository.js';

jest.mock('../../../src/services/historyService.js', () => ({
    default: jest.fn(),
}));

let mongoServer;
let token;
let userId;
let gameID;
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
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    const newToken = new Token({ token: token, enabled: true });
    await newToken.save();

    const game = new Game({
        title: 'UNO',
        rules: 'Standard Rules',
        status: 'waiting',
        players: [{ user_id: userId }],
    });
    await game.save();
    gameID = game._id;
});

afterEach(async () => {
    jest.clearAllMocks();
});

describe('History Controller', () => {
    describe('GET /history/:id', () => {
        it('should return the history details for the given ID', async () => {
            const mockHistory = {
                game_id: gameID,
                actions: [
                    {
                        user_id: userId,
                        action: {
                            value: '3',
                            color: 'blue',
                        },
                    },
                    {
                        user_id: userId,
                        action: {
                            value: '7',
                            color: 'blue',
                        },
                    },
                ],
            };

            const history = new History(mockHistory);
            await history.save();

            const response = await request(app)
                .get(`/api/history/game/${gameID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.game_id).toBe(mockHistory.game_id.toString());
            expect(response.body.actions).toEqual(
                mockHistory.actions.map((action) => ({
                    ...action,
                    user_id: action.user_id.toString(),
                }))
            );
        });

        it('should return 404 if history not found', async () => {
            const response = await request(app)
                .get(`/api/history/game/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe(
                'The game history does not exist!'
            );
        });
    });
});
