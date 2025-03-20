import { gameHistory } from '../services/historyService.js';

async function getHistory(req, res, next) {
    try {
        const history = await gameHistory(req.params.id);
        res.status(200).send(history);
    } catch (err) {
        next(err);
    }
}

export { getHistory };
