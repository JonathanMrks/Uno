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
import {
    addGameHistoryAction,
    createHistory,
    gameHistory,
} from '../../../src/services/historyService.js';
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

describe('createHistory', () => {
    it('should create a new history with required fields', async () => {
        const historyData = {
            game_id: new mongoose.Types.ObjectId(),
            actions: [],
        };
        const newHistory = await createHistory(historyData);
        expect(newHistory).toHaveProperty('id');
        expect(newHistory.game_id.toString()).toBe(
            historyData.game_id.toString()
        );
        expect(newHistory.actions.length).toBe(0);
    });
});

describe('addHistoryAction', () => {
    it('should add a new action to the history', async () => {
        const historyData = {
            game_id: new mongoose.Types.ObjectId(),
            actions: [],
        };
        const newHistory = await createHistory(historyData);

        const actionData = {
            user_id: new mongoose.Types.ObjectId(),
            action: { value: 'draw', color: 'red' },
        };
        const updatedHistory = await addGameHistoryAction(
            newHistory.game_id,
            actionData
        );

        expect(updatedHistory.actions.length).toBe(1);
        expect(updatedHistory.actions[0].user_id.toString()).toBe(
            actionData.user_id.toString()
        );
        expect(updatedHistory.actions[0].action.value).toBe('draw');
        expect(updatedHistory.actions[0].action.color).toBe('red');
    });

    it('should throw NotFoundError if history not found', async () => {
        expect.assertions(1);
        try {
            await addGameHistoryAction(new mongoose.Types.ObjectId(), {
                user_id: new mongoose.Types.ObjectId(),
                action: { value: 'draw', color: 'red' },
            });
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError);
        }
    });
});

describe('historyInfos', () => {
    it('should retrieve history info by game ID', async () => {
        const historyData = {
            game_id: new mongoose.Types.ObjectId(),
            actions: [],
        };
        const newHistory = await createHistory(historyData);

        const foundHistory = await gameHistory(newHistory.game_id);
        expect(foundHistory.id.toString()).toBe(newHistory._id.toString());
    });

    it('should throw NotFoundError if history not found', async () => {
        expect.assertions(1);
        try {
            await gameHistory(new mongoose.Types.ObjectId());
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundError);
        }
    });
});
