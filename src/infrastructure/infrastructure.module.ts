import { Global, Module } from '@nestjs/common';
import { RedisCacheModule } from './cache/redis-cache.module';
import { MongoModule } from './document/mongo.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';

@Global()
@Module({
  imports: [RedisCacheModule, MongoModule, SearchModule, StorageModule],
  exports: [RedisCacheModule, MongoModule, SearchModule, StorageModule],
})
export class InfrastructureModule {}
