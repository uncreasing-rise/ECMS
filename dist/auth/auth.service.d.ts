import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly cacheManager;
    private readonly loginProfileLoaders;
    constructor(prisma: PrismaService, jwtService: JwtService, cacheManager: Cache);
    private getVerificationKey;
    private getLoginProfileKey;
    private getLoginFastFailKey;
    private getLoginProfileTtlMs;
    private getLoginFastFailTtlMs;
    private getPasswordHashRounds;
    private loadLoginProfile;
    private getLoginProfile;
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
    login(loginDto: LoginDto, tracker?: string): Promise<{
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
