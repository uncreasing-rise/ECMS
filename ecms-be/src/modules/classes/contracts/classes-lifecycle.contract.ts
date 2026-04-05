export interface GetClassesParams {
  actorId: string;
  search?: string;
  courseId?: string;
  teacherId?: string;
  status?: string;
  skip: number;
  take: number;
}

export interface GetClassStudentsParams {
  classId: string;
  actorId: string;
  status?: string;
  skip: number;
  take: number;
}
