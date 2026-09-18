// server/config/redis.js
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const isTls = redisUrl.startsWith("rediss://");

const redisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      // Reconnect when a slave becomes master or node failover happens
      return true;
    }
    return false;
  },
};

// Handle TLS certificates for managed services (Upstash / AWS ElastiCache / Redis Cloud)
if (isTls || process.env.REDIS_TLS === "true") {
  redisOptions.tls = {
    rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== "false",
  };
}

const redis = new IORedis(redisUrl, redisOptions);

redis.on("error", (err) => {
  if (process.env.NODE_ENV !== "test") {
    console.error("[Redis] Connection error:", err.message);
  }
});

redis.on("connect", () => {
  console.log(`[Redis] Connected successfully (${isTls ? "TLS enabled" : "Standard"})`);
});

redis.on("reconnecting", (time) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[Redis] Reconnecting in ${time}ms...`);
  }
});

export default redis;

