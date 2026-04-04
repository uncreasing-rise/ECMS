"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const request_logging_interceptor_1 = require("./common/interceptors/request-logging.interceptor");
const compression_1 = __importDefault(require("compression"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.use((0, compression_1.default)({ threshold: 1024 }));
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    if (process.env.LOAD_TEST_MODE !== 'true') {
        app.useGlobalInterceptors(new request_logging_interceptor_1.RequestLoggingInterceptor());
    }
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('ECMS API Gateway')
        .setDescription('ECMS services with JWT auth, rate limiting, routing, and observability')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, swaggerDocument);
    await app.listen(process.env.PORT ?? 3000);
}
if (require.main === module) {
    bootstrap();
}
//# sourceMappingURL=main.js.map