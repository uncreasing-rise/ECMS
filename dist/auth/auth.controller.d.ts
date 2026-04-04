import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import type { Request } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    private getTracker;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        expiresInSeconds: number;
    }>;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
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
    resendVerification(resendDto: ResendVerificationDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto, req: Request): Promise<{
        access_token: string;
        user: {
            sub: string;
            email: string;
            accountType: string;
            status: string;
            roles: string[];
        };
    }>;
    me(req: Request): Express.User | undefined;
}
