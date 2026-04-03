"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RabbitMqService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMqService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib_1 = require("amqplib");
let RabbitMqService = RabbitMqService_1 = class RabbitMqService {
    configService;
    logger = new common_1.Logger(RabbitMqService_1.name);
    connection = null;
    channel = null;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const url = this.configService.get('RABBITMQ_URL');
        if (!url) {
            this.logger.warn('RABBITMQ_URL not configured, queue publisher is disabled');
            return;
        }
        this.connection = await (0, amqplib_1.connect)(url);
        this.channel = await this.connection.createChannel();
    }
    async publish(queue, payload) {
        if (!this.channel) {
            this.logger.warn(`RabbitMQ channel unavailable. Skip publish to queue: ${queue}`);
            return false;
        }
        await this.channel.assertQueue(queue, { durable: true });
        const message = {
            pattern: queue,
            data: payload,
        };
        return this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });
    }
    async onModuleDestroy() {
        await this.channel?.close();
        await this.connection?.close();
    }
};
exports.RabbitMqService = RabbitMqService;
exports.RabbitMqService = RabbitMqService = RabbitMqService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMqService);
//# sourceMappingURL=rabbitmq.service.js.map