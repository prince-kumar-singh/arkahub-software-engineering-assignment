const crypto = require("crypto");

/**
 * Generates MD5 signature for the request.
 * expected: MD5( url + token + timestamp )
 */
function generateSignature(url, token, timestamp) {
    return crypto
        .createHash("md5")
        .update(url + token + timestamp)
        .digest("hex");
}

/**
 * Generates a list of dummy serial numbers using SN-000 to SN-499 format.
 */
function generateSerialNumbers(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
        // Pad to 3 digits, e.g., 001, 050, 499
        const padded = String(i).padStart(3, "0");
        list.push(`SN-${padded}`);
    }
    return list;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    generateSignature,
    generateSerialNumbers,
    sleep,
};
