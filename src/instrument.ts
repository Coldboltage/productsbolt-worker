// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';
import 'dotenv/config';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEST_ENV ?? 'development',
  enabled:
    process.env.NEST_ENV === 'production' ||
    process.env.SENTRY_FORCE === 'true',
  tracesSampleRate: process.env.NEST_ENV === 'production' ? 0.1 : 1.0,
  initialScope: {
    tags: {
      service: process.env.NEST_PROJECT,
      application: process.env.NEST_APP,
    },
  },
});
