import { userLogin, userLogout } from '../services/authService.js';

async function postLogin(req, res, next) {
    try {
        const { username, password } = req.body;
        const token = await userLogin(username, password);
        res.json({ token });
    } catch (err) {
        next(err);
    }
}

async function getInfo(req, res, next) {
    try {
        res.json({
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
        });
    } catch (err) {
        next(err);
    }
}

async function deleteLogout(req, res, next) {
    try {
        const token =
            req.headers.authorization &&
            req.headers.authorization.split(' ')[1];
        await userLogout(token);
        res.json({ message: 'User logged out successfully' });
    } catch (err) {
        next(err);
    }
}

export { postLogin, getInfo, deleteLogout };
