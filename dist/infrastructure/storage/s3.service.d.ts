import { ConfigService } from '@nestjs/config';
export declare class S3Service {
    private readonly configService;
    private readonly client;
    private readonly bucket;
    private readonly cloudFrontDomain;
    constructor(configService: ConfigService);
    uploadObject(key: string, body: Buffer, contentType: string): Promise<string>;
}
