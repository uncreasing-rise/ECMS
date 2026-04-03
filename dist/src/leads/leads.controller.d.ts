import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    createLead(createLeadDto: CreateLeadDto): Promise<{
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
    findAllLeads(query: PaginationQueryDto): Promise<({
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
    findLeadsByOwner(ownerId: string, query: PaginationQueryDto): Promise<({
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
    findLeadsByStatus(status: string, query: PaginationQueryDto): Promise<({
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
    updateLead(id: string, updateLeadDto: UpdateLeadDto): Promise<{
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
    updateLeadStatus(id: string, body: {
        status: string;
    }): Promise<{
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
    logConsultation(leadId: string, createConsultationDto: CreateConsultationDto): Promise<{
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
