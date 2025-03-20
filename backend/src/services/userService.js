import { User } from '../repositories/userRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';
import bcrypt from 'bcrypt';
import ForbiddenError from '../middlewares/Errors/ForbiddenError.js';
import ConflictError from '../middlewares/Errors/ConflictError.js';
import BadRequestError from '../middlewares/Errors/BadRequestError.js';
import { createUserResponseDto } from '../utils/factories/userDtoFactory.js';

export async function createUser(user) {
    user.password = await bcrypt.hash(user.password, 10);
    const newUser = new User(user);
    try {
        await newUser.save();
    } catch (err) {
        if (err.errorResponse.keyPattern.username) {
            throw new ConflictError('Username already registred.');
        }
        if (err.errorResponse.keyPattern.email) {
            throw new ConflictError('Email already registred.');
        }
        if (err.errors.username) {
            throw new BadRequestError(
                'The username is longer than 12 characters long.'
            );
        }
    }
    return createUserResponseDto(newUser);
}

export async function findUser(id) {
    const foundUser = await User.findById(id);
    if (foundUser == null) {
        throw new NotFoundError('User with specified ID not found.');
    }
    return createUserResponseDto(foundUser);
}

export async function updateUser(userId, userUpdates, requesterUserId) {
    if (userId !== requesterUserId) {
        throw new ForbiddenError('Unauthorized update.');
    }
    userUpdates.password = await bcrypt.hash(userUpdates.password, 10);
    const updateResult = await User.updateOne({ _id: userId }, userUpdates);
    if (updateResult.matchedCount === 0) {
        throw new NotFoundError('User with specified ID not found.');
    }
    const updatedUser = await User.findById(userId);
    return createUserResponseDto(updatedUser);
}

export async function deleteOwnUser(userId, requesterUserId) {
    if (userId !== requesterUserId) {
        throw new ForbiddenError('Unauthorized deletion.');
    }
    const user = await User.deleteOne({ _id: userId });
    if (user.deletedCount === 0) {
        throw new NotFoundError('User with specified ID not found.');
    }
}
