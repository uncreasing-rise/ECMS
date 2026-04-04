import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(data: {
    name: string;
    phone: string;
    email?: string;
    source?: string;
    status: string;
    score?: number;
    ownerId?: string;
    branchId?: string;
  }) {
    return this.prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
        status: data.status,
        score: data.score || 0,
        ownerId: data.ownerId,
        branchId: data.branchId,
      },
      include: { branch: true, owner: true },
    });
  }

  async findAllLeads(page = 1, limit = 10, detail = false) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.lead.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: true,
          owner: true,
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 20,
          },
          consultations: {
            orderBy: { date: 'desc' },
            take: 20,
          },
          _count: {
            select: {
              consultations: true,
              statusHistory: true,
            },
          },
        },
      });
    }

    return this.prisma.lead.findMany({
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        status: true,
        score: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            consultations: true,
            statusHistory: true,
          },
        },
      },
    });
  }

  async findLeadById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        branch: true,
        owner: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 100,
        },
        consultations: {
          orderBy: { date: 'desc' },
          take: 100,
        },
        _count: {
          select: {
            statusHistory: true,
            consultations: true,
          },
        },
      },
    });
  }

  async findLeadsByOwner(ownerId: string, page = 1, limit = 10, detail = false) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.lead.findMany({
        where: { ownerId },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: true,
          owner: true,
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 20,
          },
          consultations: {
            orderBy: { date: 'desc' },
            take: 20,
          },
          _count: { select: { consultations: true, statusHistory: true } },
        },
      });
    }

    return this.prisma.lead.findMany({
      where: { ownerId },
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        status: true,
        score: true,
        createdAt: true,
        branch: { select: { id: true, name: true, status: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { consultations: true, statusHistory: true } },
      },
    });
  }

  async findLeadsByStatus(status: string, page = 1, limit = 10, detail = false) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    if (detail) {
      return this.prisma.lead.findMany({
        where: { status },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: true,
          owner: true,
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 20,
          },
          consultations: {
            orderBy: { date: 'desc' },
            take: 20,
          },
          _count: { select: { consultations: true, statusHistory: true } },
        },
      });
    }

    return this.prisma.lead.findMany({
      where: { status },
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        status: true,
        score: true,
        createdAt: true,
        branch: { select: { id: true, name: true, status: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { consultations: true, statusHistory: true } },
      },
    });
  }

  async updateLead(id: string, data: any) {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: { branch: true, owner: true },
    });
  }

  async updateLeadStatus(id: string, status: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new Error('Lead not found');

    await this.prisma.leadStatusHistory.create({
      data: {
        leadId: id,
        fromStatus: lead.status,
        toStatus: status,
      },
    });

    return this.prisma.lead.update({
      where: { id },
      data: { status },
      include: { statusHistory: true },
    });
  }

  async logConsultation(data: {
    leadId: string;
    staffId?: string;
    date: Date;
    outcome?: string;
    followUpNote?: string;
    followUpDate?: Date;
    status?: string;
  }) {
    return this.prisma.consultation.create({
      data: {
        leadId: data.leadId,
        staffId: data.staffId,
        date: data.date,
        outcome: data.outcome,
        followUpNote: data.followUpNote,
        followUpDate: data.followUpDate,
        status: data.status || 'pending',
      },
    });
  }

  async findLeadConsultations(leadId: string) {
    return this.prisma.consultation.findMany({
      where: { leadId },
      orderBy: { date: 'desc' },
    });
  }

  async getLeadStatusHistory(leadId: string) {
    return this.prisma.leadStatusHistory.findMany({
      where: { leadId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
