import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        classes: {
            id: string;
            name: string;
            status: string;
            branchId: string;
            courseId: string;
            teacherId: string | null;
            capacity: number;
            startDate: Date;
            endDate: Date;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
        level: string;
        durationWeeks: number;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__CourseClient<({
        classes: {
            id: string;
            name: string;
            status: string;
            branchId: string;
            courseId: string;
            teacherId: string | null;
            capacity: number;
            startDate: Date;
            endDate: Date;
        }[];
        coursePrerequisites: {
            id: string;
            courseId: string;
            prerequisiteId: string;
        }[];
        isPrerequisiteOf: {
            id: string;
            courseId: string;
            prerequisiteId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
        level: string;
        durationWeeks: number;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateCourseDto): import("@prisma/client").Prisma.Prisma__CourseClient<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        level: string;
        durationWeeks: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateCourseDto): import("@prisma/client").Prisma.Prisma__CourseClient<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        level: string;
        durationWeeks: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__CourseClient<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        level: string;
        durationWeeks: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
