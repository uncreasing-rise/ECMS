import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        enrollments: {
            id: string;
            status: string;
            classId: string;
            studentId: string;
            enrolledAt: Date;
        }[];
        teacher: {
            id: string;
            status: string;
            email: string;
            firstName: string;
            lastName: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            phone: string | null;
            branchId: string | null;
            accountType: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        } | null;
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        course: {
            id: string;
            name: string;
            description: string | null;
            status: string;
            level: string;
            durationWeeks: number;
        };
    } & {
        id: string;
        name: string;
        status: string;
        branchId: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__ClassClient<({
        enrollments: {
            id: string;
            status: string;
            classId: string;
            studentId: string;
            enrolledAt: Date;
        }[];
        teacher: {
            id: string;
            status: string;
            email: string;
            firstName: string;
            lastName: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            phone: string | null;
            branchId: string | null;
            accountType: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        } | null;
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        };
        course: {
            id: string;
            name: string;
            description: string | null;
            status: string;
            level: string;
            durationWeeks: number;
        };
        assignments: {
            id: string;
            description: string | null;
            classId: string;
            title: string;
            dueDate: Date;
            maxScore: number;
        }[];
    } & {
        id: string;
        name: string;
        status: string;
        branchId: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateClassDto): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        name: string;
        status: string;
        branchId: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateClassDto): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        name: string;
        status: string;
        branchId: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__ClassClient<{
        id: string;
        name: string;
        status: string;
        branchId: string;
        courseId: string;
        teacherId: string | null;
        capacity: number;
        startDate: Date;
        endDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
