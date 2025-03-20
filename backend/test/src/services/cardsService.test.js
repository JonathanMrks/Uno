import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from '@jest/globals';
import mongoose, { mongo } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Game } from '../../../src/repositories/gameRepository.js';
import {
    drawCard,
    getLastPlayedCard,
    handCards,
    isPossibleToPlay,
    playCard,
    playerDrawCard,
} from '../../../src/services/cardsService.js';
import NotFoundError from '../../../src/middlewares/Errors/NotFoundError.js';
import MethodNotAllowedError from '../../../src/middlewares/Errors/MethodNotAllowedError.js';
import { User } from '../../../src/repositories/userRepository.js';
import ConflictError from '../../../src/middlewares/Errors/ConflictError.js';
import ForbiddenError from '../../../src/middlewares/Errors/ForbiddenError.js';
import BadRequestError from '../../../src/middlewares/Errors/BadRequestError.js';
import { History } from '../../../src/repositories/historyRepository.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('getLastPlayedCard', () => {
    it('should return the last played card if the game is running', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: { value: 'wild', color: 'black' },
        };
        const game = new Game(gameData);
        await game.save();

        const lastCard = await getLastPlayedCard(game._id);
        expect(lastCard).toEqual({ value: 'wild', color: 'black' });
    });

    it('should return a message if there is no last played card', async () => {
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            last_card: null,
        };
        const game = new Game(gameData);
        await game.save();

        const lastCard = await getLastPlayedCard(game._id);
        expect(lastCard).toBeNull;
    });

    it('should throw NotFoundError if the game does not exist', async () => {
        await expect(
            getLastPlayedCard(new mongoose.Types.ObjectId())
        ).rejects.toThrow(NotFoundError);
    });
});

describe('playerDrawCard', () => {
    it('should return the top card if the deck has one card and the game is running', async () => {
        const playerId = new mongo.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [{ value: '2', color: 'red' }],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const response = await playerDrawCard(game._id, playerId.toString());
        const updatedGame = await Game.findById(game._id);
        const deck = updatedGame.deck;
        const playerCard = updatedGame.players[0].cards[0];
        expect(response.newCard.value).toBe('2');
        expect(response.newCard.color).toBe('red');
        expect(response.nextPlayer).toBe('John_doe');
        expect(deck.length).toBe(0);
        expect(playerCard.value).toBe('2');
        expect(playerCard.color).toBe('red');
    });

    it('should return the top card if the deck has multiple cards and the game is running', async () => {
        const playerId = new mongo.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [
                { value: '2', color: 'red' },
                { value: '5', color: 'yellow' },
            ],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const response = await playerDrawCard(game._id, playerId.toString());
        const updatedGame = await Game.findById(game._id);
        const deck = updatedGame.deck;
        const playerCard = updatedGame.players[0].cards[0];
        expect(response.newCard.value).toBe('2');
        expect(response.newCard.color).toBe('red');
        expect(response.nextPlayer).toBe('John_doe');
        expect(deck.length).toBe(1);
        expect(playerCard.value).toBe('2');
        expect(playerCard.color).toBe('red');
    });

    it('should throw Conflict if the deck is empty', async () => {
        const playerId = new mongo.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();

        await expect(
            playerDrawCard(game._id, playerId.toString())
        ).rejects.toThrow(ConflictError);
    });

    it('should throw MethodNotAllowedError if the game is not running', async () => {
        const playerId = new mongo.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'waiting',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();

        await expect(
            playerDrawCard(game._id, playerId.toString())
        ).rejects.toThrow(MethodNotAllowedError);
    });

    it('should throw NotFoundError if the game does not exist', async () => {
        await expect(
            playerDrawCard(new mongoose.Types.ObjectId())
        ).rejects.toThrow(NotFoundError);
    });
});

