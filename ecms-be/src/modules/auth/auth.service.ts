import {
  Injectable, BadRequestException,
  UnauthorizedException, ConflictException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from '../../common/mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { randomUUID } from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private mail: MailService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────
  async register(dto: RegisterDto, ip: string) {
    const exists = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email đã được sử dụng');

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        full_name: dto.full_name,
        password_hash,
        phone: dto.phone,
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
        gender: dto.gender,
        status: 'inactive', // chờ verify email
      },
    });

    // Gán role student mặc định
    const studentRole = await this.prisma.roles.findFirst({
      where: { name: 'student' },
    });
    if (studentRole) {
      await this.prisma.user_roles.create({
        data: { id: randomUUID(), user_id: user.id, role_id: studentRole.id },
      });
    }

    // Gửi verify email
    await this.sendVerificationEmail(user.id, user.email, user.full_name);
    await this.writeAuditLog({ user_id: user.id, action: 'REGISTER', ip });

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
    };
  }

  // ─── Verify Email ─────────────────────────────
  async verifyEmail(userId: string, token: string) {
    const stored = await this.redis.getVerifyToken(userId);
    if (!stored) throw new BadRequestException('Token không tồn tại hoặc đã hết hạn');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(stored),
      Buffer.from(token),
    );
    if (!isValid) throw new BadRequestException('Token không hợp lệ');

    await this.prisma.users.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    await this.redis.delVerifyToken(userId);
    return { message: 'Xác nhận email thành công. Bạn có thể đăng nhập.' };
  }

  // ─── Resend Verification ──────────────────────
  async resendVerification(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) return { message: 'Nếu email tồn tại, bạn sẽ nhận được mail xác nhận.' };
    if (user.status === 'active') throw new BadRequestException('Tài khoản đã được xác nhận');

    const hasCooldown = await this.redis.hasResendCooldown(user.id);
    if (hasCooldown) throw new BadRequestException('Vui lòng chờ 60 giây trước khi gửi lại');

    await this.sendVerificationEmail(user.id, user.email, user.full_name);
    await this.redis.setResendCooldown(user.id, 60);

    return { message: 'Đã gửi lại email xác nhận.' };
  }

  // ─── Login ───────────────────────────────────
  async login(dto: LoginDto, ip: string) {
    // Kiểm tra failed attempts
    const failedCount = await this.redis.getFailedLogin(dto.email);
    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      throw new ForbiddenException(
        'Tài khoản tạm thời bị khoá do đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.',
      );
    }

    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: { user_roles: { include: { roles: true } } },
    });

    // Sai email hoặc password → tăng counter
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      if (user) await this.redis.incrementFailedLogin(dto.email);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Vui lòng xác nhận email trước khi đăng nhập');
    }

    if (user.status === 'on_hold') {
      throw new UnauthorizedException('Tài khoản đã bị khoá, vui lòng liên hệ admin');
    }

    // Đăng nhập thành công → reset counter
    await this.redis.resetFailedLogin(dto.email);
    await this.writeAuditLog({ user_id: user.id, action: 'LOGIN', ip });

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: this.sanitizeUser(user),
      roles: user.user_roles.map((ur) => ur.roles.name),
      ...tokens,
    };
  }

  // ─── Refresh Token ────────────────────────────
  async refreshToken(token: string) {
    // Kiểm tra blacklist
    const isBlacklisted = await this.redis.isTokenBlacklisted(token);
    if (isBlacklisted) throw new UnauthorizedException('Token đã bị thu hồi');

    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.users.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'active') throw new UnauthorizedException();

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  // ─── Logout ───────────────────────────────────
  async logout(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // Blacklist refresh token đến hết thời hạn
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await this.redis.blacklistToken(refreshToken, ttl);
    } catch {
      // Token đã hết hạn, không cần blacklist
    }

    return { message: 'Đăng xuất thành công' };
  }

  // ─── Forgot Password ──────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });

    // Luôn trả về cùng message để tránh email enumeration
    if (!user || user.status !== 'active') {
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' };
    }

    const hasCooldown = await this.redis.hasResendCooldown(`reset_${user.id}`);
    if (hasCooldown) throw new BadRequestException('Vui lòng chờ 60 giây trước khi thử lại');

    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.setResetToken(user.id, token, 3600); // 1 giờ
    await this.redis.setResendCooldown(`reset_${user.id}`, 60);

    await this.mail.sendResetPassword({
      to: user.email,
      full_name: user.full_name,
      token,
      userId: user.id,
    });

    await this.writeAuditLog({ user_id: user.id, action: 'FORGOT_PASSWORD', ip: '' });

    return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' };
  }

  // ─── Reset Password ───────────────────────────
  async resetPassword(dto: ResetPasswordDto, ip: string) {
    const stored = await this.redis.getResetToken(dto.userId);
    if (!stored) throw new BadRequestException('Token không tồn tại hoặc đã hết hạn');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(stored),
      Buffer.from(dto.token),
    );
    if (!isValid) throw new BadRequestException('Token không hợp lệ');

    const password_hash = await bcrypt.hash(dto.new_password, 12);

    await this.prisma.users.update({
      where: { id: dto.userId },
      data: { password_hash },
    });

    await this.redis.delResetToken(dto.userId);
    await this.writeAuditLog({ user_id: dto.userId, action: 'RESET_PASSWORD', ip });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // ─── Get Profile ──────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: { roles: true, branches: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    return {
      ...this.sanitizeUser(user),
      roles: user.user_roles.map((ur) => ({
        role: ur.roles.name,
        branch: ur.branches?.name ?? null,
      })),
    };
  }

  // ─── Helpers ──────────────────────────────────
  private async sendVerificationEmail(
    userId: string,
    email: string,
    full_name: string,
  ) {
    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.setVerifyToken(userId, token, 86400); // 24 giờ
    await this.mail.sendVerifyEmail({ to: email, full_name, token, userId });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  private sanitizeUser(user: any) {
    const { password_hash, ...rest } = user;
    return rest;
  }

  private async writeAuditLog(params: {
    user_id: string;
    action: string;
    ip: string;
  }) {
    await this.prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        user_id: params.user_id,
        action: params.action,
        target_type: 'auth',
        ip_address: params.ip,
      },
    });
  }
}