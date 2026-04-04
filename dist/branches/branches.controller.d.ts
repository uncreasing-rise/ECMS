import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    findAll(query: ListQueryDto): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        status: string;
        _count: {
            childBranches: number;
            users: number;
            classes: number;
            leads: number;
        };
        name: string;
        location: string | null;
        parentBranchId: string | null;
        timezone: string | null;
        currency: string | null;
        parentBranch: {
            id: string;
            status: string;
            name: string;
        } | null;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__BranchClient<({
        _count: {
            childBranches: number;
            users: number;
            classes: number;
            leads: number;
        };
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
        }[];
        users: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
            accountType: string;
            status: string;
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
