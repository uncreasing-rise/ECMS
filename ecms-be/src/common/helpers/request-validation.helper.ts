import { AppErrorCode } from '../api/app-error-code.enum.js';
import { AppException } from '../api/app-exception.js';
import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface.js';

export function ensureStudentSelfAccess(
  user: AuthenticatedUser,
  ownerId: string,
  message: string,
): void {
  if (user.roles.includes('student') && user.id !== ownerId) {
    throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'error.bad_request', message: message });
  }
}





