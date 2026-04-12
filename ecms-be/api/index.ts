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

// Sync imports from main.ts
import { ApiExceptionFilter } from '../src/common/api/api-exception.filter.js';
import { ApiResponseInterceptor } from '../src/common/api/api-response.interceptor.js';
import { AppException } from '../src/common/api/app-exception.js';
import { AppErrorCode } from '../src/common/api/app-error-code.enum.js';

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
      origin: true, // Allow all origins for the Vercel preview/host
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    });

    // Sync Global Pipes/Filters/Interceptors with main.ts
    // This ensures consistent error responses and validation behavior
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) =>
          new AppException({
            code: AppErrorCode.VALIDATION_ERROR,
            errorKey: 'error.validation_failed',
            details: errors.map((error) => ({
              property: error.property,
              constraints: error.constraints,
            })),
          }),
      }),
    );
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new ApiExceptionFilter());

    // Kích hoạt Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ECMS API')
      .setDescription('ECMS Backend API hosted on Vercel')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    // Vercel routes are mapped to root, so Swagger at /docs is fine
    SwaggerModule.setup('docs', app, swaggerDocument);

    await app.init();
  }

  const instance = app.getHttpAdapter().getInstance();
  await instance.ready();
  instance.server.emit('request', req, res);
}
