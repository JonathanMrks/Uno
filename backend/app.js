import express from 'express';
import routes from './src/routes/routes.js';
import * as dotenv from 'dotenv';
import { dbConnection } from './src/repositories/mongoRepository.js';
import { logMiddleware } from './src/middlewares/logMiddleware.js';
import { errorMiddleware } from './src/middlewares/errorMiddleware.js';
import { fileInternalLogger } from './src/middlewares/loggers/fileInternalLogger.js';

dotenv.config();

class App {
    constructor() {
        this.app = express();
    }

    config() {
        this.app.use(express.json());
        return this;
    }

    middleware() {
        this.app.use(logMiddleware);
        return this;
    }

    routes() {
        this.app.use('/api', routes);
        return this;
    }

    errorMiddleware() {
        this.app.use(fileInternalLogger);
        this.app.use(errorMiddleware);
        return this;
    }

    async database() {
        await dbConnection();
    }
}

export { App };
