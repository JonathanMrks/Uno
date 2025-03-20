import database_config from '../config/databaseConfig.js';
import mongoose from 'mongoose';

async function dbConnection() {
    await mongoose.connect(database_config);
    mongoose.connection.on('error', (err) =>
        console.error('[ERROR] Connection Error: ' + err)
    );
}

export { dbConnection };
