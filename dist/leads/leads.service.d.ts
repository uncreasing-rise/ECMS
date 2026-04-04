import { PrismaService } from '../prisma/prisma.service';
export declare class LeadsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createLead(data: {
        name: string;
        phone: string;
        email?: string;
        source?: string;
        status: string;
        score?: number;
        ownerId?: string;
        branchId?: string;
    }): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    }>;
    findAllLeads(page?: number, limit?: number): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    })[]>;
    findLeadById(id: string): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        consultations: {
            id: string;
            status: string;
            leadId: string;
            date: Date;
            outcome: string | null;
            followUpNote: string | null;
            followUpDate: Date | null;
            staffId: string | null;
        }[];
        owner: {
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
        statusHistory: {
            id: string;
            note: string | null;
            fromStatus: string;
            toStatus: string;
            changedBy: string | null;
            changedAt: Date;
            leadId: string;
        }[];
    } & {
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    }) | null>;
    findLeadsByOwner(ownerId: string, page?: number, limit?: number): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    })[]>;
    findLeadsByStatus(status: string, page?: number, limit?: number): Promise<({
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    })[]>;
    updateLead(id: string, data: any): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    }>;
    updateLeadStatus(id: string, status: string): Promise<{
        statusHistory: {
            id: string;
            note: string | null;
            fromStatus: string;
            toStatus: string;
            changedBy: string | null;
            changedAt: Date;
            leadId: string;
        }[];
    } & {
        email: string | null;
        phone: string;
        id: string;
        branchId: string | null;
        status: string;
        createdAt: Date;
        name: string;
        source: string | null;
        score: number;
        ownerId: string | null;
    }>;
    logConsultation(data: {
        leadId: string;
        staffId?: string;
        date: Date;
        outcome?: string;
        followUpNote?: string;
        followUpDate?: Date;
        status?: string;
    }): Promise<{
        id: string;
        status: string;
        leadId: string;
        date: Date;
        outcome: string | null;
        followUpNote: string | null;
        followUpDate: Date | null;
        staffId: string | null;
    }>;
    findLeadConsultations(leadId: string): Promise<{
        id: string;
        status: string;
        leadId: string;
        date: Date;
        outcome: string | null;
        followUpNote: string | null;
        followUpDate: Date | null;
        staffId: string | null;
    }[]>;
    getLeadStatusHistory(leadId: string): Promise<{
        id: string;
        note: string | null;
        fromStatus: string;
        toStatus: string;
        changedBy: string | null;
        changedAt: Date;
        leadId: string;
    }[]>;
}
