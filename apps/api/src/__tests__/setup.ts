// Set env vars before anything else imports
process.env.DATABASE_URL = 'file:./dev.db';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';
