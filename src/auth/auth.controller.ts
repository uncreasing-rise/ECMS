import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';

const isLoadTestMode = process.env.LOAD_TEST_MODE === 'true';
const authThrottleTtlMs = Number(process.env.THROTTLE_AUTH_TTL_MS ?? '60000');
const registerLimit = Number(
	process.env.THROTTLE_AUTH_REGISTER_LIMIT ?? (isLoadTestMode ? '20000' : '10'),
);
const verifyEmailLimit = Number(
	process.env.THROTTLE_AUTH_VERIFY_LIMIT ?? (isLoadTestMode ? '20000' : '20'),
);
const resendLimit = Number(
	process.env.THROTTLE_AUTH_RESEND_LIMIT ?? (isLoadTestMode ? '20000' : '10'),
);
const loginLimit = Number(
	process.env.THROTTLE_AUTH_LOGIN_LIMIT ?? (isLoadTestMode ? '20000' : '20'),
);

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	private getTracker(req: Request): string {
		const forwardedFor = req.headers['x-forwarded-for'];
		const firstForwardedIp =
			typeof forwardedFor === 'string'
				? forwardedFor.split(',')[0]?.trim()
				: Array.isArray(forwardedFor)
					? forwardedFor[0]
					: undefined;

		return firstForwardedIp || req.ip || req.socket.remoteAddress || 'unknown';
	}

	@Post('register')
	@Throttle({ default: { limit: registerLimit, ttl: authThrottleTtlMs } })
	register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post('verify-email')
	@Throttle({ default: { limit: verifyEmailLimit, ttl: authThrottleTtlMs } })
	verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
		return this.authService.verifyEmail(verifyEmailDto);
	}

	@Post('resend-verification')
	@Throttle({ default: { limit: resendLimit, ttl: authThrottleTtlMs } })
	resendVerification(@Body() resendDto: ResendVerificationDto) {
		return this.authService.resendVerification(resendDto.email);
	}

	@Post('login')
	@Throttle({ default: { limit: loginLimit, ttl: authThrottleTtlMs } })
	login(@Body() loginDto: LoginDto, @Req() req: Request) {
		return this.authService.login(loginDto, this.getTracker(req));
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	me(@Req() req: Request) {
		return req.user;
	}
}
