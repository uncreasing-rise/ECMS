import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface SendPushParams {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

@Injectable()
export class FirebaseService {
  private firebase: typeof admin | null = null;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private config: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccountPath = this.config.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
      );
      const databaseUrl = this.config.get<string>('FIREBASE_DATABASE_URL');

      if (!serviceAccountPath || !databaseUrl) {
        this.logger.warn(
          'Firebase not configured. Push notifications disabled.',
        );
        return;
      }

      const resolvedServiceAccountPath =
        this.resolveServiceAccountPath(serviceAccountPath);
      if (!resolvedServiceAccountPath) {
        this.logger.warn(
          `Firebase service account not found at: ${serviceAccountPath}. Push notifications disabled.`,
        );
        return;
      }

      // Load and initialize Firebase Admin SDK
      const serviceAccount = JSON.parse(
        fs.readFileSync(resolvedServiceAccountPath, 'utf8'),
      ) as admin.ServiceAccount;

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: databaseUrl,
        });
      }

      this.firebase = admin;
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  private resolveServiceAccountPath(serviceAccountPath: string): string | null {
    const normalizedInput = serviceAccountPath.trim();
    const candidates = [
      normalizedInput,
      path.resolve(process.cwd(), normalizedInput),
      path.resolve(process.cwd(), '..', normalizedInput),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Send push notification to specific user
   */
  async sendToUser(params: SendPushParams & { fcm_token: string }) {
    if (!this.firebase) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return null;
    }

    try {
      const message = {
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data || {},
        android: {
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            sound: 'default',
          },
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: params.title,
                body: params.body,
              },
              sound: 'default',
              badge: params.badge,
            },
          },
        },
        token: params.fcm_token,
      };

      const response = await this.firebase
        .messaging()
        .send(message as admin.messaging.Message);
      this.logger.log(
        `Push notification sent to user ${params.user_id}: ${response}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to send push to ${params.user_id}`, error);
      return null;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendMulticast(params: SendPushParams & { fcm_tokens: string[] }) {
    if (!this.firebase || params.fcm_tokens.length === 0) {
      this.logger.warn(
        'Firebase not initialized or no tokens. Skipping multicast.',
      );
      return null;
    }

    try {
      const message = {
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data || {},
        android: {
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            sound: 'default',
          },
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: params.title,
                body: params.body,
              },
              sound: 'default',
              badge: params.badge,
            },
          },
        },
      };

      const sendPromises = params.fcm_tokens.map((token) =>
        this.firebase!.messaging().send({
          ...message,
          token,
        } as admin.messaging.Message),
      );

      const responses = await Promise.allSettled(sendPromises);
      const successCount = responses.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const failureCount = responses.filter(
        (r) => r.status === 'rejected',
      ).length;

      this.logger.log(
        `Multicast sent to ${params.user_id}: success=${successCount}, failed=${failureCount}`,
      );
      return { successCount, failureCount };
    } catch (error) {
      this.logger.error(`Failed to send multicast to ${params.user_id}`, error);
      return null;
    }
  }

  /**
   * Subscribe device tokens to a topic
   */
  async subscribeToTopic(fcm_tokens: string[], topic: string): Promise<any> {
    if (!this.firebase || fcm_tokens.length === 0) {
      return null;
    }

    try {
      const response = await this.firebase
        .messaging()
        .subscribeToTopic(fcm_tokens, topic);
      this.logger.log(
        `Subscribed ${fcm_tokens.length} devices to topic: ${topic}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}`, error);
      return null;
    }
  }

  /**
   * Unsubscribe device tokens from a topic
   */
  async unsubscribeFromTopic(
    fcm_tokens: string[],
    topic: string,
  ): Promise<any> {
    if (!this.firebase || fcm_tokens.length === 0) {
      return null;
    }

    try {
      const response = await this.firebase
        .messaging()
        .unsubscribeFromTopic(fcm_tokens, topic);
      this.logger.log(
        `Unsubscribed ${fcm_tokens.length} devices from topic: ${topic}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}`, error);
      return null;
    }
  }

  /**
   * Send notification to topic
   */
  async sendToTopic(
    title: string,
    body: string,
    topic: string,
    data?: Record<string, string>,
  ) {
    if (!this.firebase) {
      this.logger.warn(
        'Firebase not initialized. Skipping topic notification.',
      );
      return null;
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            sound: 'default',
          },
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
            },
          },
        },
        topic,
      };

      const response = await this.firebase
        .messaging()
        .send(message as admin.messaging.Message);
      this.logger.log(`Notification sent to topic ${topic}: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send to topic ${topic}`, error);
      return null;
    }
  }

  isInitialized(): boolean {
    return !!this.firebase;
  }
}
