import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = process.env.PORT || 3000;

  await app.listen(port);

  Logger.log(
    `🚀 Mailbox Testing Environment active on: http://localhost:${port}/api`,
    'Bootstrap',
  );
}

bootstrap();