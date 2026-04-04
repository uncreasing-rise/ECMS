import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

type PendingRegistration = {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	passwordHash: string;
	code: string;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	private getVerificationKey(email: string): string {
		return `auth:verify:${email.toLowerCase()}`;
	}

	private generateCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	async register(registerDto: RegisterDto) {
		const email = registerDto.email.toLowerCase();
		const existingUser = await this.prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			throw new ConflictException('Email already exists');
		}

		const passwordHash = await bcrypt.hash(registerDto.password, 10);
		const code = this.generateCode();
		const pendingData: PendingRegistration = {
			firstName: registerDto.firstName,
			lastName: registerDto.lastName,
			email,
			phone: registerDto.phone,
			passwordHash,
			code,
		};

		await this.cacheManager.set(
			this.getVerificationKey(email),
			pendingData,
			10 * 60 * 1000,
		);

		// Single-process mode: keep verification in cache, email sender can be integrated later.
		// Logic for sending email will be implemented here.

		return {
			message:
				'Registration pending verification. Please check your email for verification code.',
			expiresInSeconds: 600,
		};
	}

	async resendVerification(email: string) {
		const key = this.getVerificationKey(email);
		const pending = await this.cacheManager.get<PendingRegistration>(key);

		if (!pending) {
			throw new BadRequestException(
				'Verification session expired. Please register again.',
			);
		}

		const code = this.generateCode();
		pending.code = code;
		await this.cacheManager.set(key, pending, 10 * 60 * 1000);

		// Single-process mode: keep verification in cache, email sender can be integrated later.
		// Logic for sending email will be implemented here.

		return { message: 'Verification code resent.' };
	}

	async verifyEmail(dto: VerifyEmailDto) {
		const email = dto.email.toLowerCase();
		const key = this.getVerificationKey(email);
		const pending = await this.cacheManager.get<PendingRegistration>(key);

		if (!pending) {
			throw new BadRequestException(
				'Verification session expired. Please register again.',
			);
		}

		if (pending.code !== dto.code) {
			throw new BadRequestException('Invalid verification code');
		}

		const existingUser = await this.prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			await this.cacheManager.del(key);
			throw new ConflictException('Email already exists');
		}

		const user = await this.prisma.user.create({
			data: {
				firstName: pending.firstName,
				lastName: pending.lastName,
				email: pending.email,
				phone: pending.phone,
				accountType: 'staff',
				status: 'active',
				passwordHash: pending.passwordHash,
				emailVerifiedAt: new Date(),
			},
			include: { userRoles: { include: { role: true } } },
		});

		await this.cacheManager.del(key);

		const payload = {
			sub: user.id,
			email: user.email,
			accountType: user.accountType,
			status: user.status,
			roles: user.userRoles.map((it) => it.role.name),
		};

		return {
			message: 'Email verified successfully',
			access_token: await this.jwtService.signAsync(payload),
			user: payload,
		};
	}

	async login(loginDto: LoginDto) {
		type LoginUser = {
			id: string;
			email: string;
			accountType: string;
			status: string;
			passwordHash: string | null;
			emailVerifiedAt: Date | null;
			userRoles: Array<{ role: { name: string } }>;
		};

		const user = (await this.prisma.user.findUnique({
			where: { email: loginDto.email.toLowerCase() },
			include: { userRoles: { include: { role: true } } },
		})) as LoginUser | null;

		if (!user || !user.passwordHash) {
			throw new UnauthorizedException('Invalid email or password');
		}

		const isPasswordValid = await bcrypt.compare(
			loginDto.password,
			user.passwordHash,
		);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid email or password');
		}

		if (!user.emailVerifiedAt) {
			throw new UnauthorizedException('Email is not verified');
		}

		const payload = {
			sub: user.id,
			email: user.email,
			accountType: user.accountType,
			status: user.status,
			roles: user.userRoles.map((it) => it.role.name),
		};

		return {
			access_token: await this.jwtService.signAsync(payload),
			user: payload,
		};
	}
}
