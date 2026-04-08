import { describe, expect, it, jest } from '@jest/globals';
import { ClassesController } from './classes.controller';

describe('ClassesController', () => {
  const classesService = {
    getClassCalendar: jest.fn(),
  };

  const controller = new ClassesController(classesService as never);

  it('getCalendar delegates range and filters', async () => {
    await controller.getCalendar(
      { id: 'u1' } as never,
      'week',
      new Date('2026-04-06'),
      new Date('2026-04-06T00:00:00.000Z'),
      new Date('2026-04-12T23:59:59.999Z'),
      'class-1',
      'teacher-1',
      'room-1',
    );

    expect(classesService.getClassCalendar).toHaveBeenCalledWith({
      actorId: 'u1',
      view: 'week',
      date: new Date('2026-04-06'),
      from: new Date('2026-04-06T00:00:00.000Z'),
      to: new Date('2026-04-12T23:59:59.999Z'),
      classId: 'class-1',
      teacherId: 'teacher-1',
      roomId: 'room-1',
    });
  });
});
