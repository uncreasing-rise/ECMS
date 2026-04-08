import { describe, expect, it, jest } from '@jest/globals';
import { ParentPortalController } from './parent-portal.controller';

describe('ParentPortalController', () => {
  const portalService = {
    getChildOverview: jest.fn(),
    getChildNotifications: jest.fn(),
    sendCenterMessage: jest.fn(),
    createOnlinePaymentIntent: jest.fn(),
  };

  const controller = new ParentPortalController(portalService as never);

  it('delegates child overview', async () => {
    await controller.getChildOverview(
      { id: 'p1', roles: ['parent'] } as never,
      's1',
    );
    expect(portalService.getChildOverview).toHaveBeenCalledWith(
      { id: 'p1', roles: ['parent'] },
      's1',
    );
  });

  it('delegates payment intent', async () => {
    await controller.createPaymentIntent(
      { id: 'p1', roles: ['parent'] } as never,
      's1',
      'i1',
    );
    expect(portalService.createOnlinePaymentIntent).toHaveBeenCalledWith(
      { id: 'p1', roles: ['parent'] },
      's1',
      'i1',
    );
  });
});
