import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import UnauthorizedError from './Errors/UnauthorizedError.js';
import ForbiddenError from './Errors/ForbiddenError.js';
import { isTokenEnabled } from '../services/authService.js';

dotenv.config();

const authenticateJWT = async (req, res, next) => {
    try {
        const token =
            req.headers.authorization &&
            req.headers.authorization.split(' ')[1];

        if (!token) {
            throw new UnauthorizedError('User not logged in.');
        }

        const isEnabled = await isTokenEnabled(token);

        if (!isEnabled) {
            throw new ForbiddenError('Token disabled.');
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                throw new ForbiddenError('Invalid user token.');
            }
            req.user = user;
            next();
        });
    } catch (err) {
        next(err);
    }
};

export { authenticateJWT };
