import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface.js';

export function ensureStudentSelfAccess(
  user: AuthenticatedUser,
  ownerId: string,
  message: string,
): void {
  if (user.roles.includes('student') && user.id !== ownerId) {
    throw new BadRequestException(message);
  }
}
