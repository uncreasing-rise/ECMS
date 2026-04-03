import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
export declare class EnrollmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        class: {
            id: string;
            name: string;
            status: string;
            branchId: string;
            courseId: string;
            teacherId: string | null;
            capacity: number;
            startDate: Date;
            endDate: Date;
        };
        student: {
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
        };
    } & {
        id: string;
        status: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__EnrollmentClient<({
        class: {
            id: string;
            name: string;
            status: string;
            branchId: string;
            courseId: string;
            teacherId: string | null;
            capacity: number;
            startDate: Date;
            endDate: Date;
        };
        student: {
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
        };
    } & {
        id: string;
        status: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateEnrollmentDto): import("@prisma/client").Prisma.Prisma__EnrollmentClient<{
        class: {
            id: string;
            name: string;
            status: string;
            branchId: string;
            courseId: string;
            teacherId: string | null;
            capacity: number;
            startDate: Date;
            endDate: Date;
        };
        student: {
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
        };
    } & {
        id: string;
        status: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateEnrollmentDto): import("@prisma/client").Prisma.Prisma__EnrollmentClient<{
        id: string;
        status: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__EnrollmentClient<{
        id: string;
        status: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
