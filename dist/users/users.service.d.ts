import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): import("@prisma/client").Prisma.PrismaPromise<{
        branch: {
            id: string;
            status: string;
            name: string;
        } | null;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        id: string;
        branchId: string | null;
        accountType: string;
        status: string;
        createdAt: Date;
        userRoles: {
            role: {
                id: string;
                name: string;
            };
        }[];
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        id: string;
        emailVerifiedAt: Date | null;
        branchId: string | null;
        accountType: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userRoles: {
            role: {
                id: string;
                status: string;
                name: string;
                description: string | null;
            };
            assignedAt: Date;
        }[];
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findByEmail(email: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        userRoles: ({
            role: {
                id: string;
                status: string;
                name: string;
                description: string | null;
            };
        } & {
            userId: string;
            roleId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
    } & {
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
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(createUserDto: CreateUserDto): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        userRoles: ({
            role: {
                id: string;
                status: string;
                name: string;
                description: string | null;
            };
        } & {
            userId: string;
            roleId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
    } & {
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
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        userRoles: ({
            role: {
                id: string;
                status: string;
                name: string;
                description: string | null;
            };
        } & {
            userId: string;
            roleId: string;
            assignedAt: Date;
            revokedAt: Date | null;
        })[];
    } & {
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
    }>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
