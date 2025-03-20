import * as expressWinston from 'express-winston';
import { format, transports } from 'winston';

const formattedDate = new Date()
    .toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
    .replace(/\//g, '_');

const fileInternalLogger = expressWinston.errorLogger({
    transports: [
        new transports.File({
            filename: `logs/uno_internal_errors_${formattedDate}.log`,
        }),
    ],
    format: format.combine(format.json(), format.prettyPrint()),
});

export { fileInternalLogger };
