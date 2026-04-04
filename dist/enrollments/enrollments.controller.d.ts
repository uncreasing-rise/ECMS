import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    findAll(query: PaginationQueryDto): import("@prisma/client").Prisma.PrismaPromise<{
        class: {
            id: string;
            status: string;
            name: string;
            startDate: Date;
            endDate: Date;
        };
        id: string;
        status: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
        student: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
            status: string;
        };
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__EnrollmentClient<({
        class: {
            id: string;
            status: string;
            name: string;
            capacity: number;
            startDate: Date;
            endDate: Date;
        };
        student: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
            accountType: string;
            status: string;
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
            branchId: string;
            status: string;
            name: string;
            courseId: string;
            teacherId: string | null;
            capacity: number;
            startDate: Date;
            endDate: Date;
        };
        student: {
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
