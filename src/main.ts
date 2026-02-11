// main.ts
import * as amqp from 'amqplib';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.NODE_ENV === 'production') {
    console.debug = () => {};
    console.log = () => {};
    console.info = () => {};
  }

  await app.init();

  const processQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'headful_queue',
      queueOptions: {
        durable: false,
        exclusive: false,
        autoDelete: false, // <-- add this
      },
      noAck: false, // <-- manual ack mode
      prefetchCount: +process.env.HEADFUL_CONCURRENNCY, // <-- cap concurrency
    },
  });

  const miscQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'headless_queue',
      queueOptions: {
        durable: false,
        exclusive: false,
        autoDelete: false, // <-- add this
      },
      noAck: false, // <-- manual ack mode
      prefetchCount: 20, // <-- cap concurrency
    },
  });

  const sitemapQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'sitemap_queue',
      queueOptions: {
        durable: false,
        exclusive: false,
        autoDelete: false, // <-- add this
      },
      noAck: false, // <-- manual ack mode
      prefetchCount: 300, // <-- cap concurrency
    },
  });

  const slowSitemapQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'slow_sitemap_queue',
      queueOptions: {
        durable: false,
        exclusive: false,
        autoDelete: false, // <-- add this
      },
      noAck: false, // <-- manual ack mode
      prefetchCount: 1, // <-- cap concurrency
    },
  });

  const lmQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'lm_studio_queue',
      queueOptions: {
        durable: false,
        exclusive: false,
        autoDelete: false, // <-- add this
      },
      noAck: false, // <-- manual ack mode
      prefetchCount: 40, // <-- cap concurrency
    },
  });

  await app.startAllMicroservices();
}

bootstrap();
