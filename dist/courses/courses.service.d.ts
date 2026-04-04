import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
export declare class CoursesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, detail?: boolean): import("@prisma/client").Prisma.PrismaPromise<({
        _count: {
            classes: number;
        };
        classes: {
            id: string;
            status: string;
            name: string;
            capacity: number;
            startDate: Date;
            endDate: Date;
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        description: string | null;
        level: string;
        durationWeeks: number;
    })[]> | import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        status: string;
        _count: {
            classes: number;
            coursePrerequisites: number;
            isPrerequisiteOf: number;
        };
        name: string;
        level: string;
        durationWeeks: number;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__CourseClient<({
        _count: {
            classes: number;
        };
        classes: {
            id: string;
            status: string;
            name: string;
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
        status: string;
        name: string;
        description: string | null;
        level: string;
        durationWeeks: number;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateCourseDto): import("@prisma/client").Prisma.Prisma__CourseClient<{
        id: string;
        status: string;
        name: string;
        description: string | null;
        level: string;
        durationWeeks: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateCourseDto): import("@prisma/client").Prisma.Prisma__CourseClient<{
        id: string;
        status: string;
        name: string;
        description: string | null;
        level: string;
        durationWeeks: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__CourseClient<{
        id: string;
        status: string;
        name: string;
        description: string | null;
        level: string;
        durationWeeks: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
