import { Game } from '../repositories/gameRepository.js';
import { User } from '../repositories/userRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';
import MethodNotAllowedError from '../middlewares/Errors/MethodNotAllowedError.js';
import BadRequestError from '../middlewares/Errors/BadRequestError.js';
import ForbiddenError from '../middlewares/Errors/ForbiddenError.js';
import ConflictError from '../middlewares/Errors/ConflictError.js';
import {
    CLASSIC_ACTION_CARDS,
    CLASSIC_SPECIAL_CARDS,
} from '../utils/unoCards.js';
import { getNextPlayer, getScoreTable } from './playersService.js';
import { notifyRoom } from '../sockets/gameSocket.js';
import { setWinnerAndfinishGame } from './gameSessionService.js';
import { addGameHistoryAction } from './historyService.js';

async function _findGameOrThrow(gameId) {
    const game = await Game.findById(gameId);
    if (!game) {
        throw new NotFoundError('Game with specified ID not found.');
    }
    return game;
}

function _gameIsPlayingOrThrow(game) {
    if (game.status !== 'playing')
        throw new MethodNotAllowedError('The Game is not running.');
}

function _userInTheGameOrThrow(game, playerId) {
    const player = game.players.find(
        (player) => player.user_id.toString() === playerId
    );
    if (!player) throw new ForbiddenError('User is not in this game.');
}

function _isThePlayerTurnOrThrow(game, playerId) {
    if (game.current_player_id.toString() !== playerId)
        throw new ForbiddenError("It is not the player's turn.");
}

async function _verifyGameConditions(gameId, playerId) {
    const game = await _findGameOrThrow(gameId);

    _gameIsPlayingOrThrow(game);

    _userInTheGameOrThrow(game, playerId);

    _isThePlayerTurnOrThrow(game, playerId);
}

function drawCard(game, player) {
    const deck = game.deck;
    if (deck.length === 0) {
        return undefined;
    }

    const newCard = deck.shift();
    player.cards.push(newCard);
    player.uno = false;
    return newCard;
}

/* istanbul ignore next */
async function _doCardAction(game, cardAction) {
    switch (cardAction) {
        case 'plus2': {
            const nextPlayer = await getNextPlayer(game);
            for (let i = 0; i < 2; i++) {
                drawCard(game, nextPlayer);
            }
            break;
        }
        case 'plus4': {
            const nextPlayer = await getNextPlayer(game);
            for (let i = 0; i < 4; i++) {
                drawCard(game, nextPlayer);
            }
            break;
        }
        case 'skip': {
            game.current_player_id = (await getNextPlayer(game)).user_id;
            break;
        }
        case 'reverse': {
            if (game.in_default_direction) {
                game.in_default_direction = false;
                break;
            }
            game.in_default_direction = true;
            break;
        }
    }
}

function _didPlayerWin(player) {
    return player.cards.length === 0 || player.score >= 500;
}

function _getPlayedCardPoints(playedCardValue) {
    if (
        playedCardValue === 'plus2' ||
        playedCardValue === 'skip' ||
        playedCardValue === 'reverse'
    ) {
        return 20;
    }
    if (playedCardValue === 'plus4' || playedCardValue === 'wild') {
        return 50;
    }
    return Number(playedCardValue);
}

function _getPlayerCard(playedCard, player) {
    const isSpecialCard = CLASSIC_SPECIAL_CARDS.includes(playedCard.value);

    if (isSpecialCard) {
        return player.cards.find((c) => c.value === playedCard.value);
    }
    return player.cards.find(
        (c) => c.value === playedCard.value && c.color === playedCard.color
    );
}

function _isValidPlay(game, playedCard) {
    const isSpecialCard = CLASSIC_SPECIAL_CARDS.includes(playedCard.value);

    if (isSpecialCard || game.last_card.value === undefined) {
        return true;
    }

    const lastCard = game.last_card;
    return (
        playedCard.value === lastCard.value ||
        playedCard.color === lastCard.color
    );
}

