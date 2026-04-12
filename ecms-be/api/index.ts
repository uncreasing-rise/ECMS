import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import { AppModule } from '../src/app.module';

let app: NestFastifyApplication;

export default async function (req: any, res: any) {
  if (!app) {
    const adapter = new FastifyAdapter();
    app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

    await app.register(fastifyCompress as any);
    await app.register(fastifyHelmet as any, {
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    });

    app.enableCors({
      origin: true, // Cho phép mọi origin để test UI
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // Kích hoạt Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ECMS API (Vercel Preview)')
      .setDescription('Tài liệu API tạm thời được Host trên Vercel')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument);

    await app.init();
  }

  const instance = app.getHttpAdapter().getInstance();
  await instance.ready();
  instance.server.emit('request', req, res);
}
