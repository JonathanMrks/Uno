import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../../../src/repositories/userRepository.js';
import {
    isTokenEnabled,
    userLogin,
    userLogout,
} from '../../../src/services/authService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Token } from '../../../src/repositories/tokenRepository.js';
import UnauthorizedError from '../../../src/middlewares/Errors/UnauthorizedError.js';
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

describe('userLogin', () => {
    it('User signin with valid credentials', async () => {
        const password = await bcrypt.hash('password123', 10);
        const mockUser = {
            username: 'testuser',
            password: password,
            age: 30,
            email: 'testuser@example.com',
        };
        const user = new User(mockUser);
        await user.save();

        const newToken = await userLogin('testuser', 'password123');
        const expectedToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        const savedToken = await Token.findOne({ token: expectedToken });

        expect(newToken).toBe(expectedToken);
        expect(savedToken).not.toBe(null);
    });

    it('Throws Unautorized for no existent username', async () => {
        try {
            await userLogin('testuser', 'password123');
        } catch (err) {
            expect(err).toBeInstanceOf(UnauthorizedError);
            expect(err.message).toBe('Invalid username or password.');
        }
    });

    it('Throws Unautorized for wrong password', async () => {
        const mockUser = {
            username: 'testuser',
            password: 'password',
            age: 30,
            email: 'testuser@example.com',
        };
        const user = new User(mockUser);
        await user.save();

        try {
            await userLogin('testuser', 'password123');
        } catch (err) {
            expect(err).toBeInstanceOf(UnauthorizedError);
            expect(err.message).toBe('Invalid username or password.');
        }
    });
});

describe('isTokenEnabled', () => {
    it('Returns the status of an existent token', async () => {
        const token = jwt.sign(
            {
                id: '123',
                username: 'username',
                email: 'email',
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        const savedToken = new Token({ token: token, enabled: true });
        await savedToken.save();

        const result = await isTokenEnabled(token);
        expect(result).toBe(true);
    });

    it('Throws NotFound for no existent token', async () => {
        try {
            await isTokenEnabled();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Invalid token.');
        }
    });
});

describe('userLogout', () => {
    it('User logout for valid token', async () => {
        const token = jwt.sign(
            {
                id: '123',
                username: 'username',
                email: 'email',
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        const savedToken = new Token({ token: token, enabled: true });
        await savedToken.save();

        await userLogout(token);

        const foundToken = await Token.findOne({ token });
        expect(foundToken.enabled).toBe(false);
    });

    it('Throws error for no existent token', async () => {
        try {
            await userLogout();
        } catch (err) {
            expect(err).toBeInstanceOf(NotFoundError);
            expect(err.message).toBe('Invalid token.');
        }
    });
});
