module.exports = {
    API_URL: "http://localhost:3000/device/real/query",
    API_TOKEN: "interview_token_123",
    BATCH_SIZE: 10,
    TOTAL_DEVICES: 500,
    // 1000ms is the strict limit. We add a buffer to be safe.
    RATE_LIMIT_DELAY: 1100,
};
