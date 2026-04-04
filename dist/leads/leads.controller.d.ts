import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    createLead(createLeadDto: CreateLeadDto): Promise<{
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
    findAllLeads(query: ListQueryDto): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
        } | null;
        email: string | null;
        phone: string;
        id: string;
        status: string;
        createdAt: Date;
        _count: {
            consultations: number;
            statusHistory: number;
        };
        name: string;
        source: string | null;
        score: number;
        owner: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        } | null;
    }[]>;
    findLeadsByOwner(ownerId: string, query: ListQueryDto): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
        } | null;
        email: string | null;
        phone: string;
        id: string;
        status: string;
        createdAt: Date;
        _count: {
            consultations: number;
            statusHistory: number;
        };
        name: string;
        source: string | null;
        score: number;
        owner: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        } | null;
    }[]>;
    findLeadsByStatus(status: string, query: ListQueryDto): Promise<{
        branch: {
            id: string;
            status: string;
            name: string;
        } | null;
        email: string | null;
        phone: string;
        id: string;
        status: string;
        createdAt: Date;
        _count: {
            consultations: number;
            statusHistory: number;
        };
        name: string;
        source: string | null;
        score: number;
        owner: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        } | null;
    }[]>;
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
            date: Date;
            leadId: string;
            outcome: string | null;
            followUpNote: string | null;
            followUpDate: Date | null;
            staffId: string | null;
        }[];
        _count: {
            consultations: number;
            statusHistory: number;
        };
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
            changedAt: Date;
            fromStatus: string;
            toStatus: string;
            changedBy: string | null;
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
    updateLead(id: string, updateLeadDto: UpdateLeadDto): Promise<{
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
    updateLeadStatus(id: string, body: {
        status: string;
    }): Promise<{
        statusHistory: {
            id: string;
            note: string | null;
            changedAt: Date;
            fromStatus: string;
            toStatus: string;
            changedBy: string | null;
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
    logConsultation(leadId: string, createConsultationDto: CreateConsultationDto): Promise<{
        id: string;
        status: string;
        date: Date;
        leadId: string;
        outcome: string | null;
        followUpNote: string | null;
        followUpDate: Date | null;
        staffId: string | null;
    }>;
    findLeadConsultations(leadId: string): Promise<{
        id: string;
        status: string;
        date: Date;
        leadId: string;
        outcome: string | null;
        followUpNote: string | null;
        followUpDate: Date | null;
        staffId: string | null;
    }[]>;
    getLeadStatusHistory(leadId: string): Promise<{
        id: string;
        note: string | null;
        changedAt: Date;
        fromStatus: string;
        toStatus: string;
        changedBy: string | null;
        leadId: string;
    }[]>;
}
