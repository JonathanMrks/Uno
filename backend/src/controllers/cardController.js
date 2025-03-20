import {
    getLastPlayedCard,
    handCards,
    isPossibleToPlay,
    playCard,
    playerDrawCard,
} from '../services/cardsService.js';

async function postPlayCard(req, res, next) {
    try {
        const response = await playCard(req.params.id, req.body, req.user.id);
        if ('nextPlayer' in response) {
            res.json({
                message: 'Card played successfully.',
                nextPlayer: response.nextPlayer,
            });
        } else {
            res.json(response);
        }
    } catch (err) {
        next(err);
    }
}

async function getLastCard(req, res, next) {
    try {
        const lastCard = await getLastPlayedCard(req.params.id);
        res.json(lastCard);
    } catch (err) {
        next(err);
    }
}

async function getDrawCard(req, res, next) {
    try {
        const topCard = await playerDrawCard(req.params.id, req.user.id);
        res.json(topCard);
    } catch (err) {
        next(err);
    }
}

async function getCheckIfIsPossibleToPlay(req, res, next) {
    try {
        const response = await isPossibleToPlay(req.params.id, req.user.id);
        if (response === true) {
            res.json({ isPossibleToPlay: response });
        } else {
            res.json(response);
        }
    } catch (err) {
        next(err);
    }
}

async function getHandCards(req, res, next) {
    try {
        const response = await handCards(req.params.id, req.user.id);
        res.json(response);
    } catch (err) {
        next(err);
    }
}

export {
    postPlayCard,
    getLastCard,
    getDrawCard,
    getCheckIfIsPossibleToPlay,
    getHandCards,
};
