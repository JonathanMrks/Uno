import * as dotenv from 'dotenv';

dotenv.config();

const configs = {
    username: process.env.MONGO_INITDB_ROOT_USERNAME,
    password: process.env.MONGO_INITDB_ROOT_PASSWORD,
    database: process.env.MONGO_INITDB_DATABASE,
    mongodb: process.env.MONGO_SERVER_URL,
    host: process.env.MONGO_INITDB_HOST,
    port: '27017',
};

const mongodb = `mongodb://${configs.username}:${configs.password}@${configs.host}:${configs.port}/${configs.database}?authSource=admin`;
export default configs.username ? mongodb : configs.mongodb;
