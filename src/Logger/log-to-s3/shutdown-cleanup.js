const { logger } = require("./index");

function setupShutdown() {
    const cleanUp = async () => {
        console.log("Terminating loggers")
        await new Promise((resolve) => logger.end?.(resolve));
        process.exit(0);
    }

    process.on("SIGTERM", cleanUp);
    process.on("SIGINT", cleanUp);
}

module.exports = { setupShutdown };