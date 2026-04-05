import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';

@Injectable()
export class MailService {
  private resend?: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from?: string;

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('MAIL_FROM');

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is missing. Email sending is disabled.');
    }
  }

  async sendVerifyEmail(params: {
    to: string;
    full_name: string;
    token: string;
    userId: string;
  }) {
    const verify_url = `${this.config.get('FRONTEND_URL')}/auth/verify-email?token=${params.token}&uid=${params.userId}`;
    const template = verifyEmailTemplate({
      full_name: params.full_name,
      verify_url,
    });

    await this.send({ to: params.to, ...template });
  }

  async sendResetPassword(params: {
    to: string;
    full_name: string;
    token: string;
    userId: string;
  }) {
    const reset_url = `${this.config.get('FRONTEND_URL')}/auth/reset-password?token=${params.token}&uid=${params.userId}`;
    const template = resetPasswordTemplate({
      full_name: params.full_name,
      reset_url,
    });

    await this.send({ to: params.to, ...template });
  }

  private async send(params: { to: string; subject: string; html: string }) {
    if (!this.resend || !this.from) {
      this.logger.warn(
        `Skip sending email to ${params.to}: mail provider is not configured.`,
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        this.logger.error(
          `Gửi email thất bại tới ${params.to}: ${error.message}`,
          JSON.stringify(error),
        );
        return;
      }

      this.logger.log(
        `Email queued tới ${params.to} (id=${data?.id ?? 'unknown'})`,
      );
    } catch (err) {
      this.logger.error(`Gửi email thất bại tới ${params.to}`, err);
    }
  }
}
