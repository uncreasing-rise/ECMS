import { Injectable } from '@nestjs/common';
import { ClassesCoreService } from '../classes.core.service.js';

@Injectable()
export class ClassesAssignmentsService {
  constructor(private readonly core: ClassesCoreService) {}

  getClassAssignments(
    ...args: Parameters<ClassesCoreService['getClassAssignments']>
  ) {
    return this.core.getClassAssignments(...args);
  }

  createAssignment(
    ...args: Parameters<ClassesCoreService['createAssignment']>
  ) {
    return this.core.createAssignment(...args);
  }

  getAssignmentSubmissions(
    ...args: Parameters<ClassesCoreService['getAssignmentSubmissions']>
  ) {
    return this.core.getAssignmentSubmissions(...args);
  }

  submitAssignment(
    ...args: Parameters<ClassesCoreService['submitAssignment']>
  ) {
    return this.core.submitAssignment(...args);
  }
}
