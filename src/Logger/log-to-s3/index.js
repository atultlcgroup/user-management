const winston = require("winston");
const { logFormat } = require("./log-format");
const { rotateTransport } = require("./utils/logFileManager");

const enabled = process.env.ENABLE_FILE_LOGGING === "true";

const logger = winston.createLogger({
  level: "info",
  silent: !enabled,
  format: logFormat,
  transports: []
});

if (enabled) {
  rotateTransport(logger);
}

module.exports = { logger };