import { RmqContext } from '@nestjs/microservices';
type VerificationPayload = {
    to: string;
    subject: string;
    code: string;
    template: string;
};
export declare class EmailVerificationConsumer {
    private readonly logger;
    handleVerification(payload: VerificationPayload, context: RmqContext): Promise<void>;
}
export {};