async function playCard(gameId, playedCard, userId) {
    await _verifyGameConditions(gameId, userId);

    const game = await Game.findById(gameId);
    const player = game.players.find(
        (player) => player.user_id.toString() === userId
    );

    const card = _getPlayerCard(playedCard, player);
    if (!card) {
        throw new BadRequestError('Player does not have the card.');
    }

    if (!_isValidPlay(game, playedCard)) {
        throw new ConflictError('This card cannot be played now.');
    }

    game.last_card = playedCard;
    const cardIndex = player.cards.indexOf(card);
    player.cards.splice(cardIndex, 1);

    const points = _getPlayedCardPoints(playedCard.value);
    player.score += points;

    if (_didPlayerWin(player)) {
        setWinnerAndfinishGame(game, player);

        const winnerUsername = (await User.findById(game.winner.toString()))
            .username;
        const scoreTable = await getScoreTable(gameId);

        const message = {
            winner: winnerUsername,
            scores: scoreTable,
        };

        await notifyRoom(gameId, message, userId);

        return message;
    }

    const isActionCard = CLASSIC_ACTION_CARDS.includes(playedCard.value);
    if (isActionCard) {
        await _doCardAction(game, playedCard.value);
    }

    game.current_player_id = (await getNextPlayer(game)).user_id;
    const nextPlayerUsername = (
        await User.findById(game.current_player_id.toString())
    ).username;

    await game.save();

    await notifyRoom(gameId, {
        playedCard: playedCard,
        nextPlayer: nextPlayerUsername,
    });

    const historyAction = {
        user_id: userId,
        action: playedCard,
    };

    await addGameHistoryAction(gameId, historyAction);

    return { nextPlayer: nextPlayerUsername };
}

async function getLastPlayedCard(gameId) {
    const game = await _findGameOrThrow(gameId);

    return game.last_card;
}

async function playerDrawCard(gameId, playerId) {
    await _verifyGameConditions(gameId, playerId);

    const game = await Game.findById(gameId);
    const player = game.players.find(
        (player) => player.user_id.toString() === playerId
    );

    if (game.deck.length === 0) {
        throw new ConflictError('Deck is empty.');
    }

    const card = drawCard(game, player);
    game.current_player_id = (await getNextPlayer(game)).user_id;

    await game.save();

    const playerUsername = (await User.findById(player.user_id)).username;
    const nextPlayerUsername = (
        await User.findById(game.current_player_id.toString())
    ).username;

    await notifyRoom(
        gameId,
        {
            message: `${playerUsername} drew a card.`,
            nextPlayer: nextPlayerUsername,
        },
        playerId
    );

    return {
        newCard: card,
        nextPlayer: nextPlayerUsername,
    };
}

async function isPossibleToPlay(gameId, playerId) {
    await _verifyGameConditions(gameId, playerId);

    const game = await Game.findById(gameId);
    const player = game.players.find(
        (player) => player.user_id.toString() === playerId
    );

    for (const card of player.cards) {
        if (_isValidPlay(game, card)) {
            return true;
        }
    }

    const card = drawCard(game, player);
    game.current_player_id = (await getNextPlayer(game)).user_id;

    await game.save();

    const playerUsername = (await User.findById(player.user_id)).username;
    const nextPlayerUsername = (
        await User.findById(game.current_player_id.toString())
    ).username;

    await notifyRoom(
        gameId,
        {
            message: `${playerUsername} drew a card.`,
            nextPlayer: nextPlayerUsername,
        },
        playerId
    );

    return {
        newCard: card,
        nextPlayer: nextPlayerUsername,
    };
}

async function handCards(gameId, playerId) {
    const game = await _findGameOrThrow(gameId);
    _gameIsPlayingOrThrow(game);
    _userInTheGameOrThrow(game, playerId);
    const player = game.players.find(
        (player) => player.user_id.toString() === playerId
    );
    return {
        player: (await User.findById(playerId)).username,
        cards: player.cards,
    };
}

export {
    drawCard,
    playCard,
    getLastPlayedCard,
    playerDrawCard,
    isPossibleToPlay,
    handCards,
};
