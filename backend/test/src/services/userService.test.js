import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from '@jest/globals';
import {
    createUser,
    deleteOwnUser,
    findUser,
    updateUser,
} from '../../../src/services/userService.js';
import { User } from '../../../src/repositories/userRepository.js';
import NotFoundError from '../../../src/middlewares/Errors/NotFoundError.js';
import ConflictError from '../../../src/middlewares/Errors/ConflictError.js';
import ForbiddenError from '../../../src/middlewares/Errors/ForbiddenError.js';
import mongoose, { mongo } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

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

describe('createUser', () => {
    const mockUser = {
        username: 'testuser',
        password: 'password123',
        email: 'testuser@example.com',
    };

    it('Creates new valid user', async () => {
        const newUser = await createUser(mockUser);

        expect(newUser).toHaveProperty('id');
        expect(newUser.email).toBe('testuser@example.com');
        expect(newUser.username).toBe('testuser');
    });

    it('Throws Conflict when username already exists', async () => {
        await createUser(mockUser);

        try {
            await createUser(mockUser);
        } catch (err) {
            expect(err).toBeInstanceOf(ConflictError);
            expect(err.message).toBe('Username already registred.');
        }
    });

    it('Throws Conflict when email already registered', async () => {
        const mockUser2 = {
            username: 'testuser2',
            password: 'password123',
            email: 'testuser@example.com',
        };

        await createUser(mockUser);

        try {
            await createUser(mockUser2);
        } catch (err) {
            expect(err).toBeInstanceOf(ConflictError);
            expect(err.message).toBe('Email already registred.');
        }
    });
});

describe('findUser', () => {
    it('Returns a user by ID', async () => {
        const mockUser = {
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            games: [
                {
                    _id: '60d0fe4f5311236168a109cb',
                },
            ],
        };
        const user = new User(mockUser);
        await user.save();

        const foundUser = await findUser(user._id);

        expect(foundUser).toHaveProperty('id');
        expect(foundUser.username).toBe('testuser');
        expect(foundUser.email).toBe('testuser@example.com');
        expect(foundUser.games[0].game_id.toString()).toBe(
            '60d0fe4f5311236168a109cb'
        );
    });

    it('Throws NotFound for no existent user', async () => {
        try {
            await findUser();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('User with specified ID not found.');
        }
    });
});

describe('updateUser', () => {
    const id = new mongo.ObjectId();
    const userUpdates = {
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: 'password123',
        games: [
            {
                _id: id,
            },
        ],
    };

    it('Updates a existing user', async () => {
        const mockUser = {
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            games: [
                {
                    _id: '60d0fe4f5311236168a109cb',
                },
            ],
        };
        const user = new User(mockUser);
        await user.save();

        const updatedUser = await updateUser(user._id, userUpdates, user._id);

        expect(updatedUser).toHaveProperty('id');
        expect(updatedUser.username).toBe('testuser2');
        expect(updatedUser.email).toBe('testuser2@example.com');
        expect(updatedUser.games[0].game_id.toString()).toBe(id.toString());
    });

    it('Throws Forbidden for unauthorized update', async () => {
        const id2 = new mongo.ObjectId();

        try {
            await updateUser(id, userUpdates, id2);
        } catch (err) {
            expect(err).toBeInstanceOf(ForbiddenError);
            expect(err.message).toBe('Unauthorized update.');
        }
    });

    it('Throws NotFound for no existent user', async () => {
        try {
            await updateUser(id, userUpdates, id);
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('User with specified ID not found.');
        }
    });
});

describe('deleteUser', () => {
    const id1 = new mongo.ObjectId();

    it('Delete an existing user', async () => {
        const mockUser = {
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            games: [
                {
                    _id: '60d0fe4f5311236168a109cb',
                },
            ],
        };
        const user = new User(mockUser);
        await user.save();

        await deleteOwnUser(user._id, user._id);

        const result = await User.findById(user._id);
        expect(result).toBe(null);
    });

    it('Throws Forbidden for unauthorized deletion', async () => {
        const id2 = new mongo.ObjectId();

        try {
            await deleteOwnUser(id1, id2);
        } catch (err) {
            expect(err).toBeInstanceOf(ForbiddenError);
            expect(err.message).toBe('Unauthorized deletion.');
        }
    });

    it('Throws NotFoundError for no existent user', async () => {
        try {
            await deleteOwnUser(id1, id1);
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('User with specified ID not found.');
        }
    });
});
