import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): import("@prisma/client").Prisma.PrismaPromise<({
        userRoles: ({
            role: {
                id: string;
                name: string;
                description: string | null;
                status: string;
            };
        } & {
            roleId: string;
            userId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
    } & {
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
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        userRoles: ({
            role: {
                id: string;
                name: string;
                description: string | null;
                status: string;
            };
        } & {
            roleId: string;
            userId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
    } & {
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
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findByEmail(email: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        userRoles: ({
            role: {
                id: string;
                name: string;
                description: string | null;
                status: string;
            };
        } & {
            roleId: string;
            userId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
    } & {
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
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(createUserDto: CreateUserDto): Promise<{
        userRoles: ({
            role: {
                id: string;
                name: string;
                description: string | null;
                status: string;
            };
        } & {
            roleId: string;
            userId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
    } & {
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
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        userRoles: ({
            role: {
                id: string;
                name: string;
                description: string | null;
                status: string;
            };
        } & {
            roleId: string;
            userId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
    } & {
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
    }>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
