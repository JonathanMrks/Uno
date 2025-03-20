import { LRUCache } from './memoization/LRUCache.js';

const memoizationMiddleware = (config) => {
    const { max, maxAge } = config;
    const cache = new LRUCache(max, maxAge);

    return (req, res, next) => {
        const cacheKey = `${req.method}:${req.originalUrl}`;

        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) {
            res.send(JSON.parse(cachedResponse));
            return;
        }

        const originalSend = res.send.bind(res);
        res.send = (body) => {
            if (!('error' in JSON.parse(body))) {
                cache.set(cacheKey, body);
            }
            originalSend(body);
        };

        next();
    };
};

export { memoizationMiddleware };
