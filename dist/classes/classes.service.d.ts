import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
export declare class ClassesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
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
            classId: string;
            studentId: string;
            enrolledAt: Date;
        }[];
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            id: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            branchId: string | null;
            accountType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        } | null;
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
    })[]>;
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
            classId: string;
            studentId: string;
            enrolledAt: Date;
        }[];
        teacher: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            id: string;
            passwordHash: string | null;
            emailVerifiedAt: Date | null;
            branchId: string | null;
            accountType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        } | null;
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
