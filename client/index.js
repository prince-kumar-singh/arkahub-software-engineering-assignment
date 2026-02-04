const axios = require("axios");
const { API_URL, API_TOKEN, BATCH_SIZE, TOTAL_DEVICES, RATE_LIMIT_DELAY } = require("./config");
const { generateSerialNumber, generateSerialNumbers, generateSignature, sleep } = require("./utils");
const RateLimiter = require("./RateLimiter");

// Initialize Rate Limiter
const limiter = new RateLimiter(RATE_LIMIT_DELAY);

/**
 * Performs a single batch request with retries.
 */
async function fetchBatch(snList, retryCount = 0) {
    const timestamp = Date.now().toString();
    const urlObj = new URL(API_URL);
    const signature = generateSignature(urlObj.pathname, API_TOKEN, timestamp);

    try {
        const response = await axios.post(
            API_URL,
            { sn_list: snList },
            {
                headers: {
                    "Content-Type": "application/json",
                    "signature": signature,
                    "timestamp": timestamp,
                },
            }
        );
        return response.data.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn(`[429] Rate limit hit. Retrying batch #${retryCount + 1}...`);
            await sleep(2000 * (retryCount + 1)); // Backoff
            return fetchBatch(snList, retryCount + 1);
        }

        if (retryCount < 3) {
            console.warn(`[Error] Request failed (${error.message}). Retrying...`);
            await sleep(1000);
            return fetchBatch(snList, retryCount + 1);
        }

        console.error(`[Fatal] Failed to fetch batch after retries.`, snList);
        return []; // Return empty or handle as partial failure
    }
}

async function main() {
    console.log("🚀 Starting EnergyGrid Client...");

    // 1. Generate Serial Numbers
    const allDevices = generateSerialNumbers(TOTAL_DEVICES);
    console.log(`📋 Generated ${allDevices.length} serial numbers.`);

    // 2. Batching
    const batches = [];
    for (let i = 0; i < allDevices.length; i += BATCH_SIZE) {
        batches.push(allDevices.slice(i, i + BATCH_SIZE));
    }
    console.log(`📦 Created ${batches.length} batches of ${BATCH_SIZE}.`);

    // 3. Queue Requests
    console.log("⏳ processing batches (approx 50s)...");
    const startTime = Date.now();

    const promises = batches.map((batch, index) => {
        return limiter.add(() => {
            process.stdout.write(`\rProcessing Batch ${index + 1}/${batches.length}`);
            return fetchBatch(batch);
        });
    });

    // 4. Wait for all
    const results = await Promise.all(promises);
    process.stdout.write("\n");

    const duration = (Date.now() - startTime) / 1000;

    // 5. Aggregate
    const flatResults = results.flat();

    console.log(`\n✅ Completed in ${duration.toFixed(2)}s`);
    console.log(`📊 Total Records Fetched: ${flatResults.length}/${TOTAL_DEVICES}`);

    // Optional: Print a few
    if (flatResults.length > 0) {
        console.log("Sample Data:", flatResults.slice(0, 2));
    }
}

main().catch(console.error);
