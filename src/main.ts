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
        queue: 'process_queue',
        queueOptions: {
          durable: false,
          exclusive: false,
          autoDelete: false,  // <-- add this
        },
        noAck: false,        // <-- manual ack mode
        prefetchCount: 10,   // <-- cap concurrency
      },
    },
  );

  const miscQueue = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'misc_queue',
        queueOptions: {
          durable: false,
          exclusive: false,
          autoDelete: false,  // <-- add this
        },
        noAck: false,        // <-- manual ack mode
        prefetchCount: 1,   // <-- cap concurrency
      },
    },
  );


  await app.startAllMicroservices();;
}

bootstrap();