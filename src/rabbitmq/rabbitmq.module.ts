import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LM_STUDIO_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${process.env.RABBITMQ_IP}:5672`],
          queue: 'lm_studio_queue',
          queueOptions: { durable: false },
          prefetchCount: 1,
        },
      },
    ]),
  ],
  exports: [ClientsModule], // <- THIS IS NEEDED!
})
export class RabbitmqModule {}
