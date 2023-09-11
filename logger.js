// https://reflectoring.io/node-logging-winston/
// https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/
// https://www.npmjs.com/package/winston-mongodb

require('dotenv').config()

const winston = require("winston");


require('winston-mongodb');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.json(),
  
  transports: [
    new winston.transports.Console(),
    new winston.transports.MongoDB({
        db: process.env.DATABASE_URL,
        collection: process.env.LOG_DB_COLLECTION,
        options: {
            useUnifiedTopology: true, // https://dev.to/robiulman/warning-current-server-discovery-and-monitoring-engine-56mm
        }
    })
    ],
});

module.exports = logger;