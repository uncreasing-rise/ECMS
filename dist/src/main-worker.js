"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const worker_module_1 = require("./worker/worker.module");
async function bootstrapWorker() {
    const logger = new common_1.Logger('WorkerBootstrap');
    const rabbitMqUrl = process.env.RABBITMQ_URL;
    if (!rabbitMqUrl) {
        logger.error('RABBITMQ_URL is required for worker mode');
        process.exit(1);
    }
    const queue = process.env.WORKER_QUEUE || 'email.verification';
    const app = await core_1.NestFactory.createMicroservice(worker_module_1.WorkerModule, {
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [rabbitMqUrl],
            queue,
            queueOptions: {
                durable: true,
            },
        },
    });
    await app.listen();
    logger.log(`Worker started. queue=${queue}`);
}
bootstrapWorker();
//# sourceMappingURL=main-worker.js.map