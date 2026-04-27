// Sets the env vars that `@/lib/env` requires at request time so route imports
// don't crash. Anything secret-looking is fake.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.ADMIN_USERNAME ??= "test-admin";
process.env.ADMIN_PASSWORD ??= "test-admin-pw";
process.env.USER_ACCESS_SECRET ??= "test-access";
process.env.USER_REFRESH_SECRET ??= "test-refresh";
process.env.TWO_FACTOR_BASE_URL ??= "https://example.invalid/";
process.env.TWO_FACTOR_AUTH_KEY ??= "test-2f";
process.env.RAZORPAY_WEBHOOK_SECRET ??= "test-rzp";
process.env.SHIPROCKET_WEBHOOK_TOKEN ??= "test-shiprocket";
process.env.UPSTASH_REDIS_REST_URL ??= "https://example.invalid";
process.env.UPSTASH_REDIS_REST_TOKEN ??= "test-redis";
process.env.NODE_ENV ??= "test";
