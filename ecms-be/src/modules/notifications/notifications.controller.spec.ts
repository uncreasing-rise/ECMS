import { describe, expect, it, jest } from '@jest/globals';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  const notificationsService = {
    getNotifications: jest.fn(),
  };
  const deviceTokensService = {
    registerToken: jest.fn(),
  };

  const controller = new NotificationsController(
    notificationsService as never,
    deviceTokensService as never,
  );

  it('getNotifications parses pagination and filter', async () => {
    await controller.getNotifications(
      { id: 'u1' } as never,
      '10',
      '5',
      'class',
      'true',
    );

    expect(notificationsService.getNotifications).toHaveBeenCalledWith({
      user_id: 'u1',
      skip: 10,
      take: 5,
      ref_type: 'class',
      unread_only: true,
    });
  });

  it('registerDeviceToken delegates payload mapping', async () => {
    const dto = {
      fcm_token: 'token-1',
      device_name: 'iPhone',
      platform: 'ios',
    };

    await controller.registerDeviceToken({ id: 'u1' } as never, dto as never);

    expect(deviceTokensService.registerToken).toHaveBeenCalledWith({
      user_id: 'u1',
      fcm_token: 'token-1',
      device_name: 'iPhone',
      platform: 'ios',
    });
  });
});
