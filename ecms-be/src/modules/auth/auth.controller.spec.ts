import { describe, expect, it, jest } from '@jest/globals';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    getProfile: jest.fn(),
  };

  const controller = new AuthController(authService as never);

  it('register delegates dto and request ip fallback', async () => {
    const dto = { email: 'a@b.com' };
    const req = { ip: undefined };

    await controller.register(dto as never, req as never);

    expect(authService.register).toHaveBeenCalledWith(dto, '');
  });

  it('getProfile delegates user id', async () => {
    await controller.getProfile({ id: 'u1' } as never);

    expect(authService.getProfile).toHaveBeenCalledWith('u1');
  });
});
