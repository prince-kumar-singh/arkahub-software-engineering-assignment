# EnergyGrid Data Aggregator Solution

This repository contains the solution for the EnergyGrid coding assignment.

## Project Structure
- **`client/`**: The Node.js client application that fetches and aggregates data.
- **`mock-api/`**: The provided mock server (moved into its own folder).

## How to Run

### 1. Start the Mock Server
The server must be running for the client to work.
```bash
cd mock-api
npm install
node server.js
```
The server will start on `http://localhost:3000`.

### 2. Run the Client
Open a new terminal window:
```bash
cd client
npm install
node index.js
```

## Implementation Approach

### Rate Limiting & Concurrency
To strictly adhere to the **1 request per second** limit without external libraries:
- I implemented a custom `RateLimiter` class (`client/RateLimiter.js`) using a queue system.
- The limiter ensures a minimum delay of **1100ms** (1.1 seconds) between the start of consecutive requests.
- Requests are processed sequentially to guarantee compliance, as parallel requests would violate the rate limit immediately.
- **Batching**: Devices are grouped into batches of 10 (maximum allowed) to maximize throughput within the rate limit. 500 devices = 50 requests.

### Security
- The `Signature` header is generated using `MD5(URL_Path + Token + Timestamp)`.
- Note: The solution uses the URL *pathname* (e.g., `/device/real/query`) rather than the full URL, consistent with the mock server's validation logic.

### Resilience
- The client handles `429 Too Many Requests` and other network errors by using recursive retries with exponential backoff.

## Assumptions
- The Mock API runs locally on port 3000.
- The provided token `interview_token_123` is static and valid.
- The task completes when all 500 devices are successfully fetched and aggregated.
