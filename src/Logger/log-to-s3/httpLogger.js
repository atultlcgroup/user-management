const { logger } = require("./index");
const { sanitizeBody, sanitizeHeaders, sanitizeResponse } = require("./utils/sanitize");

function httpLogger(req, res, next) {
    console.log(`Received request for ${req.method} ${req.originalUrl}`);
    const start = Date.now();
    let responseBody;
    const originalHeaders = req.headers;

    // Capture res.send
    const originalSend = res.send.bind(res);
    res.send = (body) => {
        responseBody = body;
        return originalSend(body);
    };

    // Capture res.json
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        responseBody = body;
        return originalJson(body);
    };

    res.on("finish", () => {
        logger.info({
            apiUrl: req.originalUrl,
            method: req.method,
            headers: sanitizeHeaders(originalHeaders || {}),
            body: sanitizeBody(req.body || {}),
            queries: req.query,
            response: sanitizeResponse(JSON.parse(responseBody || "{}")),
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            dyno: process.env.DYNO || "local"
        });
    });

    next();
}

module.exports = { httpLogger };