function sanitizeHeaders(headers = {}) {
    const safeHeaders = { ...headers };

    const sensitiveOrUnnecessaryHeaders = [
        "authorization",
        "cookie",
        "set-cookie",
        "sessionidToken",
        "sessionIdtoken",
        "sessionidtoken",
        "cache-control",
        "user-agent",
        "postman-token",
        "tokenExpiry",
        "programSfid",
        "programsfid",
        "supportPhone",
        "supportEmail",
        "accountname",
        "membersfid",
        "profileCompletion",
        "sub_program_id",
        "token",
        "client_id",
        "client_secret",
        "userid",
        "userId",
        "programSfid",
        "programsfid",
        "tokenExpiry",
        "memberuniqueid",
        "uuid",
        "OTP",
        "biotoken",
        "otpHash",
        "content-type",
        "UUID",
        "awsverificationkey",
    ];

    for (const header of sensitiveOrUnnecessaryHeaders) {
        if (safeHeaders[header]) {
            delete safeHeaders[header];
        }
    }

    return safeHeaders;
}

function sanitizeBody(body) {
    if (!body) return body;

    const copy = { ...body };

    const sensitiveOrUnnecessaryFields = [
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "otp",
        "encryptedEmail",
        "encryptedMobile",
        "googleToken",
        "mobile",
        "email",
        "mobileOtp",
        "emailOtp",
        "redemptionTransactionCode",
        "OTP",
        "MobilePhone",
        "Email",
        "mobilenumber",
        "text",
        "biotoken",
        "otpHash",
        "useremail",
    ];

    for (const field of sensitiveOrUnnecessaryFields) {
        if (copy[field]) {
            delete copy[field];
        }
    }

    return copy;
}

function sanitizeResponse(response) {
    if (!response?.data) return response;
    const copy = JSON.parse(JSON.stringify(response.data));

    const sensitiveOrUnnecessaryFields = [
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "sessionidToken",
        "sessionidtoken",
        "tokenExpiryDate",
        "otp",
        "encryptedEmail",
        "encryptedMobile",
        "tokenExpiryDateTime",
        "OTP"
    ];

    for (const field of sensitiveOrUnnecessaryFields) {
        if (copy[field]) {
            delete copy[field];
        }
    }

    return {
        ...response,
        data: copy
    };
}

module.exports = {
    sanitizeHeaders,
    sanitizeBody,
    sanitizeResponse
};