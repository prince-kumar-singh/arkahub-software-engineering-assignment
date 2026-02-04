const { sleep } = require("./utils");

class RateLimiter {
    constructor(delayMs) {
        this.delayMs = delayMs;
        this.queue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
    }

    /**
     * Adds a task to the queue.
     * @param {Function} taskFunction - A function that returns a Promise.
     * @returns {Promise} - Resolves when the task is completed.
     */
    add(taskFunction) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task: taskFunction,
                resolve,
                reject,
            });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const item = this.queue[0]; // Peek

            const now = Date.now();
            const timeSinceLast = now - this.lastRequestTime;

            // Enforce rate limit delay
            if (timeSinceLast < this.delayMs) {
                const waitTime = this.delayMs - timeSinceLast;
                await sleep(waitTime);
            }

            // Dequeue now that we are ready to run
            this.queue.shift();

            try {
                this.lastRequestTime = Date.now();
                const result = await item.task();
                item.resolve(result);
            } catch (error) {
                // If 429, we should probably re-queue or handle it. 
                // For simplicity here, we reject, and let the caller handle retry/re-add logic,
                // OR we could define retry logic here.
                // Given the design, let's let logical retries happen at the caller, 
                // but the rate limiter just enforces time.
                item.reject(error);
            }
        }

        this.isProcessing = false;
    }
}

module.exports = RateLimiter;
