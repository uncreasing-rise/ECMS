"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    cacheManager;
    loginProfileLoaders = new Map();
    constructor(prisma, jwtService, cacheManager) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.cacheManager = cacheManager;
    }
    getVerificationKey(email) {
        return `auth:verify:${email.toLowerCase()}`;
    }
    getLoginProfileKey(email) {
        return `auth:login:profile:${email.toLowerCase()}`;
    }
    getLoginFastFailKey(email, tracker) {
        return `auth:login:fast-fail:${email.toLowerCase()}:${tracker}`;
    }
    getLoginProfileTtlMs() {
        return Number(process.env.AUTH_LOGIN_PROFILE_CACHE_TTL_MS ?? '15000');
    }
    getLoginFastFailTtlMs() {
        return Number(process.env.AUTH_LOGIN_FAST_FAIL_TTL_MS ?? '3000');
    }
    getPasswordHashRounds() {
        return Number(process.env.AUTH_PASSWORD_HASH_ROUNDS ?? '10');
    }
    async loadLoginProfile(email) {
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
    async getLoginProfile(email) {
        const cacheKey = this.getLoginProfileKey(email);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        const inFlightLoader = this.loginProfileLoaders.get(cacheKey);
        if (inFlightLoader) {
            return inFlightLoader;
        }
        const loader = (async () => {
            const loaded = await this.loadLoginProfile(email);
            await this.cacheManager.set(cacheKey, loaded, this.getLoginProfileTtlMs());
            return loaded;
        })().finally(() => {
            this.loginProfileLoaders.delete(cacheKey);
        });
        this.loginProfileLoaders.set(cacheKey, loader);
        return loader;
    }
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async register(registerDto) {
        const email = registerDto.email.toLowerCase();
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const passwordHash = await bcrypt.hash(registerDto.password, this.getPasswordHashRounds());
        const code = this.generateCode();
        const pendingData = {
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            email,
            phone: registerDto.phone,
            passwordHash,
            code,
        };
        await this.cacheManager.set(this.getVerificationKey(email), pendingData, 10 * 60 * 1000);
        return {
            message: 'Registration pending verification. Please check your email for verification code.',
            expiresInSeconds: 600,
        };
    }
    async resendVerification(email) {
        const key = this.getVerificationKey(email);
        const pending = await this.cacheManager.get(key);
        if (!pending) {
            throw new common_1.BadRequestException('Verification session expired. Please register again.');
        }
        const code = this.generateCode();
        pending.code = code;
        await this.cacheManager.set(key, pending, 10 * 60 * 1000);
        return { message: 'Verification code resent.' };
    }
    async verifyEmail(dto) {
        const email = dto.email.toLowerCase();
        const key = this.getVerificationKey(email);
        const pending = await this.cacheManager.get(key);
        if (!pending) {
            throw new common_1.BadRequestException('Verification session expired. Please register again.');
        }
        if (pending.code !== dto.code) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            await this.cacheManager.del(key);
            throw new common_1.ConflictException('Email already exists');
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
    async login(loginDto, tracker = 'anonymous') {
        const email = loginDto.email.toLowerCase();
        const fastFailKey = this.getLoginFastFailKey(email, tracker);
        const isFastFail = await this.cacheManager.get(fastFailKey);
        if (isFastFail) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const user = await this.getLoginProfile(email);
        if (!user || !user.passwordHash) {
            await this.cacheManager.set(fastFailKey, true, this.getLoginFastFailTtlMs());
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.cacheManager.set(fastFailKey, true, this.getLoginFastFailTtlMs());
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            await this.cacheManager.set(fastFailKey, true, this.getLoginFastFailTtlMs());
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.cacheManager.del(fastFailKey);
        if (!user.emailVerifiedAt) {
            throw new common_1.UnauthorizedException('Email is not verified');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map