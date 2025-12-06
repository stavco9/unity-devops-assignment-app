import winston from 'winston';

// Winston logger configuration
const logger = winston.createLogger({
  level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'management-api' },
  transports: [
    new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
    })
  ]
});

export default logger;