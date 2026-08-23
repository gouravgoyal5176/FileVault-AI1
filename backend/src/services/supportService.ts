import { prisma } from '../config/db';
import { TicketCategory, TicketStatus, Role } from '@prisma/client';

export async function createSupportTicket(
  userId: string,
  subject: string,
  category: TicketCategory,
  description: string,
  ipAddress: string,
  userAgent: string
) {
  if (!subject || subject.trim().length === 0) {
    throw { statusCode: 400, message: 'Support ticket subject is required.' };
  }
  if (!description || description.trim().length === 0) {
    throw { statusCode: 400, message: 'Support ticket description is required.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: subject.trim(),
      category,
      description: description.trim(),
      status: TicketStatus.OPEN,
    },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'SUPPORT_TICKET_CREATED',
      resourceId: ticket.id,
      ipAddress,
      userAgent,
      metadata: { subject: ticket.subject, category: ticket.category },
    },
  });

  return ticket;
}

export async function getUserSupportTickets(userId: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });

  return tickets;
}

export async function getAdminSupportTickets(params: {
  search?: string;
  status?: TicketStatus;
  category?: TicketCategory;
  page?: number;
  limit?: number;
}) {
  const safeLimit = Math.max(1, Math.min(50, params.limit || 20));
  const safePage = Math.max(1, params.page || 1);
  const skip = (safePage - 1) * safeLimit;

  const whereClause: any = {};
  const AND: any[] = [];

  if (params.search && params.search.trim().length > 0) {
    const term = params.search.trim();
    AND.push({
      OR: [
        { subject: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { id: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ],
    });
  }

  if (params.status) {
    AND.push({ status: params.status });
  }

  if (params.category) {
    AND.push({ category: params.category });
  }

  if (AND.length > 0) {
    whereClause.AND = AND;
  }

  const [tickets, totalCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    }),
    prisma.supportTicket.count({ where: whereClause }),
  ]);

  return {
    tickets,
    totalCount,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(totalCount / safeLimit),
  };
}

export async function updateSupportTicketStatus(
  adminUserId: string,
  ticketId: string,
  newStatus: TicketStatus,
  ipAddress: string,
  userAgent: string
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw { statusCode: 404, message: 'Support ticket not found.' };
  }

  const updatedTicket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: newStatus },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminUserId,
      actionType: 'SUPPORT_TICKET_STATUS_UPDATED',
      resourceId: ticketId,
      ipAddress,
      userAgent,
      metadata: { previousStatus: ticket.status, newStatus },
    },
  });

  return updatedTicket;
}
