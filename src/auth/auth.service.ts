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

type LoginProfile = {
	id: string;
	email: string;
	accountType: string;
	status: string;
	passwordHash: string | null;
	emailVerifiedAt: Date | null;
	roles: string[];
};

@Injectable()
export class AuthService {
	private readonly loginProfileLoaders = new Map<string, Promise<LoginProfile | null>>();

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	private getVerificationKey(email: string): string {
		return `auth:verify:${email.toLowerCase()}`;
	}

	private getLoginProfileKey(email: string): string {
		return `auth:login:profile:${email.toLowerCase()}`;
	}

	private getLoginFastFailKey(email: string, tracker: string): string {
		return `auth:login:fast-fail:${email.toLowerCase()}:${tracker}`;
	}

	private getLoginProfileTtlMs(): number {
		return Number(process.env.AUTH_LOGIN_PROFILE_CACHE_TTL_MS ?? '15000');
	}

	private getLoginFastFailTtlMs(): number {
		return Number(process.env.AUTH_LOGIN_FAST_FAIL_TTL_MS ?? '3000');
	}

	private getPasswordHashRounds(): number {
		return Number(process.env.AUTH_PASSWORD_HASH_ROUNDS ?? '10');
	}

	private async loadLoginProfile(email: string): Promise<LoginProfile | null> {
		const user = await this.prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				accountType: true,
				status: true,
				passwordHash: true,
				emailVerifiedAt: true,
				userRoles: {
					select: {
						role: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			return null;
		}

		return {
			id: user.id,
			email: user.email,
			accountType: user.accountType,
			status: user.status,
			passwordHash: user.passwordHash,
			emailVerifiedAt: user.emailVerifiedAt,
			roles: user.userRoles.map((it) => it.role.name),
		};
	}

	private async getLoginProfile(email: string): Promise<LoginProfile | null> {
		const cacheKey = this.getLoginProfileKey(email);
		const cached = await this.cacheManager.get<LoginProfile | null>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const inFlightLoader = this.loginProfileLoaders.get(cacheKey);
		if (inFlightLoader) {
			return inFlightLoader;
		}

		const loader = (async () => {
			const loaded = await this.loadLoginProfile(email);
			await this.cacheManager.set(
				cacheKey,
				loaded,
				this.getLoginProfileTtlMs(),
			);

			return loaded;
		})().finally(() => {
			this.loginProfileLoaders.delete(cacheKey);
		});

		this.loginProfileLoaders.set(cacheKey, loader);
		return loader;
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

		const passwordHash = await bcrypt.hash(
			registerDto.password,
			this.getPasswordHashRounds(),
		);
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
		await this.cacheManager.del(this.getLoginProfileKey(email));

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

	async login(loginDto: LoginDto, tracker = 'anonymous') {
		const email = loginDto.email.toLowerCase();
		const fastFailKey = this.getLoginFastFailKey(email, tracker);
		const isFastFail = await this.cacheManager.get<boolean>(fastFailKey);
		if (isFastFail) {
			throw new UnauthorizedException('Invalid email or password');
		}

		const user = await this.getLoginProfile(email);

		if (!user || !user.passwordHash) {
			await this.cacheManager.set(fastFailKey, true, this.getLoginFastFailTtlMs());
			throw new UnauthorizedException('Invalid email or password');
		}

		// Guard concurrent password checks for the same email/tracker burst.
		await this.cacheManager.set(fastFailKey, true, this.getLoginFastFailTtlMs());

		const isPasswordValid = await bcrypt.compare(
			loginDto.password,
			user.passwordHash,
		);

		if (!isPasswordValid) {
			await this.cacheManager.set(fastFailKey, true, this.getLoginFastFailTtlMs());
			throw new UnauthorizedException('Invalid email or password');
		}

		await this.cacheManager.del(fastFailKey);

		if (!user.emailVerifiedAt) {
			throw new UnauthorizedException('Email is not verified');
		}

		const payload = {
			sub: user.id,
			email: user.email,
			accountType: user.accountType,
			status: user.status,
			roles: user.roles,
		};

		return {
			access_token: await this.jwtService.signAsync(payload),
			user: payload,
		};
	}
}