describe('handCards', () => {
    it("should show the cards at the player's hand", async () => {
        const playerId = new mongoose.Types.ObjectId();
        const cards = [
            { value: '2', color: 'red' },
            { value: '6', color: 'blue' },
            { value: '0', color: 'yellow' },
        ];
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: cards,
                },
            ],
            deck: [{ value: '9', color: 'blue' }],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const mineCards = await handCards(game._id, playerId.toString());
        expect(mineCards.player).toEqual(userData.username);
        expect(mineCards.cards).toMatchObject(cards);
    });

    it('should throw an error if the player does not exist in the game', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [],
            deck: [{ value: '9', color: 'blue' }],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();

        await expect(handCards(game._id, playerId.toString())).rejects.toThrow(
            ForbiddenError
        );
    });

    it('should throw an error if the game is not running', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'finished',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [{ value: '9', color: 'blue' }],
            current_player_id: playerId.toString(),
        };
        const game = new Game(gameData);
        await game.save();

        await expect(handCards(game._id, playerId.toString())).rejects.toThrow(
            MethodNotAllowedError
        );
    });
});

describe('playCard', () => {
    it('should allow a valid card to be played and update the game state', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: '2', color: 'red' },
                        { value: '5', color: 'blue' },
                    ],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();
        const history = new History({ game_id: game._id });
        await history.save();

        const playedCard = { value: '5', color: 'blue' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response.nextPlayer).toBeTruthy();
        const updatedGame = await Game.findById(game._id);
        const playerCards = updatedGame.players[0].cards;
        expect(playerCards).toHaveLength(1);
        expect(updatedGame.last_card).toMatchObject(playedCard);
    });

    it('should throw BadRequestError if the player does not have the card', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: '2', color: 'red' },
                        { value: '5', color: 'blue' },
                    ],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const playedCard = { value: '6', color: 'green' };

        await expect(
            playCard(game._id, playedCard, playerId.toString())
        ).rejects.toThrow(BadRequestError);
    });

    it('should throw ConflictError if the played card is not valid for the current game state', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: '2', color: 'red' },
                        { value: '5', color: 'blue' },
                    ],
                    score: 0,
                },
            ],
            last_card: { value: '3', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const playedCard = { value: '5', color: 'blue' };

        await expect(
            playCard(game._id, playedCard, playerId.toString())
        ).rejects.toThrow(ConflictError);
    });

    it('should set the winner and finish the game if the player has no more cards', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [{ value: '5', color: 'blue' }],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const playedCard = { value: '5', color: 'blue' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response).toHaveProperty('winner');
        expect(response).toHaveProperty('scores');

        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.status).toBe('finished');
        expect(updatedGame.winner.toString()).toBe(playerId.toString());
    });

    it('should throw NotFoundError if the game does not exist', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const playedCard = { value: '5', color: 'blue' };

        await expect(
            playCard(
                new mongoose.Types.ObjectId(),
                playedCard,
                playerId.toString()
            )
        ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if it is not the player's turn", async () => {
        const playerId = new mongoose.Types.ObjectId();
        const otherPlayerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const otherUserData = {
            _id: otherPlayerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'john@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [{ value: '5', color: 'blue' }],
                    score: 0,
                },
                {
                    user_id: otherPlayerId,
                    cards: [{ value: '2', color: 'red' }],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: otherPlayerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        const otherUser = new User(otherUserData);
        await user.save();
        await otherUser.save();

        const playedCard = { value: '5', color: 'blue' };

        await expect(
            playCard(game._id, playedCard, playerId.toString())
        ).rejects.toThrow(ForbiddenError);
    });

    it('should allow Wild card to change color and update the game state', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: 'wild', color: 'black' },
                        { value: 'wild', color: 'black' },
                    ],
                    score: 0,
                },
            ],
            deck: [{ value: '9', color: 'yellow' }],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();
        const history = new History({ game_id: game._id });
        await history.save();

        const playedCard = { value: 'wild', color: 'black' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response.nextPlayer).toBeTruthy();
        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.last_card).toMatchObject({
            value: 'wild',
            color: 'black',
        });
    });

    it('should handle trying to play a card when deck is empty', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [{ value: '2', color: 'red' }],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            deck: [],
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const playedCard = { value: '2', color: 'red' };
        await expect(
            playCard(game._id, playedCard, playerId.toString())
        ).rejects.toThrow(ConflictError);
    });

    it('should handle scenario where only one player is left', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [{ value: '5', color: 'blue' }],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        await user.save();

        const playedCard = { value: '5', color: 'blue' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response).toHaveProperty('winner');
        expect(response).toHaveProperty('scores');

        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.status).toBe('finished');
        expect(updatedGame.winner.toString()).toBe(playerId.toString());
    });

    it('should make the next player draw two cards and skip their turn when a "plus2" card is played', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const nextPlayerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const nextUserData = {
            _id: nextPlayerId,
            username: 'John_doe',
            password: '456',
            age: 20,
            email: 'john@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: 'plus2', color: 'red' },
                        { value: 'plus2', color: 'yellow' },
                    ],
                    score: 0,
                },
                {
                    user_id: nextPlayerId,
                    cards: [
                        { value: '3', color: 'blue' },
                        { value: '9', color: 'green' },
                    ],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'red' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
            deck: [
                { value: '7', color: 'yellow' },
                { value: '4', color: 'green' },
                { value: '9', color: 'blue' },
            ],
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        const nextUser = new User(nextUserData);
        await user.save();
        await nextUser.save();
        const history = new History({ game_id: game._id });
        await history.save();

        const playedCard = { value: 'plus2', color: 'red' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response.nextPlayer).toBeTruthy();
        const updatedGame = await Game.findById(game._id);
        const nextPlayer = updatedGame.players.find(
            (player) => player.user_id.toString() === nextPlayerId.toString()
        );
        expect(nextPlayer.cards).toHaveLength(4);
        expect(nextPlayer.cards).toMatchObject([
            { value: '3', color: 'blue' },
            { value: '9', color: 'green' },
            { value: '7', color: 'yellow' },
            { value: '4', color: 'green' },
        ]);
        expect(updatedGame.last_card).toMatchObject(playedCard);
    });

    it('should make the next player draw four cards and allow the current player to choose a new color when a "plus4" card is played', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const nextPlayerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const nextUserData = {
            _id: nextPlayerId,
            username: 'John_doe',
            password: '456',
            age: 20,
            email: 'john@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: 'plus4', color: 'black' },
                        { value: '7', color: 'green' },
                    ],
                    score: 0,
                },
                {
                    user_id: nextPlayerId,
                    cards: [
                        { value: '3', color: 'blue' },
                        { value: '4', color: 'red' },
                    ],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'red' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
            deck: [
                { value: '7', color: 'yellow' },
                { value: '4', color: 'green' },
                { value: '9', color: 'blue' },
                { value: '2', color: 'red' },
            ],
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        const nextUser = new User(nextUserData);
        await user.save();
        await nextUser.save();
        const history = new History({ game_id: game._id });
        await history.save();

        const playedCard = { value: 'plus4', color: 'black' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response.nextPlayer).toBeTruthy();
        const updatedGame = await Game.findById(game._id);
        const nextPlayer = updatedGame.players.find(
            (player) => player.user_id.toString() === nextPlayerId.toString()
        );
        expect(nextPlayer.cards).toHaveLength(6);
        expect(updatedGame.last_card).toMatchObject({
            value: 'plus4',
            color: 'black',
        });
    });

    it('should skip the next player\'s turn when a "Skip" card is played', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const nextPlayerId = new mongoose.Types.ObjectId();
        const thirdPlayerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const nextUserData = {
            _id: nextPlayerId,
            username: 'John_doe',
            password: '456',
            age: 20,
            email: 'john@email.com',
        };
        const thirdUserData = {
            _id: thirdPlayerId,
            username: 'Jack_doe',
            password: '789',
            age: 22,
            email: 'jack@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: 'skip', color: 'red' },
                        { value: '0', color: 'blue' },
                    ],
                    score: 0,
                },
                {
                    user_id: nextPlayerId,
                    cards: [{ value: '3', color: 'blue' }],
                    score: 0,
                },
                {
                    user_id: thirdPlayerId,
                    cards: [{ value: '9', color: 'green' }],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'red' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        const nextUser = new User(nextUserData);
        const thirdUser = new User(thirdUserData);
        await user.save();
        await nextUser.save();
        await thirdUser.save();
        const history = new History({ game_id: game._id });
        await history.save();

        const playedCard = { value: 'skip', color: 'red' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response.nextPlayer).toBeTruthy();
        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.current_player_id.toString()).toBe(
            thirdPlayerId.toString()
        );
        expect(updatedGame.last_card).toMatchObject(playedCard);
    });

    it('should reverse the direction of play when a "Reverse" card is played', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const nextPlayerId = new mongoose.Types.ObjectId();
        const thirdPlayerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'Jane_doe',
            password: '123',
            age: 25,
            email: 'jane@email.com',
        };
        const nextUserData = {
            _id: nextPlayerId,
            username: 'John_doe',
            password: '456',
            age: 20,
            email: 'john@email.com',
        };
        const thirdUserData = {
            _id: thirdPlayerId,
            username: 'Jack_doe',
            password: '789',
            age: 22,
            email: 'jack@email.com',
        };
        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [
                        { value: 'reverse', color: 'red' },
                        { value: '5', color: 'blue' },
                    ],
                    score: 0,
                },
                {
                    user_id: nextPlayerId,
                    cards: [{ value: '3', color: 'blue' }],
                    score: 0,
                },
                {
                    user_id: thirdPlayerId,
                    cards: [{ value: '9', color: 'green' }],
                    score: 0,
                },
            ],
            last_card: { value: '5', color: 'red' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        };
        const game = new Game(gameData);
        await game.save();
        const user = new User(userData);
        const nextUser = new User(nextUserData);
        const thirdUser = new User(thirdUserData);
        await user.save();
        await nextUser.save();
        await thirdUser.save();
        const history = new History({ game_id: game._id });
        await history.save();

        const playedCard = { value: 'reverse', color: 'red' };
        const response = await playCard(
            game._id,
            playedCard,
            playerId.toString()
        );

        expect(response.nextPlayer).toBeTruthy();
        const updatedGame = await Game.findById(game._id);
        expect(updatedGame.in_default_direction).toBe(false);
        expect(updatedGame.current_player_id.toString()).toBe(
            thirdPlayerId.toString()
        );
        expect(updatedGame.last_card).toMatchObject(playedCard);
    });
});

