import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import {
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from '../../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationMessages,
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants.js';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { randomUUID } from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RoleName } from './enums/role-name.enum';

const MAX_FAILED_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const PENDING_VERIFICATION_TTL_HOURS = 24;

interface RefreshTokenPayload {
  sub: string;
  email: string;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private mail: MailService,
    private notifications: NotificationsService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────
  async register(dto: RegisterDto, ip: string) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.users.findUnique({
      where: { email },
    });

    if (exists) {
      if (exists.status === 'active') {
        throw new AppException({ code: AppErrorCode.CONFLICT, errorKey: 'auth.conflict', message: 'Email đã được sử dụng' });
      }

      if (exists.status === 'on_hold') {
        throw new AppException({ code: AppErrorCode.FORBIDDEN, errorKey: 'auth.forbidden', message: 'Tài khoản đã bị khoá, vui lòng liên hệ admin', });
      }

      if (exists.status === 'inactive') {
        const hasCooldown = await this.redis.hasResendCooldown(exists.id);
        if (hasCooldown) {
          throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Email đã đăng ký nhưng chưa xác thực. Vui lòng chờ 60 giây trước khi gửi lại.', });
        }

        const expired = this.isPendingVerificationExpired(exists.created_at);

        if (expired) {
          const password_hash = await bcrypt.hash(dto.password, 12);
          const refreshedUser = await this.prisma.users.update({
            where: { id: exists.id },
            data: {
              full_name: dto.full_name,
              password_hash,
              phone: dto.phone,
              date_of_birth: dto.date_of_birth
                ? new Date(dto.date_of_birth)
                : null,
              gender: dto.gender,
              status: 'inactive',
            },
          });

          await this.ensureDefaultStudentRole(refreshedUser.id);
          await this.sendVerificationEmail(
            refreshedUser.id,
            refreshedUser.email,
            refreshedUser.full_name,
          );
          await this.redis.setResendCooldown(
            refreshedUser.id,
            RESEND_COOLDOWN_SECONDS,
          );
          await this.writeAuditLog({
            user_id: refreshedUser.id,
            action: 'REGISTER_RETRY',
            ip,
          });

          return {
            message:
              'Tài khoản chờ xác thực đã hết hạn. Chúng tôi đã gửi email xác nhận mới.',
          };
        }

        await this.ensureDefaultStudentRole(exists.id);
        await this.sendVerificationEmail(
          exists.id,
          exists.email,
          exists.full_name,
        );
        await this.redis.setResendCooldown(exists.id, RESEND_COOLDOWN_SECONDS);

        return {
          message:
            'Email đã được đăng ký nhưng chưa xác thực. Chúng tôi đã gửi lại email xác nhận.',
        };
      }

      throw new AppException({ code: AppErrorCode.CONFLICT, errorKey: 'auth.conflict', message: 'Email đã được sử dụng' });
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        full_name: dto.full_name,
        password_hash,
        phone: dto.phone,
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
        gender: dto.gender,
        status: 'inactive',
      },
    });

    await this.ensureDefaultStudentRole(user.id);

    // Gửi verify email
    await this.sendVerificationEmail(user.id, user.email, user.full_name);
    await this.redis.setResendCooldown(user.id, RESEND_COOLDOWN_SECONDS);
    await this.writeAuditLog({ user_id: user.id, action: 'REGISTER', ip });

    return {
      message:
        'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
    };
  }

  // ─── Verify Email ─────────────────────────────
  async verifyEmail(userId: string, token: string, ip: string = '') {
    const stored = await this.redis.getVerifyToken(userId);
    if (!stored)
      throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Token không tồn tại hoặc đã hết hạn' });

    const hashedToken = this.hashToken(token);
    const isValid = this.safeTimingEqual(stored, hashedToken);
    if (!isValid) throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Token không hợp lệ' });

    await this.prisma.users.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    try {
      await this.notifications.create({
        user_id: userId,
        type: NotificationType.ACCOUNT_VERIFIED,
        title: NotificationMessages.accountVerifiedTitle,
        body: NotificationMessages.accountVerifiedBody,
        ref_type: NotificationRefType.AUTH,
        ref_id: userId,
      });
    } catch {
      // Keep verification flow resilient even if notification delivery fails.
    }

    await this.redis.delVerifyToken(userId);
    await this.writeAuditLog({ user_id: userId, action: 'VERIFY_EMAIL', ip });
    return { message: 'Xác nhận email thành công. Bạn có thể đăng nhập.' };
  }

  // ─── Resend Verification ──────────────────────
  async resendVerification(email: string, ip: string = '') {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user)
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được mail xác nhận.' };
    if (user.status === 'active')
      throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Tài khoản đã được xác nhận' });

    const hasCooldown = await this.redis.hasResendCooldown(user.id);
    if (hasCooldown)
      throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Vui lòng chờ 60 giây trước khi gửi lại' });

    await this.sendVerificationEmail(user.id, user.email, user.full_name);
    await this.redis.setResendCooldown(user.id, RESEND_COOLDOWN_SECONDS);
    await this.writeAuditLog({ user_id: user.id, action: 'RESEND_VERIFY', ip });

    return { message: 'Đã gửi lại email xác nhận.' };
  }

  // ─── Login ────────────────────────────────────
  async login(dto: LoginDto, ip: string) {
    const email = dto.email.toLowerCase();

    // Kiểm tra failed attempts
    const failedCount = await this.redis.getFailedLogin(email);
    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      throw new AppException({ code: AppErrorCode.FORBIDDEN, errorKey: 'auth.forbidden', message: 'Tài khoản tạm thời bị khoá do đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.', });
    }

    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { user_roles: { include: { roles: true } } },
    });

    // Sai email hoặc password → tăng counter
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      if (user) await this.redis.incrementFailedLogin(email);
      throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized', message: 'Email hoặc mật khẩu không đúng' });
    }

    if (user.status === 'inactive') {
      throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized', message: 'Vui lòng xác nhận email trước khi đăng nhập', });
    }

    if (user.status === 'on_hold') {
      throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized', message: 'Tài khoản đã bị khoá, vui lòng liên hệ admin', });
    }

    // Đăng nhập thành công → reset counter
    await this.redis.resetFailedLogin(email);
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
    if (isBlacklisted) throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized', message: 'Token đã bị thu hồi' });

    try {
      const payload = this.jwt.verify<RefreshTokenPayload>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.users.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'active') throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized' });

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized', message: 'Refresh token không hợp lệ hoặc đã hết hạn', });
    }
  }

  // ─── Logout ───────────────────────────────────
  async logout(refreshToken: string) {
    try {
      const payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
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
  async forgotPassword(email: string, ip: string = '') {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    // Luôn trả về cùng message để tránh email enumeration
    if (!user || user.status !== 'active') {
      return {
        message:
          'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      };
    }

    const hasCooldown = await this.redis.hasResendCooldown(`reset_${user.id}`);
    if (hasCooldown)
      throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Vui lòng chờ 60 giây trước khi thử lại' });

    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.setResetToken(user.id, token, 3600); // 1 giờ
    await this.redis.setResendCooldown(`reset_${user.id}`, 60);

    await this.mail.sendResetPassword({
      to: user.email,
      full_name: user.full_name,
      token,
      userId: user.id,
    });

    await this.writeAuditLog({
      user_id: user.id,
      action: 'FORGOT_PASSWORD',
      ip,
    });

    return {
      message:
        'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    };
  }

  // ─── Reset Password ───────────────────────────
  async resetPassword(dto: ResetPasswordDto, ip: string) {
    const stored = await this.redis.getResetToken(dto.userId);
    if (!stored)
      throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Token không tồn tại hoặc đã hết hạn' });

    const hashedToken = this.hashToken(dto.token);
    const isValid = this.safeTimingEqual(stored, hashedToken);
    if (!isValid) throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'auth.bad_request', message: 'Token không hợp lệ' });

    const password_hash = await bcrypt.hash(dto.new_password, 12);

    await this.prisma.users.update({
      where: { id: dto.userId },
      data: { password_hash },
    });

    await this.redis.delResetToken(dto.userId);
    await this.writeAuditLog({
      user_id: dto.userId,
      action: 'RESET_PASSWORD',
      ip,
    });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // ─── Get Profile ──────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: { roles: true },
        },
      },
    });

    if (!user) throw new AppException({ code: AppErrorCode.UNAUTHORIZED, errorKey: 'auth.unauthorized' });

    return {
      ...this.sanitizeUser(user),
      roles: user.user_roles.map((ur) => ur.roles.name),
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

  private safeTimingEqual(left: string, right: string) {
    const leftBuf = Buffer.from(left);
    const rightBuf = Buffer.from(right);

    if (leftBuf.length !== rightBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(leftBuf, rightBuf);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
  }

  private isPendingVerificationExpired(createdAt: Date | null): boolean {
    if (!createdAt) {
      return true;
    }

    const ageMs = Date.now() - new Date(createdAt).getTime();
    return ageMs > PENDING_VERIFICATION_TTL_HOURS * 60 * 60 * 1000;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessSecret = this.config.get<string>('JWT_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new AppException({ code: AppErrorCode.INTERNAL_SERVER_ERROR, errorKey: 'auth.internal_server', message: 'Thiếu cấu hình JWT_SECRET hoặc JWT_REFRESH_SECRET trong biến môi trường', });
    }

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '1d',
      }),
      this.jwt.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async ensureDefaultStudentRole(userId: string) {
    const studentRole = await this.prisma.roles.upsert({
      where: { name: RoleName.STUDENT },
      update: {},
      create: {
        id: randomUUID(),
        name: RoleName.STUDENT,
      },
    });

    const exists = await this.prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        role_id: studentRole.id,
      },
      select: { id: true },
    });

    if (!exists) {
      await this.prisma.user_roles.create({
        data: {
          id: randomUUID(),
          user_id: userId,
          role_id: studentRole.id,
        },
      });
    }
  }

  private sanitizeUser<T extends { password_hash?: string | null }>(
    user: T,
  ): Omit<T, 'password_hash'> {
    const { password_hash: _passwordHash, ...rest } = user;
    void _passwordHash;
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





