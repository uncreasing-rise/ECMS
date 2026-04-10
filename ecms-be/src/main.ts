import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createClient } from 'redis';
import { RedisIoAdapter } from './common/websocket/redis-io.adapter';
import { ApiExceptionFilter } from './common/api/api-exception.filter.js';
import { ApiResponseInterceptor } from './common/api/api-response.interceptor.js';
import { AppException } from './common/api/app-exception.js';
import { AppErrorCode } from './common/api/app-error-code.enum.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSwagger = !isProduction || process.env.ENABLE_SWAGGER === 'true';

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    app.useWebSocketAdapter(new RedisIoAdapter(app, pubClient, subClient));
  }

  const trustProxyRaw = process.env.TRUST_PROXY;
  const trustProxy = trustProxyRaw
    ? Number.isNaN(Number(trustProxyRaw))
      ? trustProxyRaw === 'true'
      : Number(trustProxyRaw)
    : isProduction;
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : !isProduction,
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

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ECMS API')
      .setDescription('ECMS backend API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, swaggerDocument);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
