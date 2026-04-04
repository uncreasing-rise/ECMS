import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    findAll(query: ListQueryDto): import("@prisma/client").Prisma.PrismaPromise<{
        branch: {
            id: string;
            status: string;
            name: string;
        };
        course: {
            id: string;
            name: string;
            level: string;
        };
        id: string;
        branchId: string;
        status: string;
        _count: {
            enrollments: number;
            assignments: number;
        };
        name: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        } | null;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__ClassClient<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        course: {
            id: string;
            status: string;
            name: string;
            description: string | null;
            level: string;
            durationWeeks: number;
        };
        enrollments: {
            id: string;
            status: string;
            enrolledAt: Date;
            student: {
                email: string;
                firstName: string;
                lastName: string;
                id: string;
            };
        }[];
        _count: {
            enrollments: number;
            assignments: number;
        };
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
            status: string;
        } | null;
        assignments: {
            id: string;
            title: string;
            dueDate: Date;
            maxScore: number;
        }[];
    } & {
        id: string;
        branchId: string;
        status: string;
        name: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateClassDto): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        branchId: string;
        status: string;
        name: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateClassDto): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        branchId: string;
        status: string;
        name: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        branchId: string;
        status: string;
        name: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
