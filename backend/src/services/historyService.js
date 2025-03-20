import { History } from '../repositories/historyRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';

async function _findGameHistoryOrThrow(gameID) {
    const history = await History.findOne({ game_id: gameID });
    if (!history) {
        throw new NotFoundError('The game history does not exist!');
    }
    return history;
}

async function createHistory(history) {
    const newHistory = new History(history);
    await newHistory.save();
    return newHistory;
}

async function addGameHistoryAction(gameID, action) {
    const history = await _findGameHistoryOrThrow(gameID);
    history.actions.push(action);
    await history.save();
    return history;
}

async function gameHistory(gameID) {
    return await _findGameHistoryOrThrow(gameID);
}

export { createHistory, addGameHistoryAction, gameHistory };
