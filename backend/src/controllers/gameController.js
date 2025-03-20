import {
    createGame,
    deleteGameById,
    getGameById,
} from '../services/gameService.js';
import {
    joinGame,
    startGame,
} from '../services/gameSessionService.js';

async function postGame(req, res, next) {
    try {
        const newGame = await createGame(req.body);
        res.status(201).json(newGame);
    } catch (err) {
        next(err);
    }
}

async function getGame(req, res, next) {
    try {
        const game = await getGameById(req.params.id);
        res.json(game);
    } catch (err) {
        next(err);
    }
}

async function deleteGame(req, res, next) {
    try {
        await deleteGameById(req.params.id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}

async function postJoinGame(req, res, next) {
    try {
        await joinGame(req.params.id, req.user.id);
        res.status(201).json({ message: 'User joined the game successfully!' });
    } catch (err) {
        next(err);
    }
}

async function patchStartGame(req, res, next) {
    try {
        const startedGame = await startGame(req.params.id, req.user.id);
        res.json(startedGame);
    } catch (err) {
        next(err);
    }
}

export {
    postGame,
    getGame,
    deleteGame,
    postJoinGame,
    patchStartGame,
};
