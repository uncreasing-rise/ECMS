import { Injectable } from '@nestjs/common';
import { ClassesCoreService } from '../classes.core.service.js';

@Injectable()
export class ClassesGradingService {
  constructor(private readonly core: ClassesCoreService) {}

  gradeAssignmentSubmission(
    ...args: Parameters<ClassesCoreService['gradeAssignmentSubmission']>
  ) {
    return this.core.gradeAssignmentSubmission(...args);
  }
}
