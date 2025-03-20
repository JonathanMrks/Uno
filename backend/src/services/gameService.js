import { Game } from '../repositories/gameRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';
import { createGameResponseDto } from '../utils/factories/gameDtoFactory.js';

export async function createGame(game) {
    const newGame = new Game(game);
    await newGame.save();
    return createGameResponseDto(newGame);
}

export async function getGameById(id) {
    const game = await Game.findById(id);
    if (!game) {
        throw new NotFoundError('Game with specified ID not found.');
    }
    return createGameResponseDto(game);
}

export async function deleteGameById(id) {
    const result = await Game.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
        throw new NotFoundError('Game with specified ID not found.');
    }
}
