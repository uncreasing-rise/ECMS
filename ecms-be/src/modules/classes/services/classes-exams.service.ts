import { Injectable } from '@nestjs/common';
import { ClassesCoreService } from '../classes.core.service.js';

@Injectable()
export class ClassesExamsService {
  constructor(private readonly core: ClassesCoreService) {}

  getClassTests(...args: Parameters<ClassesCoreService['getClassTests']>) {
    return this.core.getClassTests(...args);
  }

  createClassTest(...args: Parameters<ClassesCoreService['createClassTest']>) {
    return this.core.createClassTest(...args);
  }

  getMyExamAttempts(
    ...args: Parameters<ClassesCoreService['getMyExamAttempts']>
  ) {
    return this.core.getMyExamAttempts(...args);
  }

  startExamAttempt(
    ...args: Parameters<ClassesCoreService['startExamAttempt']>
  ) {
    return this.core.startExamAttempt(...args);
  }

  upsertExamAnswers(
    ...args: Parameters<ClassesCoreService['upsertExamAnswers']>
  ) {
    return this.core.upsertExamAnswers(...args);
  }

  submitExamAttempt(
    ...args: Parameters<ClassesCoreService['submitExamAttempt']>
  ) {
    return this.core.submitExamAttempt(...args);
  }

  getExamAttemptDetail(
    ...args: Parameters<ClassesCoreService['getExamAttemptDetail']>
  ) {
    return this.core.getExamAttemptDetail(...args);
  }

  getBlueprintTemplates(
    ...args: Parameters<ClassesCoreService['getBlueprintTemplates']>
  ) {
    return this.core.getBlueprintTemplates(...args);
  }

  getBlueprintTemplateById(
    ...args: Parameters<ClassesCoreService['getBlueprintTemplateById']>
  ) {
    return this.core.getBlueprintTemplateById(...args);
  }

  createBlueprintTemplate(
    ...args: Parameters<ClassesCoreService['createBlueprintTemplate']>
  ) {
    return this.core.createBlueprintTemplate(...args);
  }

  updateBlueprintTemplate(
    ...args: Parameters<ClassesCoreService['updateBlueprintTemplate']>
  ) {
    return this.core.updateBlueprintTemplate(...args);
  }

  deleteBlueprintTemplate(
    ...args: Parameters<ClassesCoreService['deleteBlueprintTemplate']>
  ) {
    return this.core.deleteBlueprintTemplate(...args);
  }

  createBlueprintSection(
    ...args: Parameters<ClassesCoreService['createBlueprintSection']>
  ) {
    return this.core.createBlueprintSection(...args);
  }

  updateBlueprintSection(
    ...args: Parameters<ClassesCoreService['updateBlueprintSection']>
  ) {
    return this.core.updateBlueprintSection(...args);
  }

  deleteBlueprintSection(
    ...args: Parameters<ClassesCoreService['deleteBlueprintSection']>
  ) {
    return this.core.deleteBlueprintSection(...args);
  }
}
