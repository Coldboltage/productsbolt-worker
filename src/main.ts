// main.ts
import * as amqp from 'amqplib';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();


  const processQueue = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'headful_queue',
        queueOptions: {
          durable: false,
          exclusive: false,
          autoDelete: false,  // <-- add this
        },
        noAck: false,        // <-- manual ack mode
        prefetchCount: 20,   // <-- cap concurrency
      },
    },
  );

  const miscQueue = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'headless_queue',
        queueOptions: {
          durable: false,
          exclusive: false,
          autoDelete: false,  // <-- add this
        },
        noAck: false,        // <-- manual ack mode
        prefetchCount: 300,   // <-- cap concurrency
      },
    },
  );


  await app.startAllMicroservices();;
}

bootstrap();