import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from '@jest/globals';
import mongoose, { mongo } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Game } from '../../../src/repositories/gameRepository.js';
import {
    joinGame,
    startGame,
} from '../../../src/services/gameSessionService.js';
import NotFoundError from '../../../src/middlewares/Errors/NotFoundError.js';
import MethodNotAllowedError from '../../../src/middlewares/Errors/MethodNotAllowedError.js';
import ConflictError from '../../../src/middlewares/Errors/ConflictError.js';
import { User } from '../../../src/repositories/userRepository.js';

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

describe('joinGame', () => {
    it('should join a game if it is in waiting state and not full', async () => {
        const playerId = new mongo.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            maxPlayers: 2,
            players: [],
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        await joinGame(game._id, playerId);

        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.players.length).toBe(1);
        expect(updatedGame.players[0].user_id.toString()).toBe(
            playerId.toString()
        );
    });

    it('should throw ConflictError if the game is full', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            maxPlayers: 1,
            last_card: { value: 'wild', color: 'black' },
            players: [{ user_id: new mongoose.Types.ObjectId() }],
        };
        const game = new Game(gameData);
        await game.save();

        const userId = new mongoose.Types.ObjectId();
        await expect(joinGame(game._id, userId)).rejects.toThrow(ConflictError);
    });

    it('should throw MethodNotAllowedError if the game is not in waiting state', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
            maxPlayers: 2,
            players: [],
        };
        const game = new Game(gameData);
        await game.save();

        const userId = new mongoose.Types.ObjectId();
        await expect(joinGame(game._id, userId)).rejects.toThrow(
            MethodNotAllowedError
        );
    });

    it('should throw ConflictError if the user is already in the game', async () => {
        const userId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            maxPlayers: 2,
            players: [{ user_id: userId }],
        };
        const game = new Game(gameData);
        await game.save();

        await expect(joinGame(game._id, userId.toString())).rejects.toThrow(
            ConflictError
        );
    });
});

describe('startGame', () => {
    it('should start the game if it is in waiting state and all players are ready', async () => {
        const userId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            players: [{ user_id: userId, ready: true, give_up: false }],
        };
        const game = new Game(gameData);
        await game.save();

        await startGame(game._id, userId.toString());

        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.status).toBe('playing');
        expect(updatedGame.deck).not.toBe(null);
        expect(updatedGame.players[0].cards).toHaveLength(7);
    });

    it('should throw MethodNotAllowedError if the game is not in waiting state', async () => {
        const userId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [{ user_id: userId, ready: true }],
        };
        const game = new Game(gameData);
        await game.save();

        await expect(startGame(game._id, userId)).rejects.toThrow(
            MethodNotAllowedError
        );
    });

    it('should throw ConflictError if not all players are ready', async () => {
        const userId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            players: [{ user_id: userId, ready: false }],
        };
        const game = new Game(gameData);
        await game.save();

        await expect(startGame(game._id, userId)).rejects.toThrow(
            ConflictError
        );
    });

    it('should throw NotFoundError if the player is not in the game', async () => {
        const userId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            players: [{ user_id: new mongoose.Types.ObjectId(), ready: true }],
        };
        const game = new Game(gameData);
        await game.save();

        await expect(startGame(game._id, userId)).rejects.toThrow(
            NotFoundError
        );
    });
});

