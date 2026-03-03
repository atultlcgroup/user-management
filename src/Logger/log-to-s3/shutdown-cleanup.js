const { startS3UploadScheduler } = require("./helper/s3UploadHelper");
const { logger } = require("./index");

function setupShutdown() {
    const cleanUp = async () => {
        console.log("Terminating loggers")
        await new Promise((resolve) => logger.end?.(resolve));
        //upload all files to S3 before shutdown
        await startS3UploadScheduler(false);
        process.exit(0);
    }

    process.on("SIGTERM", cleanUp);
    process.on("SIGINT", cleanUp);
}

module.exports = { setupShutdown };