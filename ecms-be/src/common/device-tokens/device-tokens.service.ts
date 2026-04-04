import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

export interface RegisterDeviceTokenParams {
  user_id: string;
  fcm_token: string;
  device_name?: string;
  platform?: string; // 'ios' | 'android' | 'web'
}

@Injectable()
export class DeviceTokensService {
  constructor(private prisma: PrismaService) {}

  // ─── Register Device Token ────────────────────
  async registerToken(params: RegisterDeviceTokenParams) {
    const { user_id, fcm_token, device_name, platform } = params;

    // Check if token already exists for this user
    const existing = await this.prisma.device_tokens.findUnique({
      where: { fcm_token },
    });

    if (existing) {
      if (existing.user_id !== user_id) {
        // Token is from another user, replace it
        await this.prisma.device_tokens.update({
          where: { fcm_token },
          data: {
            user_id,
            device_name,
            platform,
            is_active: true,
            last_used_at: new Date(),
          },
        });
        return { message: 'Token updated', action: 'updated' };
      } else {
        // Token already registered for this user, just update last_used
        await this.prisma.device_tokens.update({
          where: { fcm_token },
          data: { last_used_at: new Date() },
        });
        return { message: 'Token already registered', action: 'already_exists' };
      }
    }

    // Create new device token
    await this.prisma.device_tokens.create({
      data: {
        id: randomUUID(),
        user_id,
        fcm_token,
        device_name,
        platform,
      },
    });

    return { message: 'Device registered', action: 'created' };
  }

  // ─── Get User Tokens ──────────────────────────
  async getUserTokens(user_id: string, activeOnly: boolean = true) {
    const where: any = { user_id };
    if (activeOnly) {
      where.is_active = true;
    }

    const tokens = await this.prisma.device_tokens.findMany({
      where,
      select: {
        id: true,
        fcm_token: true,
        device_name: true,
        platform: true,
        is_active: true,
        last_used_at: true,
        created_at: true,
      },
      orderBy: { last_used_at: 'desc' },
    });

    return tokens;
  }

  // ─── Get Active FCM Tokens for User ───────────
  async getActiveFCMTokens(user_id: string): Promise<string[]> {
    const tokens = await this.prisma.device_tokens.findMany({
      where: { user_id, is_active: true },
      select: { fcm_token: true },
    });

    return tokens.map((t) => t.fcm_token);
  }

  // ─── Get Active FCM Tokens for Multiple Users ──
  async getActiveFCMTokensForUsers(user_ids: string[]): Promise<Record<string, string[]>> {
    if (user_ids.length === 0) return {};

    const tokens = await this.prisma.device_tokens.findMany({
      where: { user_id: { in: user_ids }, is_active: true },
      select: { user_id: true, fcm_token: true },
    });

    const result: Record<string, string[]> = {};
    tokens.forEach((t) => {
      if (!result[t.user_id]) {
        result[t.user_id] = [];
      }
      result[t.user_id].push(t.fcm_token);
    });

    return result;
  }

  // ─── Revoke Device Token ──────────────────────
  async revokeToken(user_id: string, token_id: string) {
    const token = await this.prisma.device_tokens.findUnique({
      where: { id: token_id },
    });

    if (!token) {
      throw new NotFoundException('Device token not found');
    }

    if (token.user_id !== user_id) {
      throw new BadRequestException('Cannot revoke other user\'s token');
    }

    await this.prisma.device_tokens.update({
      where: { id: token_id },
      data: { is_active: false },
    });

    return { message: 'Device token revoked' };
  }

  // ─── Revoke All Tokens for User ───────────────
  async revokeAllTokens(user_id: string) {
    const result = await this.prisma.device_tokens.updateMany({
      where: { user_id },
      data: { is_active: false },
    });

    return { message: `Revoked ${result.count} device tokens` };
  }

  // ─── Delete Old Tokens ────────────────────────
  async deleteOldTokens(days: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.device_tokens.deleteMany({
      where: {
        is_active: false,
        last_used_at: { lt: cutoffDate },
      },
    });

    return { message: `Deleted ${result.count} old device tokens` };
  }

  // ─── Check Token Health ───────────────────────
  async checkTokenHealth(user_id: string) {
    const tokens = await this.getUserTokens(user_id, true);
    const total = await this.prisma.device_tokens.count({ where: { user_id } });

    return {
      active_devices: tokens.length,
      total_devices: total,
      devices: tokens,
    };
  }
}
