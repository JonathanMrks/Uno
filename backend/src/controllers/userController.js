import {
    createUser,
    deleteOwnUser,
    findUser,
    updateUser,
} from '../services/userService.js';

async function postUser(req, res, next) {
    try {
        const body = req.body;
        const newUser = await createUser(body);

        res.status(201).send(newUser);
    } catch (err) {
        next(err);
    }
}

async function getUserById(req, res, next) {
    try {
        const id = req.params.id;
        const user = await findUser(id);

        res.json(user);
    } catch (err) {
        next(err);
    }
}

async function putUser(req, res, next) {
    try {
        const userId = req.params.id;
        const userUpdates = req.body;
        const requesterUserId = req.user.id;

        const updatedUser = await updateUser(
            userId,
            userUpdates,
            requesterUserId
        );

        res.send(updatedUser);
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        const userId = req.params.id;
        const requesterUserId = req.user.id;

        await deleteOwnUser(userId, requesterUserId);

        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
}

export { postUser, getUserById, putUser, deleteUser };
