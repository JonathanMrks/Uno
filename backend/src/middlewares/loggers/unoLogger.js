import { createLogger, format, transports } from 'winston';

const formattedDate = new Date()
    .toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
    .replace(/\//g, '_');

const unoLogger = createLogger({
    transports: [
        new transports.File({
            level: 'info',
            filename: `logs/uno_requests_${formattedDate}.log`,
            format: format.combine(
                format.json(),
                format.prettyPrint()
            ),
        }),
    ],
});

export { unoLogger };
