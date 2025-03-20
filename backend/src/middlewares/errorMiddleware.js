// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    if (err.status != null)
        return res.status(err.status).json({ error: err.message });

    res.status(500).json({ error: 'Internal server error.' });
};

export { errorMiddleware };
