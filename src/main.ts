import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ Enable CORS for your Next.js browser origin
  app.enableCors({
    origin: ['http://localhost:3000'], // Allow your explicit Next.js frontend port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

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