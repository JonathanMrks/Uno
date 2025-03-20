import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, {mongo, Types} from 'mongoose';
import { Game } from '../../../src/repositories/gameRepository.js';
import {
    exitGame,
    getCurrentPlayerByGame,
    getPlayersByGame,
    getPlayerStatusesByGame,
} from '../../../src/services/playersService.js';
import MethodNotAllowedError from '../../../src/middlewares/Errors/MethodNotAllowedError.js';
import NotFoundError from '../../../src/middlewares/Errors/NotFoundError.js';
import ConflictError from '../../../src/middlewares/Errors/ConflictError.js';
import BadRequestError from '../../../src/middlewares/Errors/BadRequestError.js';
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

describe('getPlayers', () => {
    it('Returns existent game', async () => {
        const user_id = new mongo.ObjectId();
        const user = new User({
            _id: user_id,
            username: 'Pedro',
            password: 'a',
            email: 'b',
        });
        await user.save();
        const player = {
            user_id,
            score: 100,
            give_up: false,
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            players: [player, player, player],
        };
        const game = new Game(gameData);
        await game.save();

        const response = await getPlayersByGame(game._id);
        expect(response[0]).toMatchObject(player);
    });

    it('Throws NotFound for no existent game', async () => {
        try {
            await getPlayerStatusesByGame();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Game with specified ID not found.');
        }
    });
});

describe('getCurrentPlayer', () => {
    it('Returns the curent player', async () => {
        const id = new mongo.ObjectId();
        const player = {
            user_id: id,
            score: 100,
            give_up: false,
            ready: true,
            cards: [
                {
                    value: '+4',
                    color: 'blue',
                },
            ],
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
            players: [player],
            current_player_id: id,
        };
        const game = new Game(gameData);
        await game.save();

        const nextPlayer = await getCurrentPlayerByGame(game._id);
        expect(nextPlayer.user_id).toStrictEqual(id);
    });

    it('Throws MethodNotAllowed for waiting games', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
            players: [],
        };
        const game = new Game(gameData);
        await game.save();

        try {
            await getCurrentPlayerByGame(game._id);
        } catch (err) {
            expect(err).toBeInstanceOf(MethodNotAllowedError);
            expect(err.message).toBe('The Game is not running.');
        }
    });

    it('Throws NotFound for no existent player', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
            players: [],
        };
        const game = new Game(gameData);
        await game.save();

        try {
            await getCurrentPlayerByGame(game._id);
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Current player not found in the game.');
        }
    });

    it('Throws NotFound for no existent game', async () => {
        try {
            await getCurrentPlayerByGame();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Game with specified ID not found.');
        }
    });
});

describe('getPlayerStatus', () => {
    it('Returns player status', async () => {
        const id = new mongo.ObjectId();
        const userData = {
            _id: id,
            username: 'John_doe',
            email: 'john_doe@email.com',
            password: '123',
        };
        const player = {
            user_id: id,
            score: 100,
            give_up: false,
            ready: true,
            cards: [
                {
                    value: '+4',
                    color: 'blue',
                },
            ],
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
            players: [player],
            current_player_id: id,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const result = await getPlayerStatusesByGame(game._id);
        const expectedResult = {
            username: 'John_doe',
            ready: true,
            give_up: false,
        };
        expect(result[0]).toStrictEqual(expectedResult);
    });

    it('Throws MethodNotAllowed for waiting game', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            last_card: { value: 'wild', color: 'black' },
        };
        const game = new Game(gameData);
        await game.save();

        try {
            await getPlayerStatusesByGame(game._id);
        } catch (err) {
            expect(err).toBeInstanceOf(MethodNotAllowedError);
            expect(err.message).toBe('The Game is not running.');
        }
    });

    it('Throws NotFound for no existent game', async () => {
        try {
            await getPlayerStatusesByGame();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Game with specified ID not found.');
        }
    });
});

describe('exitGame', () => {
        it('Throws Conflict when game is already finished', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'finished',
            last_card: { value: 'wild', color: 'black' },
        };
        const game = new Game(gameData);
        await game.save();

        try {
            await exitGame(game._id);
        } catch (err) {
            expect(err).toBeInstanceOf(ConflictError);
            expect(err.message).toBe('The game is already finished.');
        }
    });

    it('Throws NotFound if the user is not in the game', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
        };
        const game = new Game(gameData);
        await game.save();

        try {
            await exitGame(game._id);
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('User not found in the game.');
        }
    });

    it('Throws BadRequest if the user already quit the game', async () => {
        const id = new mongo.ObjectId();
        const player = {
            user_id: id.toString(),
            score: 100,
            give_up: true,
            ready: true,
            cards: [
                {
                    value: '+4',
                    color: 'blue',
                },
            ],
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
            players: [player],
        };
        const game = new Game(gameData);
        await game.save();

        try {
            await exitGame(game._id, id.toString());
        } catch (err) {
            expect(err).toBeInstanceOf(BadRequestError);
            expect(err.message).toBe('The user already quit the game.');
        }
    });

    it('Throws NotFound for no existent game', async () => {
        try {
            await exitGame();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Game with specified ID not found.');
        }
    });
});
