import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        parentBranch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        childBranches: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__BranchClient<({
        parentBranch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        childBranches: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        }[];
        users: {
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
        }[];
    } & {
        id: string;
        status: string;
        name: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateBranchDto): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        status: string;
        name: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateBranchDto): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        status: string;
        name: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        status: string;
        name: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
