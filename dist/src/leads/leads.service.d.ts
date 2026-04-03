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
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
    } & {
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
        source: string | null;
        score: number;
        ownerId: string | null;
    }>;
    findAllLeads(page?: number, limit?: number): Promise<({
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
    } & {
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
        source: string | null;
        score: number;
        ownerId: string | null;
    })[]>;
    findLeadById(id: string): Promise<({
        branch: {
            id: string;
            name: string;
            status: string;
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
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
        source: string | null;
        score: number;
        ownerId: string | null;
    }) | null>;
    findLeadsByOwner(ownerId: string, page?: number, limit?: number): Promise<({
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
    } & {
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
        source: string | null;
        score: number;
        ownerId: string | null;
    })[]>;
    findLeadsByStatus(status: string, page?: number, limit?: number): Promise<({
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
    } & {
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
        source: string | null;
        score: number;
        ownerId: string | null;
    })[]>;
    updateLead(id: string, data: any): Promise<{
        branch: {
            id: string;
            name: string;
            status: string;
            location: string | null;
            parentBranchId: string | null;
            timezone: string | null;
            currency: string | null;
        } | null;
        owner: {
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
    } & {
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
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
        id: string;
        name: string;
        status: string;
        email: string | null;
        phone: string;
        branchId: string | null;
        createdAt: Date;
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
