import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

import { User } from '../repositories/userRepository.js';
import UnauthorizedError from '../middlewares/Errors/UnauthorizedError.js';
import { Token } from '../repositories/tokenRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';

dotenv.config();

const userLogin = async (username, password) => {
    const user = await User.findOne({ username });
    if (user == null) {
        throw new UnauthorizedError('Invalid username or password.');
    }

    if (!(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedError('Invalid username or password.');
    }

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );

    const newToken = new Token({ token: token, enabled: true });
    await newToken.save();

    return token;
};

const isTokenEnabled = async (token) => {
    const foundToken = await Token.findOne({ token });
    if (foundToken == null) {
        throw new NotFoundError('Invalid token.');
    }
    return foundToken.enabled;
};

const userLogout = async (token) => {
    const foundToken = await Token.findOne({ token });
    if (foundToken == null) {
        throw new NotFoundError('Invalid token.');
    }
    foundToken.enabled = false;
    await foundToken.save();
    return foundToken;
};

export { userLogin, userLogout, isTokenEnabled };
