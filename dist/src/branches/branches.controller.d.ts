import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        parentBranch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        childBranches: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        }[];
    } & {
        id: string;
        name: string;
        status: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__BranchClient<({
        users: {
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
        }[];
        parentBranch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        childBranches: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        }[];
    } & {
        id: string;
        name: string;
        status: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    create(dto: CreateBranchDto): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        name: string;
        status: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateBranchDto): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        name: string;
        status: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        name: string;
        status: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
