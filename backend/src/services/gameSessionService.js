import { Game } from '../repositories/gameRepository.js';
import NotFoundError from '../middlewares/Errors/NotFoundError.js';
import MethodNotAllowedError from '../middlewares/Errors/MethodNotAllowedError.js';
import ConflictError from '../middlewares/Errors/ConflictError.js';
import {
    CLASSIC_COLORS,
    CLASSIC_SPECIAL_CARDS,
    CLASSIC_VALUES,
} from '../utils/unoCards.js';
import { User } from '../repositories/userRepository.js';
import { notifyRoom } from '../sockets/gameSocket.js';
import { createHistory } from './historyService.js';

async function _findGameOrThrow(id) {
    const game = await Game.findById(id);
    if (!game) {
        throw new NotFoundError('Game with specified ID not found.');
    }
    return game;
}

async function _generateCards() {
    const colors = CLASSIC_COLORS;
    const values = CLASSIC_VALUES;
    const specialCards = CLASSIC_SPECIAL_CARDS;
    const cards = [];

    colors.forEach((color) => {
        cards.push({
            value: '0',
            color: color,
        });
    });
    for (let i = 0; i < 2; i++) {
        colors.forEach((color) => {
            values.forEach((cardValue) => {
                cards.push({
                    value: cardValue,
                    color: color,
                });
            });
        });
    }
    specialCards.forEach((specialCard) => {
        for (let i = 0; i < 4; i++) {
            cards.push({
                value: specialCard,
            });
        }
    });

    return await _shuffle(cards);
}

async function _shuffle(cards) {
    const cardListSize = cards.length;

    // Fisher–Yates shuffle
    for (let i = cardListSize - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
}

async function _distributeCards(game) {
    const players = game.players;
    const deck = game.deck;

    players.forEach((player) => {
        for (let i = 0; i < 7; i++) {
            player.cards.push(deck[0]);
            deck.shift();
        }
    });
}

async function setWinnerAndfinishGame(game, winnerPlayer) {
    game.winner = winnerPlayer.user_id;
    game.status = 'finished';
    game.deck = null;
    await game.save();
}

async function joinGame(gameId, userId) {
    const game = await _findGameOrThrow(gameId);
    if (game.maxPlayers === game.players.length) {
        throw new ConflictError('The Game has reached maximum players');
    }
    if (game.status !== 'waiting') {
        throw new MethodNotAllowedError(
            'Game cannot be joined. It is not in the waiting state.'
        );
    }
    const player = game.players.find((p) => p.user_id.toString() === userId);
    if (player) {
        throw new ConflictError('User is already in this game.');
    }
    game.players.push({ user_id: userId });
    await game.save();

    const playerUsername = (await User.findById(userId)).username;
    await notifyRoom(gameId, { newPlayer: playerUsername }, userId);
}

async function startGame(gameID, userID) {
    const game = await _findGameOrThrow(gameID);

    if (game.status !== 'waiting') {
        throw new MethodNotAllowedError('This game has already started.');
    }

    if (!game.players.every((player) => player.ready)) {
        throw new ConflictError(
            'Cannot start the game. Not all players are ready.'
        );
    }

    const player = game.players.find(
        (player) => player.user_id.toString() === userID
    );
    if (!player || player.give_up) {
        throw new NotFoundError('This player is not playing this match.');
    }

    game.deck = await _generateCards();

    await _distributeCards(game);

    game.status = 'playing';
    game.current_player_id = game.players[0].user_id;

    await game.save();

    await createHistory({ game_id: gameID });

    await notifyRoom(gameID, { gameStatus: game.status }, userID);

    return { game_status: game.status };
}

export { setWinnerAndfinishGame, joinGame, startGame };
