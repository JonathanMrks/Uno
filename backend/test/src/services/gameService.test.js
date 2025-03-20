import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Game } from '../../../src/repositories/gameRepository.js';
import {
    createGame,
    deleteGameById,
    getGameById,
} from '../../../src/services/gameService.js';
import NotFoundError from '../../../src/middlewares/Errors/NotFoundError.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('createGame', () => {
    it('should create a new game with required fields', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            players: [],
        };
        const newGame = await createGame(gameData);
        expect(newGame).toHaveProperty('id');
        expect(newGame.title).toBe('UNO');
        expect(newGame.rules).toBe('Standard Rules');
        expect(newGame.status).toBe('waiting');
        expect(newGame.last_card).toEqual({ value: 'wild', color: 'black' });
    });
});

describe('findGame', () => {
    it('should find a game by ID', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            players: [],
        };
        const createdGame = new Game(gameData);
        await createdGame.save();

        const foundGame = await getGameById(createdGame._id);
        expect(foundGame.id.toString()).toBe(createdGame._id.toString());
    });

    it('should throw NotFoundError if game not found', async () => {
        expect.assertions(1);
        try {
            await getGameById(new mongoose.Types.ObjectId());
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError);
        }
    });
});

describe('deleteGame', () => {
    it('should delete a game by ID', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            players: [],
        };
        const createdGame = new Game(gameData);
        await createdGame.save();

        await deleteGameById(createdGame._id);

        try {
            await getGameById(createdGame._id.toString());
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError);
        }
    });

    it('should throw NotFoundError if game to delete is not found', async () => {
        expect.assertions(1);
        try {
            await deleteGameById(new mongoose.Types.ObjectId());
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError);
        }
    });
});
