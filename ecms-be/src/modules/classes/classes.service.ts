import { Injectable } from '@nestjs/common';
import { ClassesAssignmentsService } from './services/classes-assignments.service.js';
import { ClassesExamsService } from './services/classes-exams.service.js';
import { ClassesGradingService } from './services/classes-grading.service.js';
import { ClassesSchedulesService } from './services/classes-schedules.service.js';
import { ClassesLifecycleService } from './services/classes-lifecycle.service.js';

@Injectable()
export class ClassesService {
  constructor(
    private readonly lifecycle: ClassesLifecycleService,
    private readonly schedules: ClassesSchedulesService,
    private readonly assignments: ClassesAssignmentsService,
    private readonly exams: ClassesExamsService,
    private readonly grading: ClassesGradingService,
  ) {}

  createClass(...args: Parameters<ClassesLifecycleService['createClass']>) {
    return this.lifecycle.createClass(...args);
  }

  getClasses(...args: Parameters<ClassesLifecycleService['getClasses']>) {
    return this.lifecycle.getClasses(...args);
  }

  getClassById(...args: Parameters<ClassesLifecycleService['getClassById']>) {
    return this.lifecycle.getClassById(...args);
  }

  getClassStudents(
    ...args: Parameters<ClassesLifecycleService['getClassStudents']>
  ) {
    return this.lifecycle.getClassStudents(...args);
  }

  getClassResources(
    ...args: Parameters<ClassesLifecycleService['getClassResources']>
  ) {
    return this.lifecycle.getClassResources(...args);
  }

  createClassResource(
    ...args: Parameters<ClassesLifecycleService['createClassResource']>
  ) {
    return this.lifecycle.createClassResource(...args);
  }

  updateClass(...args: Parameters<ClassesLifecycleService['updateClass']>) {
    return this.lifecycle.updateClass(...args);
  }

  enrollStudent(...args: Parameters<ClassesLifecycleService['enrollStudent']>) {
    return this.lifecycle.enrollStudent(...args);
  }

  unenrollStudent(
    ...args: Parameters<ClassesLifecycleService['unenrollStudent']>
  ) {
    return this.lifecycle.unenrollStudent(...args);
  }

  deleteClass(...args: Parameters<ClassesLifecycleService['deleteClass']>) {
    return this.lifecycle.deleteClass(...args);
  }

  getMyClasses(...args: Parameters<ClassesLifecycleService['getMyClasses']>) {
    return this.lifecycle.getMyClasses(...args);
  }

  getClassSchedules(
    ...args: Parameters<ClassesSchedulesService['getClassSchedules']>
  ) {
    return this.schedules.getClassSchedules(...args);
  }

  getScheduleAttendance(
    ...args: Parameters<ClassesSchedulesService['getScheduleAttendance']>
  ) {
    return this.schedules.getScheduleAttendance(...args);
  }

  recordScheduleAttendance(
    ...args: Parameters<ClassesSchedulesService['recordScheduleAttendance']>
  ) {
    return this.schedules.recordScheduleAttendance(...args);
  }

  createClassSchedule(
    ...args: Parameters<ClassesSchedulesService['createClassSchedule']>
  ) {
    return this.schedules.createClassSchedule(...args);
  }

  updateClassSchedule(
    ...args: Parameters<ClassesSchedulesService['updateClassSchedule']>
  ) {
    return this.schedules.updateClassSchedule(...args);
  }

  deleteClassSchedule(
    ...args: Parameters<ClassesSchedulesService['deleteClassSchedule']>
  ) {
    return this.schedules.deleteClassSchedule(...args);
  }

  getClassAssignments(
    ...args: Parameters<ClassesAssignmentsService['getClassAssignments']>
  ) {
    return this.assignments.getClassAssignments(...args);
  }

  createAssignment(
    ...args: Parameters<ClassesAssignmentsService['createAssignment']>
  ) {
    return this.assignments.createAssignment(...args);
  }

  getAssignmentSubmissions(
    ...args: Parameters<ClassesAssignmentsService['getAssignmentSubmissions']>
  ) {
    return this.assignments.getAssignmentSubmissions(...args);
  }

  submitAssignment(
    ...args: Parameters<ClassesAssignmentsService['submitAssignment']>
  ) {
    return this.assignments.submitAssignment(...args);
  }

  gradeAssignmentSubmission(
    ...args: Parameters<ClassesGradingService['gradeAssignmentSubmission']>
  ) {
    return this.grading.gradeAssignmentSubmission(...args);
  }

  getClassTests(...args: Parameters<ClassesExamsService['getClassTests']>) {
    return this.exams.getClassTests(...args);
  }

  createClassTest(...args: Parameters<ClassesExamsService['createClassTest']>) {
    return this.exams.createClassTest(...args);
  }

  getMyExamAttempts(
    ...args: Parameters<ClassesExamsService['getMyExamAttempts']>
  ) {
    return this.exams.getMyExamAttempts(...args);
  }

  startExamAttempt(
    ...args: Parameters<ClassesExamsService['startExamAttempt']>
  ) {
    return this.exams.startExamAttempt(...args);
  }

  upsertExamAnswers(
    ...args: Parameters<ClassesExamsService['upsertExamAnswers']>
  ) {
    return this.exams.upsertExamAnswers(...args);
  }

  submitExamAttempt(
    ...args: Parameters<ClassesExamsService['submitExamAttempt']>
  ) {
    return this.exams.submitExamAttempt(...args);
  }

  getExamAttemptDetail(
    ...args: Parameters<ClassesExamsService['getExamAttemptDetail']>
  ) {
    return this.exams.getExamAttemptDetail(...args);
  }

  getBlueprintTemplates(
    ...args: Parameters<ClassesExamsService['getBlueprintTemplates']>
  ) {
    return this.exams.getBlueprintTemplates(...args);
  }

  getBlueprintTemplateById(
    ...args: Parameters<ClassesExamsService['getBlueprintTemplateById']>
  ) {
    return this.exams.getBlueprintTemplateById(...args);
  }

  createBlueprintTemplate(
    ...args: Parameters<ClassesExamsService['createBlueprintTemplate']>
  ) {
    return this.exams.createBlueprintTemplate(...args);
  }

  updateBlueprintTemplate(
    ...args: Parameters<ClassesExamsService['updateBlueprintTemplate']>
  ) {
    return this.exams.updateBlueprintTemplate(...args);
  }

  deleteBlueprintTemplate(
    ...args: Parameters<ClassesExamsService['deleteBlueprintTemplate']>
  ) {
    return this.exams.deleteBlueprintTemplate(...args);
  }

  createBlueprintSection(
    ...args: Parameters<ClassesExamsService['createBlueprintSection']>
  ) {
    return this.exams.createBlueprintSection(...args);
  }

  updateBlueprintSection(
    ...args: Parameters<ClassesExamsService['updateBlueprintSection']>
  ) {
    return this.exams.updateBlueprintSection(...args);
  }

  deleteBlueprintSection(
    ...args: Parameters<ClassesExamsService['deleteBlueprintSection']>
  ) {
    return this.exams.deleteBlueprintSection(...args);
  }
}
