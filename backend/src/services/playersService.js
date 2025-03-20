import {Game} from '../repositories/gameRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';
import MethodNotAllowedError from '../middlewares/Errors/MethodNotAllowedError.js';
import BadRequestError from '../middlewares/Errors/BadRequestError.js';
import ConflictError from '../middlewares/Errors/ConflictError.js';
import {createGameResponseDto} from '../utils/factories/gameDtoFactory.js';
import {createPlayerResponseDto} from '../utils/factories/playerDtoFactory.js';
import {User} from '../repositories/userRepository.js';
import {drawCard} from './cardsService.js';
import {notifyRoom} from '../sockets/gameSocket.js';
import { setWinnerAndfinishGame } from './gameSessionService.js';

async function _findGameOrThrow(id) {
    const game = await Game.findById(id);
    if (!game) {
        throw new NotFoundError('Game with specified ID not found.');
    }
    return game;
}

async function challengePlayer(gameId, challengedPlayerUsername, playerId) {
    const game = await _findGameOrThrow(gameId);
    if (game.status !== 'playing') {
        throw new MethodNotAllowedError('The Game is not running.');
    }

    const challengedPlayerId = (
        await User.findOne({username: challengedPlayerUsername})
    )._id;
    const challengedPlayer = game.players.find(
        (player) => player.user_id.toString() === challengedPlayerId.toString()
    );

    if (challengedPlayer.cards.length > 1) {
        throw new ConflictError(
            `${challengedPlayerUsername} has more than 1 card.`
        );
    }

    if (challengedPlayer.uno) {
        throw new ConflictError(
            `Challenge failed! ${challengedPlayerUsername} said UNO on time!`
        );
    }

    for (let i = 0; i < 2; i++) {
        await drawCard(game, challengedPlayer);
    }

    await game.save();

    const nextPlayer = (
        await User.findById(game.current_player_id.toString())
    ).usernam
    const message = {
        message: `${challengedPlayerUsername} forgot to say UNO and draws 2 cards.`,
        nextPlayer: nextPlayer
    };

    await notifyRoom(gameId, message, playerId);

    return message;
}

function getNextPlayer(game) {
    const currentPlayer = game.players.find(
        (player) =>
            player.user_id.toString() === game.current_player_id.toString()
    );

    let nextPlayer = currentPlayer
    do {
        const playerIndex = game.players.indexOf(nextPlayer);
        if (game.in_default_direction) {
            if (playerIndex + 1 === game.players.length) {
                nextPlayer = game.players[0];
            }else{
                nextPlayer = game.players[playerIndex + 1];
            }
        } else {
            if (playerIndex - 1 < 0) {
                nextPlayer = game.players[game.players.length - 1];
            }else{
                nextPlayer = game.players[playerIndex - 1];
            }
        }
    } while (nextPlayer.give_up && game.status==="playing");

    return nextPlayer
}

async function getScoreTable(gameId) {
    const game = await _findGameOrThrow(gameId);

    const scores = {};

    for (const player of game.players) {
        const username = (await User.findById(player.user_id.toString()))
            .username;
        scores[username] = player.score;
    }
    return scores;
}

async function getPlayersByGame(id) {
    const game = await _findGameOrThrow(id);
    const players = [].concat(game.players);
    const promises = players.map(async (player) => {
        player.username = (await User.findById(player.user_id)).username;
        return player;
    });

    const formattedPlayers = await Promise.all(promises);
    return formattedPlayers.map((p) => createPlayerResponseDto(p));
}

async function getCurrentPlayerByGame(id) {
    const game = await _findGameOrThrow(id);
    if (game.status !== 'playing') {
        throw new MethodNotAllowedError('The Game is not running.');
    }
    const player = game.players.find(
        (p) => p.user_id.toString() === game.current_player_id.toString()
    );
    if (!player || player.give_up) {
        throw new NotFoundError('Current player not found in the game.');
    }
    return createPlayerResponseDto(player);
}

async function togglePlayerReady(gameId, userId) {
    const game = await _findGameOrThrow(gameId);

    const player = game.players.find(
        (p) => p.user_id.toString() === userId.toString()
    );
    if (!player) {
        throw new NotFoundError('Player not found in the game.');
    }

    player.ready = !player.ready;

    await game.save();

    const username = (await User.findById(userId)).username;
    await notifyRoom(gameId, {player: username, ready: player.ready}, userId);

    return {status: player.ready};
}

async function getPlayerStatusesByGame(id) {
    const game = await _findGameOrThrow(id);

    const promises = game.players.map(async (player) => {
        const username = (await User.findById(player.user_id)).username;
        return {
            username: username,
            ready: player.ready,
            give_up: player.give_up,
        };
    });
    return await Promise.all(promises);
}

async function playerShoutUno(gameId, playerId) {
    const game = await _findGameOrThrow(gameId);
    if (game.status !== 'playing') {
        throw new ConflictError('The game is not running.');
    }

    const player = game.players.find((p) => p.user_id.toString() === playerId);
    if (!player) {
        throw new NotFoundError('User not found in the game.');
    }

    if (player.cards.length > 2) {
        throw new ConflictError('You have more than 2 cards!');
    }

    if (player.uno === true) {
        throw new ConflictError('You already said uno.');
    }

    player.uno = true;
    await game.save();

    const playerUsername = (await User.findById(playerId)).username;
    const nextPlayer = (
        await User.findById(game.current_player_id.toString())
    ).usernam
    const message = {message: `${playerUsername} said UNO!`, nextPlayer};

    await notifyRoom(gameId, message, playerId);

    return message;
}

async function exitGame(gameId, userId) {
    const game = await _findGameOrThrow(gameId);
    if (game.status === 'finished') {
        throw new ConflictError('The game is already finished.');
    }

    const player = game.players.find((p) => p.user_id.toString() === userId);
    if (!player) {
        throw new NotFoundError('User not found in the game.');
    }
    if (player.give_up) {
        throw new BadRequestError('The user already quit the game.');
    }

    if (game.status === 'playing') {
        player.give_up = true;

        const leftPlayers = game.players.filter(p => p.give_up === false)
        if(leftPlayers.length === 1){
            game.winner = leftPlayers[0].user_id
            setWinnerAndfinishGame(game, leftPlayers[0])

            const username = (await User.findById(leftPlayers[0].user_id)).username
            notifyRoom(gameId, {winner: username})
            return {winner: username}
        }

        game.current_player_id = (await getNextPlayer(game)).user_id
    } else {
        const playerIndex = game.players.indexOf(player);
        game.players.splice(playerIndex, 1);
    }

    await game.save();

    const quittingPlayer = (await User.findById(userId)).username;
    let nextPlayer = null;
    if (game.current_player_id)
        nextPlayer = (await User.findById(game.current_player_id.toString())).username
    await notifyRoom(gameId, {quittingPlayer, nextPlayer}, userId);

    return createGameResponseDto(game);
}

export {
    challengePlayer,
    getNextPlayer,
    getScoreTable,
    getPlayersByGame,
    togglePlayerReady,
    getCurrentPlayerByGame,
    getPlayerStatusesByGame,
    playerShoutUno,
    exitGame,
};
