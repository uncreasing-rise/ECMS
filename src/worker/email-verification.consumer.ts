import { Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

type VerificationPayload = {
  to: string;
  subject: string;
  code: string;
  template: string;
};

export class EmailVerificationConsumer {
  private readonly logger = new Logger(EmailVerificationConsumer.name);

  @MessagePattern('email.verification')
  async handleVerification(
    @Payload() payload: VerificationPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received email verification event for ${payload.to}, template=${payload.template}`,
    );

    // TODO: integrate real mail provider (SES/SMTP) here.
    this.logger.debug(`Verification code: ${payload.code}`);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
