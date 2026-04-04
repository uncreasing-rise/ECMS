import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post('verify-email')
	@Throttle({ default: { limit: 20, ttl: 60000 } })
	verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
		return this.authService.verifyEmail(verifyEmailDto);
	}

	@Post('resend-verification')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	resendVerification(@Body() resendDto: ResendVerificationDto) {
		return this.authService.resendVerification(resendDto.email);
	}

	@Post('login')
	@Throttle({ default: { limit: 20, ttl: 60000 } })
	login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	me(@Req() req: Request) {
		return req.user;
	}
}