describe('isPossibleToPlay', () => {
    let game;
    let playerId;
    let playerCard;
    let gameId;

    beforeEach(async () => {
        playerId = new mongoose.Types.ObjectId();
        playerCard = { value: '5', color: 'blue' };
        game = new Game({
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [playerCard],
                },
            ],
            last_card: { value: '5', color: 'yellow' },
            current_player_id: playerId.toString(),
            in_default_direction: true,
        });
        await game.save();
        gameId = game._id;
    });

    afterEach(async () => {
        await Game.deleteMany({});
    });

    it('should return true if the player has a valid card to play', async () => {
        const result = await isPossibleToPlay(gameId, playerId.toString());
        expect(result).toBe(true);
    });

    it('should return false if the player does not have a valid card to play', async () => {
        game.players[0].cards = [{ value: '6', color: 'green' }];
        await game.save();

        const johnDoe = new User({
            _id: playerId,
            username: 'johndoe',
            email: 'john.doe@example.com',
            password: 'securepassword123',
            age: 30,
            games: [],
        });
        await johnDoe.save();

        const result = await isPossibleToPlay(gameId, playerId.toString());
        expect(result).toEqual({ newCard: undefined, nextPlayer: 'johndoe' });
    });

    it('should throw NotFoundError if the game does not exist', async () => {
        await Game.deleteMany({});
        await expect(
            isPossibleToPlay(gameId, playerId.toString())
        ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if the player is not in the game', async () => {
        const otherPlayerId = new mongoose.Types.ObjectId();
        await expect(
            isPossibleToPlay(gameId, otherPlayerId.toString())
        ).rejects.toThrow(ForbiddenError);
    });

    it('should throw MethodNotAllowedError if the game is not in playing state', async () => {
        game.status = 'waiting';
        await game.save();

        await expect(
            isPossibleToPlay(gameId, playerId.toString())
        ).rejects.toThrow(MethodNotAllowedError);
    });
});

