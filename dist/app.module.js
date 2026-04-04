"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const throttler_storage_redis_1 = require("@nest-lab/throttler-storage-redis");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const branches_module_1 = require("./branches/branches.module");
const courses_module_1 = require("./courses/courses.module");
const classes_module_1 = require("./classes/classes.module");
const enrollments_module_1 = require("./enrollments/enrollments.module");
const finance_module_1 = require("./finance/finance.module");
const roles_module_1 = require("./roles/roles.module");
const sessions_module_1 = require("./sessions/sessions.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const leads_module_1 = require("./leads/leads.module");
const infrastructure_module_1 = require("./infrastructure/infrastructure.module");
const app_throttler_guard_1 = require("./common/guards/app-throttler.guard");
const read_cache_interceptor_1 = require("./common/interceptors/read-cache.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const isLoadTestMode = configService.get('LOAD_TEST_MODE', 'false') === 'true';
                    const redisEnabled = configService.get('REDIS_ENABLED', 'false') === 'true';
                    const redisHost = configService.get('REDIS_HOST', '127.0.0.1');
                    const redisPort = Number(configService.get('REDIS_PORT', '6379'));
                    const redisPassword = configService.get('REDIS_PASSWORD');
                    const ttlMs = Number(configService.get('THROTTLE_TTL_MS', '60000'));
                    const limit = Number(configService.get('THROTTLE_LIMIT', isLoadTestMode ? '50000' : '300'));
                    const throttlerOptions = {
                        throttlers: [
                            {
                                name: 'default',
                                ttl: ttlMs,
                                limit,
                            },
                        ],
                    };
                    if (!redisEnabled) {
                        return throttlerOptions;
                    }
                    return {
                        ...throttlerOptions,
                        storage: new throttler_storage_redis_1.ThrottlerStorageRedisService({
                            host: redisHost,
                            port: redisPort,
                            password: redisPassword,
                            db: Number(configService.get('REDIS_DB', '0')),
                        }),
                    };
                },
            }),
            nestjs_prometheus_1.PrometheusModule.register({
                path: '/metrics',
                defaultMetrics: {
                    enabled: true,
                },
            }),
            prisma_module_1.PrismaModule,
            infrastructure_module_1.InfrastructureModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            sessions_module_1.SessionsModule,
            audit_logs_module_1.AuditLogsModule,
            branches_module_1.BranchesModule,
            courses_module_1.CoursesModule,
            classes_module_1.ClassesModule,
            enrollments_module_1.EnrollmentsModule,
            finance_module_1.FinanceModule,
            leads_module_1.LeadsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: read_cache_interceptor_1.ReadCacheInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: app_throttler_guard_1.AppThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map