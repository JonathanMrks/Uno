import {
    challengePlayer,
    exitGame,
    getCurrentPlayerByGame,
    getPlayersByGame,
    getPlayerStatusesByGame,
    getScoreTable,
    playerShoutUno,
    togglePlayerReady,
} from '../services/playersService.js';

async function postChallengePlayer(req, res, next) {
    try {
        const { challengedPlayer } = req.body;
        const response = await challengePlayer(
            req.params.id,
            challengedPlayer,
            req.user.id
        );
        res.json(response);
    } catch (err) {
        next(err);
    }
}

async function getPlayers(req, res, next) {
    try {
        const players = await getPlayersByGame(req.params.id);

        res.json(players);
    } catch (err) {
        next(err);
    }
}

async function getNextPlayer(req, res, next) {
    try {
        const currentPlayer = await getCurrentPlayerByGame(req.params.id);
        res.json(currentPlayer);
    } catch (err) {
        next(err);
    }
}

async function getPlayersStatuses(req, res, next) {
    try {
        const playerStatuses = await getPlayerStatusesByGame(req.params.id);
        res.json(playerStatuses);
    } catch (err) {
        next(err);
    }
}

async function getPlayersScores(req, res, next) {
    try {
        const scores = await getScoreTable(req.params.id);
        res.json(scores);
    } catch (err) {
        next(err);
    }
}

async function patchToggleReady(req, res, next) {
    try {
        const status = await togglePlayerReady(req.params.id, req.user.id);
        res.json(status);
    } catch (err) {
        next(err);
    }
}

async function patchShoutUno(req, res, next) {
    try {
        const response = await playerShoutUno(req.params.id, req.user.id);
        res.json(response);
    } catch (err) {
        next(err);
    }
}

async function patchExitGame(req, res, next) {
    try {
        const updatedGame = await exitGame(req.params.id, req.user.id);
        res.json(updatedGame);
    } catch (err) {
        next(err);
    }
}

export {
    postChallengePlayer,
    getPlayers,
    getNextPlayer,
    getPlayersStatuses,
    getPlayersScores,
    patchToggleReady,
    patchShoutUno,
    patchExitGame,
};
