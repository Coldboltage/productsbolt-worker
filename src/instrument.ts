// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';
import 'dotenv/config';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
