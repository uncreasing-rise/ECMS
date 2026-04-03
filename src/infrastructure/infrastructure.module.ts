import { Global, Module } from '@nestjs/common';
import { RedisCacheModule } from './cache/redis-cache.module';
import { QueueModule } from './queue/queue.module';
import { MongoModule } from './document/mongo.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';

@Global()
@Module({
  imports: [RedisCacheModule, QueueModule, MongoModule, SearchModule, StorageModule],
  exports: [RedisCacheModule, QueueModule, MongoModule, SearchModule, StorageModule],
})
export class InfrastructureModule {}