describe('drawCard', () => {
    it('should draw the top card from the deck and update the player’s hand', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };

        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [
                { value: '2', color: 'red' },
                { value: '5', color: 'blue' },
            ],
            current_player_id: playerId.toString(),
        };

        const game = new Game(gameData);
        await game.save();

        const user = new User(userData);
        await user.save();

        const player = game.players.find(
            (p) => p.user_id.toString() === playerId.toString()
        );

        const newCard = drawCard(game, player);

        expect(newCard).toMatchObject({ value: '2', color: 'red' });
        expect(player.cards).toMatchObject([{ value: '2', color: 'red' }]);
    });

    it('should handle drawing from a deck with only one card', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };

        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [{ value: 'wild', color: 'black' }],
            current_player_id: playerId.toString(),
        };

        const game = new Game(gameData);
        await game.save();

        const user = new User(userData);
        await user.save();

        const player = game.players.find(
            (p) => p.user_id.toString() === playerId.toString()
        );

        const newCard = drawCard(game, player);

        expect(newCard).toMatchObject({ value: 'wild', color: 'black' });
        expect(player.cards).toMatchObject([{ value: 'wild', color: 'black' }]);
    });

    it('should return null if the deck is empty', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };

        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [],
            current_player_id: playerId.toString(),
        };

        const game = new Game(gameData);
        await game.save();

        const user = new User(userData);
        await user.save();

        const player = game.players.find(
            (p) => p.user_id.toString() === playerId.toString()
        );

        const newCard = drawCard(game, player);

        expect(newCard).toBeUndefined();
        expect(player.cards).toEqual([]);
    });

    it('should not mutate the original deck array', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };

        const initialDeck = [
            { value: '2', color: 'green' },
            { value: '4', color: 'blue' },
            { value: 'draw_two', color: 'red' },
        ];

        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [...initialDeck],
            current_player_id: playerId.toString(),
        };

        const game = new Game(gameData);
        await game.save();

        const user = new User(userData);
        await user.save();

        const player = game.players.find(
            (p) => p.user_id.toString() === playerId.toString()
        );

        const originalDeck = [...game.deck];

        drawCard(game, player);

        expect(game.deck).toEqual(originalDeck.slice(1));
    });

    it('should return the correct card and deck when multiple cards are drawn sequentially', async () => {
        const playerId = new mongoose.Types.ObjectId();
        const userData = {
            _id: playerId,
            username: 'John_doe',
            password: '123',
            age: 20,
            email: 'teste@email.com',
        };

        const initialDeck = [
            { value: '7', color: 'red' },
            { value: '8', color: 'blue' },
            { value: 'skip', color: 'green' },
        ];

        const gameData = {
            title: 'UNO',
            rules: 'Standard Rules',
            status: 'playing',
            players: [
                {
                    user_id: playerId,
                    cards: [],
                },
            ],
            deck: [...initialDeck],
            current_player_id: playerId.toString(),
        };

        const game = new Game(gameData);
        await game.save();

        const user = new User(userData);
        await user.save();

        const player = game.players.find(
            (p) => p.user_id.toString() === playerId.toString()
        );

        let newCard = drawCard(game, player);
        expect(newCard).toMatchObject({ value: '7', color: 'red' });

        newCard = drawCard(game, player);
        expect(newCard).toMatchObject({ value: '8', color: 'blue' });

        newCard = drawCard(game, player);
        expect(newCard).toMatchObject({ value: 'skip', color: 'green' });
    });
});
