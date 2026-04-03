"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheModule = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_manager_redis_store_1 = require("cache-manager-redis-store");
let RedisCacheModule = class RedisCacheModule {
};
exports.RedisCacheModule = RedisCacheModule;
exports.RedisCacheModule = RedisCacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                isGlobal: true,
                useFactory: async (configService) => {
                    const redisEnabled = configService.get('REDIS_ENABLED', 'false') === 'true';
                    if (!redisEnabled) {
                        return {
                            ttl: 300,
                        };
                    }
                    const host = configService.get('REDIS_HOST', '127.0.0.1');
                    const port = configService.get('REDIS_PORT', 6379);
                    const password = configService.get('REDIS_PASSWORD');
                    try {
                        return {
                            store: await (0, cache_manager_redis_store_1.redisStore)({
                                socket: { host, port },
                                password,
                                ttl: 300,
                            }),
                        };
                    }
                    catch {
                        return {
                            ttl: 300,
                        };
                    }
                },
            }),
        ],
        exports: [cache_manager_1.CacheModule],
    })
], RedisCacheModule);
//# sourceMappingURL=redis-cache.module.js.map