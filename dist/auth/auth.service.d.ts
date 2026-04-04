import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RabbitMqService } from '../infrastructure/queue/rabbitmq.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly rabbitMqService;
    private readonly cacheManager;
    constructor(prisma: PrismaService, jwtService: JwtService, rabbitMqService: RabbitMqService, cacheManager: Cache);
    private getVerificationKey;
    private generateCode;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        expiresInSeconds: number;
    }>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
        access_token: string;
        user: {
            sub: string;
            email: string;
            accountType: string;
            status: string;
            roles: string[];
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            sub: string;
            email: string;
            accountType: string;
            status: string;
            roles: string[];
        };
    }>;
}
