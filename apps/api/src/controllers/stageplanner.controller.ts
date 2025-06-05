import { Request, Response } from 'express';
import { PrismaClient, EventType, TeamType, EventStatus, AssignmentStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupération de tous les événements avec filtres
 * @route GET /api/stageplanner/events
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      locationId, 
      page = 1, 
      limit = 10,
      sortBy = 'startDate', // Default sort field
      sortOrder = 'asc'   // Default sort order
    } = req.query;
    
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({
        status: 'error',
        message: 'Tenant ID et Organization ID requis'
      });
      return;
    }

    const filters: Prisma.EventWhereInput = {
      organization: {
        tenantId,
        id: organizationId
      },
      eventType: EventType.STAGE_EVENT
    };

    if (startDate) {
      filters.startDate = {
        gte: new Date(startDate as string)
      };
    }

    if (endDate) {
      filters.endDate = {
        lte: new Date(endDate as string)
      };
    }

    if (status) {
      filters.status = status as EventStatus;
    }

    if (locationId) {
      filters.locationId = locationId as string;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orderBy: Prisma.EventOrderByWithRelationInput = {};
    if (typeof sortBy === 'string' && (sortOrder === 'asc' || sortOrder === 'desc')) {
        orderBy[sortBy] = sortOrder;
    }


    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: filters,
        include: {
          location: true,
          eventAssignments: {
            select: { _count: true } // More efficient if only count is needed
          },
          technicalDetails: true
        },
        skip,
        take: Number(limit),
        orderBy
      }),
      prisma.event.count({
        where: filters
      })
    ]);

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      location: event.location ? {
        id: event.location.id,
        name: event.location.name,
        address: event.location.address // Assuming address is a field
      } : null,
      technicalDetails: event.technicalDetails,
      // assignmentsCount: event.eventAssignments.length // If full assignments needed, change include
      assignmentsCount: (event.eventAssignments as any)?._count?.select || 0 // Adjust if using _count
    }));

    res.status(200).json({
      status: 'success',
      data: {
        events: formattedEvents,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des événements'
    });
  }
};

/**
 * Récupération d'un événement par ID
 * @route GET /api/stageplanner/events/:id
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({
        status: 'error',
        message: 'Tenant ID et Organization ID requis'
      });
      return;
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        organization: {
          tenantId,
          id: organizationId
        },
        eventType: EventType.STAGE_EVENT
      },
      include: {
        location: true,
        eventAssignments: {
          include: {
            user: {
              include: {
                profile: true
              }
            },
            role: true
          }
        },
        technicalDetails: true,
        createdBy: {
          include: {
            profile: true
          }
        },
        updatedBy: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({
        status: 'error',
        message: 'Événement non trouvé'
      });
      return;
    }

    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      location: event.location ? {
        id: event.location.id,
        name: event.location.name,
        address: event.location.address
      } : null,
      technicalDetails: event.technicalDetails,
      assignments: event.eventAssignments.map(assignment => ({
        id: assignment.id,
        user: {
          id: assignment.user.id,
          email: assignment.user.email,
          firstName: assignment.user.profile?.firstName,
          lastName: assignment.user.profile?.lastName,
          avatarUrl: assignment.user.profile?.avatarUrl
        },
        role: assignment.role ? {
          id: assignment.role.id,
          name: assignment.role.name
        } : null,
        status: assignment.status,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        hourlyRate: assignment.hourlyRate,
        notes: assignment.notes
      })),
      createdBy: event.createdBy && event.createdBy.profile ? {
        id: event.createdBy.id,
        firstName: event.createdBy.profile.firstName,
        lastName: event.createdBy.profile.lastName
      } : null,
      updatedBy: event.updatedBy && event.updatedBy.profile ? {
        id: event.updatedBy.id,
        firstName: event.updatedBy.profile.firstName,
        lastName: event.updatedBy.profile.lastName
      } : null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    res.status(200).json({
      status: 'success',
      data: {
        event: formattedEvent
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de l\'événement'
    });
  }
};

/**
 * Création d'un nouvel événement
 * @route POST /api/stageplanner/events
 */
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      locationId,
      technicalDetails // Expects Prisma.TechnicalDetailsCreateWithoutEventInput
    } = req.body;
    
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;
    const userId = req.user?.id;

    if (!tenantId || !organizationId || !userId) {
      res.status(400).json({
        status: 'error',
        message: 'Tenant ID, Organization ID et User ID requis'
      });
      return;
    }

    if (locationId) {
      const location = await prisma.location.findFirst({
        where: { id: locationId as string, organizationId }
      });
      if (!location) {
        res.status(400).json({ status: 'error', message: 'Emplacement non trouvé' });
        return;
      }
    }
    
    const eventData: Prisma.EventCreateInput = {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: EventStatus.DRAFT,
      eventType: EventType.STAGE_EVENT,
      organization: { connect: { id: organizationId } },
      createdBy: { connect: { id: userId } },
    };

    if (locationId) {
      eventData.location = { connect: { id: locationId as string } };
    }

    if (technicalDetails) {
      eventData.technicalDetails = { create: technicalDetails as Prisma.TechnicalDetailsCreateWithoutEventInput };
    }

    const event = await prisma.event.create({
      data: eventData,
      include: {
        location: true,
        technicalDetails: true
      }
    });

    console.info(`Nouvel événement créé: ${title} (${event.id})`);

    res.status(201).json({
      status: 'success',
      message: 'Événement créé avec succès',
      data: {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          status: event.status,
          location: event.location ? {
            id: event.location.id,
            name: event.location.name
          } : null,
          technicalDetails: event.technicalDetails
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'événement'
    });
  }
};

/**
 * Mise à jour d'un événement
 * @route PUT /api/stageplanner/events/:id
 */
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      locationId, // Can be string (UUID) or null to disconnect
      status, // EventStatus
      technicalDetails // Prisma.TechnicalDetailsUpdateInput or Prisma.TechnicalDetailsCreateInput
    } = req.body;
    
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;
    const userId = req.user?.id;

    if (!tenantId || !organizationId || !userId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID, Organization ID et User ID requis' });
      return;
    }

    const existingEvent = await prisma.event.findFirst({
      where: { id, organization: { tenantId, id: organizationId }, eventType: EventType.STAGE_EVENT },
      include: { technicalDetails: true }
    });

    if (!existingEvent) {
      res.status(404).json({ status: 'error', message: 'Événement non trouvé' });
      return;
    }

    if (existingEvent.status === EventStatus.COMPLETED || existingEvent.status === EventStatus.CANCELLED) {
      res.status(400).json({ status: 'error', message: 'Impossible de modifier un événement terminé ou annulé' });
      return;
    }

    if (locationId !== undefined) { // Check if locationId is part of the request
        if (locationId === null) { // Disconnect location
            // Ensure locationId is nullable in your schema or handle appropriately
        } else {
            const location = await prisma.location.findFirst({
                where: { id: locationId as string, organizationId }
            });
            if (!location) {
                res.status(400).json({ status: 'error', message: 'Emplacement non trouvé pour la mise à jour' });
                return;
            }
        }
    }

    const eventUpdateData: Prisma.EventUpdateInput = {
      updatedById: userId,
      updatedAt: new Date()
    };
    if (title !== undefined) eventUpdateData.title = title;
    if (description !== undefined) eventUpdateData.description = description;
    if (startDate !== undefined) eventUpdateData.startDate = new Date(startDate);
    if (endDate !== undefined) eventUpdateData.endDate = new Date(endDate);
    if (status !== undefined) eventUpdateData.status = status as EventStatus;
    
    if (locationId !== undefined) {
        eventUpdateData.location = locationId === null ? { disconnect: true } : { connect: { id: locationId as string }};
    }


    const updatedEvent = await prisma.event.update({
      where: { id },
      data: eventUpdateData,
      include: { location: true }
    });

    if (technicalDetails) {
      const { id: _tdId, eventId: _tdEventId, createdAt: _tdCreatedAt, updatedAt: _tdUpdatedAt, ...technicalDetailsData } = technicalDetails as any;
      if (existingEvent.technicalDetails) {
        await prisma.technicalDetails.update({
          where: { id: existingEvent.technicalDetails.id! },
          data: technicalDetailsData
        });
      } else {
        await prisma.technicalDetails.create({
          data: { ...technicalDetailsData, eventId: id }
        });
      }
    }
    
    // Refetch with technicalDetails for response
    const finalEvent = await prisma.event.findUnique({
        where: { id },
        include: { location: true, technicalDetails: true }
    });


    console.info(`Événement mis à jour: ${finalEvent?.title} (${id})`);

    res.status(200).json({
      status: 'success',
      message: 'Événement mis à jour avec succès',
      data: {
        event: {
          id: finalEvent?.id,
          title: finalEvent?.title,
          description: finalEvent?.description,
          startDate: finalEvent?.startDate,
          endDate: finalEvent?.endDate,
          status: finalEvent?.status,
          location: finalEvent?.location ? {
            id: finalEvent.location.id,
            name: finalEvent.location.name
          } : null,
          technicalDetails: finalEvent?.technicalDetails
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour de l\'événement'
    });
  }
};

/**
 * Suppression d'un événement
 * @route DELETE /api/stageplanner/events/:id
 */
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    const event = await prisma.event.findFirst({
      where: { id, organization: { tenantId, id: organizationId }, eventType: EventType.STAGE_EVENT }
    });

    if (!event) {
      res.status(404).json({ status: 'error', message: 'Événement non trouvé' });
      return;
    }

    // Prisma schema should define onDelete: Cascade for related models like TechnicalDetails and EventAssignment
    // If not, manual deletion is needed as in the original code.
    // Assuming cascade delete is set for simplicity here, otherwise re-add transaction.
    await prisma.event.delete({ where: { id } });

    console.info(`Événement supprimé: ${event.title} (${id})`);

    res.status(200).json({
      status: 'success',
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de l\'événement'
    });
  }
};

/**
 * Publication d'un événement
 * @route POST /api/stageplanner/events/:id/publish
 */
export const publishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;
    const userId = req.user?.id;

    if (!tenantId || !organizationId || !userId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID, Organization ID et User ID requis' });
      return;
    }

    const event = await prisma.event.findFirst({
      where: { id, organization: { tenantId, id: organizationId }, eventType: EventType.STAGE_EVENT }
    });

    if (!event) {
      res.status(404).json({ status: 'error', message: 'Événement non trouvé' });
      return;
    }

    if (event.status !== EventStatus.DRAFT) {
      res.status(400).json({ status: 'error', message: 'Seuls les événements en brouillon peuvent être publiés' });
      return;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED, updatedById: userId, updatedAt: new Date() }
    });

    console.info(`Événement publié: ${event.title} (${id})`);

    res.status(200).json({
      status: 'success',
      message: 'Événement publié avec succès',
      data: {
        event: {
          id: updatedEvent.id,
          title: updatedEvent.title,
          status: updatedEvent.status
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la publication de l\'événement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la publication de l\'événement'
    });
  }
};

/**
 * Annulation d'un événement
 * @route POST /api/stageplanner/events/:id/cancel
 */
export const cancelEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;
    const userId = req.user?.id;

    if (!tenantId || !organizationId || !userId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID, Organization ID et User ID requis' });
      return;
    }

    const event = await prisma.event.findFirst({
      where: { id, organization: { tenantId, id: organizationId }, eventType: EventType.STAGE_EVENT },
      include: { eventAssignments: true }
    });

    if (!event) {
      res.status(404).json({ status: 'error', message: 'Événement non trouvé' });
      return;
    }

    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      res.status(400).json({ status: 'error', message: 'Impossible d\'annuler un événement déjà terminé ou annulé' });
      return;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.CANCELLED,
        notes: reason ? (event.notes ? `${event.notes}\n\nMotif d'annulation: ${reason}` : `Motif d'annulation: ${reason}`) : event.notes,
        updatedById: userId,
        updatedAt: new Date()
      }
    });

    if (event.eventAssignments.length > 0) {
      await prisma.eventAssignment.updateMany({
        where: { eventId: id },
        data: { status: AssignmentStatus.CANCELLED, updatedAt: new Date() }
      });
    }

    console.info(`Événement annulé: ${event.title} (${id})`);

    res.status(200).json({
      status: 'success',
      message: 'Événement annulé avec succès',
      data: {
        event: {
          id: updatedEvent.id,
          title: updatedEvent.title,
          status: updatedEvent.status
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'événement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'annulation de l\'événement'
    });
  }
};

/**
 * Récupération des équipes techniques
 * @route GET /api/stageplanner/technical-teams
 */
export const getTechnicalTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    const filters: Prisma.TeamWhereInput = {
      organization: { tenantId, id: organizationId }
    };

    if (type) {
      filters.type = type as TeamType;
    }

    const teams = await prisma.team.findMany({
      where: filters,
      include: {
        members: { include: { user: { include: { profile: true } } } },
        manager: { include: { profile: true } }
      }
    });

    const formattedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      type: team.type,
      manager: team.manager && team.manager.profile ? {
        id: team.manager.id,
        firstName: team.manager.profile.firstName,
        lastName: team.manager.profile.lastName,
        email: team.manager.email
      } : null,
      members: team.members.map(member => ({
        id: member.user.id,
        firstName: member.user.profile?.firstName,
        lastName: member.user.profile?.lastName,
        email: member.user.email,
        role: member.role
      })),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      data: { teams: formattedTeams }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes techniques:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des équipes techniques'
    });
  }
};

/**
 * Récupération d'une équipe technique par ID
 * @route GET /api/stageplanner/technical-teams/:id
 */
export const getTechnicalTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    const team = await prisma.team.findFirst({
      where: { id, organization: { tenantId, id: organizationId } },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        manager: { include: { profile: true } }
      }
    });

    if (!team) {
      res.status(404).json({ status: 'error', message: 'Équipe technique non trouvée' });
      return;
    }

    const formattedTeam = {
      id: team.id,
      name: team.name,
      description: team.description,
      type: team.type,
      manager: team.manager && team.manager.profile ? {
        id: team.manager.id,
        firstName: team.manager.profile.firstName,
        lastName: team.manager.profile.lastName,
        email: team.manager.email,
        avatarUrl: team.manager.profile.avatarUrl
      } : null,
      members: team.members.map(member => ({
        id: member.user.id,
        firstName: member.user.profile?.firstName,
        lastName: member.user.profile?.lastName,
        email: member.user.email,
        avatarUrl: member.user.profile?.avatarUrl,
        role: member.role,
        specialty: member.specialty,
        joinedAt: member.joinedAt
      })),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };

    res.status(200).json({
      status: 'success',
      data: { team: formattedTeam }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'équipe technique:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de l\'équipe technique'
    });
  }
};

/**
 * Création d'une équipe technique
 * @route POST /api/stageplanner/technical-teams
 */
export const createTechnicalTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      type, // Expects TeamType string
      managerId,
      members // Array of { userId: string, role?: string, specialty?: string }
    } = req.body;
    
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;
    const userId = req.user?.id; // creator

    if (!tenantId || !organizationId || !userId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID, Organization ID et User ID requis' });
      return;
    }

    if (managerId) {
      const manager = await prisma.user.findFirst({ where: { id: managerId as string, organizationId } });
      if (!manager) {
        res.status(400).json({ status: 'error', message: 'Manager non trouvé' });
        return;
      }
    }

    const teamData: Prisma.TeamCreateInput = {
      name,
      description,
      type: type as TeamType,
      organization: { connect: { id: organizationId } },
      createdBy: { connect: { id: userId } },
    };
    if (managerId) {
      teamData.manager = { connect: { id: managerId as string } };
    }

    const team = await prisma.team.create({ data: teamData });

    if (members && Array.isArray(members) && members.length > 0) {
      for (const memberData of members as Array<{ userId: string, role?: string, specialty?: string }>) {
        const user = await prisma.user.findFirst({ where: { id: memberData.userId, organizationId } });
        if (user) {
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: memberData.userId,
              role: memberData.role,
              specialty: memberData.specialty
            }
          });
        }
      }
    }

    const createdTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        manager: { include: { profile: true } }
      }
    });

    console.info(`Nouvelle équipe technique créée: ${name} (${team.id})`);

    res.status(201).json({
      status: 'success',
      message: 'Équipe technique créée avec succès',
      data: {
        team: {
          id: createdTeam?.id,
          name: createdTeam?.name,
          description: createdTeam?.description,
          type: createdTeam?.type,
          manager: createdTeam?.manager && createdTeam.manager.profile ? {
            id: createdTeam.manager.id,
            firstName: createdTeam.manager.profile.firstName,
            lastName: createdTeam.manager.profile.lastName
          } : null,
          members: createdTeam?.members.map(m => ({
            id: m.user.id,
            firstName: m.user.profile?.firstName,
            lastName: m.user.profile?.lastName,
            role: m.role
          }))
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'équipe technique:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'équipe technique'
    });
  }
};

/**
 * Mise à jour d'une équipe technique
 * @route PUT /api/stageplanner/technical-teams/:id
 */
export const updateTechnicalTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, type, managerId } = req.body;
    
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;
    const userId = req.user?.id; // updater

    if (!tenantId || !organizationId || !userId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID, Organization ID et User ID requis' });
      return;
    }

    const team = await prisma.team.findFirst({
      where: { id, organization: { tenantId, id: organizationId } }
    });

    if (!team) {
      res.status(404).json({ status: 'error', message: 'Équipe technique non trouvée' });
      return;
    }

    if (managerId !== undefined) { // managerId can be null to disconnect
        if (managerId === null) {
            // disconnect manager
        } else {
            const manager = await prisma.user.findFirst({ where: { id: managerId as string, organizationId } });
            if (!manager) {
                res.status(400).json({ status: 'error', message: 'Manager non trouvé pour la mise à jour' });
                return;
            }
        }
    }

    const teamUpdateData: Prisma.TeamUpdateInput = {
      updatedById: userId,
      updatedAt: new Date()
    };
    if (name !== undefined) teamUpdateData.name = name;
    if (description !== undefined) teamUpdateData.description = description;
    if (type !== undefined) teamUpdateData.type = type as TeamType;
    if (managerId !== undefined) {
        teamUpdateData.manager = managerId === null ? { disconnect: true } : { connect: { id: managerId as string }};
    }


    const updatedTeam = await prisma.team.update({
      where: { id },
      data: teamUpdateData,
      include: {
        members: { include: { user: { include: { profile: true } } } },
        manager: { include: { profile: true } }
      }
    });

    console.info(`Équipe technique mise à jour: ${updatedTeam.name} (${id})`);

    res.status(200).json({
      status: 'success',
      message: 'Équipe technique mise à jour avec succès',
      data: {
        team: {
          id: updatedTeam.id,
          name: updatedTeam.name,
          description: updatedTeam.description,
          type: updatedTeam.type,
          manager: updatedTeam.manager && updatedTeam.manager.profile ? {
            id: updatedTeam.manager.id,
            firstName: updatedTeam.manager.profile.firstName,
            lastName: updatedTeam.manager.profile.lastName
          } : null,
          members: updatedTeam.members.map(m => ({
            id: m.user.id,
            firstName: m.user.profile?.firstName,
            lastName: m.user.profile?.lastName,
            role: m.role
          }))
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'équipe technique:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour de l\'équipe technique'
    });
  }
};

/**
 * Suppression d'une équipe technique
 * @route DELETE /api/stageplanner/technical-teams/:id
 */
export const deleteTechnicalTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    const team = await prisma.team.findFirst({
      where: { id, organization: { tenantId, id: organizationId } }
    });

    if (!team) {
      res.status(404).json({ status: 'error', message: 'Équipe technique non trouvée' });
      return;
    }

    // Assuming TeamMember has onDelete: Cascade or handled by Prisma relation
    await prisma.team.delete({ where: { id } });

    console.info(`Équipe technique supprimée: ${team.name} (${id})`);

    res.status(200).json({
      status: 'success',
      message: 'Équipe technique supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'équipe technique:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de l\'équipe technique'
    });
  }
};

/**
 * Ajout d'un membre à une équipe technique
 * @route POST /api/stageplanner/technical-teams/:id/members
 */
export const addTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: teamId } = req.params; // teamId
    const { userId, role, specialty } = req.body;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    const team = await prisma.team.findFirst({
      where: { id: teamId, organization: { tenantId, id: organizationId } }
    });

    if (!team) {
      res.status(404).json({ status: 'error', message: 'Équipe technique non trouvée' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: { profile: true }
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
      return;
    }

    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId, userId }
    });

    if (existingMember) {
      res.status(400).json({ status: 'error', message: 'L\'utilisateur est déjà membre de cette équipe' });
      return;
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
        specialty,
        joinedAt: new Date()
      }
    });

    console.info(`Membre ajouté à l'équipe: ${user.email} -> ${team.name}`);

    res.status(201).json({
      status: 'success',
      message: 'Membre ajouté à l\'équipe avec succès',
      data: {
        member: {
          id: user.id,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          email: user.email,
          role: teamMember.role,
          specialty: teamMember.specialty,
          joinedAt: teamMember.joinedAt
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre à l\'équipe:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'ajout du membre à l\'équipe'
    });
  }
};

/**
 * Suppression d'un membre d'une équipe technique
 * @route DELETE /api/stageplanner/technical-teams/:id/members/:userId
 */
export const removeTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: teamId, userId } = req.params;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    const team = await prisma.team.findFirst({
      where: { id: teamId, organization: { tenantId, id: organizationId } }
    });

    if (!team) {
      res.status(404).json({ status: 'error', message: 'Équipe technique non trouvée' });
      return;
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { teamId, userId }
    });

    if (!teamMember) {
      res.status(404).json({ status: 'error', message: 'Utilisateur non membre de cette équipe' });
      return;
    }

    await prisma.teamMember.delete({
      where: { id: teamMember.id } // Assuming TeamMember has an 'id' primary key
    });

    console.info(`Membre retiré de l'équipe: ${userId} -> ${team.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Membre retiré de l\'équipe avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du membre de l\'équipe:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression du membre de l\'équipe'
    });
  }
};

/**
 * Récupération des intermittents/freelancers
 * @route GET /api/stageplanner/intermittents
 */
export const getIntermittents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialty, availability, page = 1, limit = 10 } = req.query;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    // Placeholder for V1 - full implementation later
    res.status(501).json({
      status: 'success',
      message: 'Cette fonctionnalité (getIntermittents) sera implémentée prochainement',
      data: {
        intermittents: [],
        pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 0 }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des intermittents:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des intermittents'
    });
  }
};

/**
 * Récupération des données du tableau de bord
 * @route GET /api/stageplanner/dashboard
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period, startDate, endDate } = req.query;
    const tenantId = req.tenantId;
    const organizationId = req.organizationId;

    if (!tenantId || !organizationId) {
      res.status(400).json({ status: 'error', message: 'Tenant ID et Organization ID requis' });
      return;
    }

    // Placeholder for V1 - full implementation later
    res.status(501).json({
      status: 'success',
      message: 'Cette fonctionnalité (getDashboard) sera implémentée prochainement',
      data: {
        stats: { totalEvents: 0, upcomingEvents: 0, pastEvents: 0, cancelledEvents: 0, totalTeams: 0, totalIntermittents: 0 },
        recentEvents: [],
        upcomingEvents: []
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des données du tableau de bord'
    });
  }
};


// --- Stubs for methods referenced in routes but not fully implemented ---

export const getEventAssignments = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité getEventAssignments non implémentée' });
};

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité createAssignment non implémentée' });
};

export const updateAssignment = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité updateAssignment non implémentée' });
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité deleteAssignment non implémentée' });
};

export const respondToAssignment = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité respondToAssignment non implémentée' });
};

export const validateTeam = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité validateTeam non implémentée' });
};

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité getAvailability non implémentée' });
};

export const getEventStatistics = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité getEventStatistics non implémentée' });
};

export const getIntermittentStatistics = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité getIntermittentStatistics non implémentée' });
};

export const exportEvents = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité exportEvents non implémentée' });
};

export const exportEventById = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité exportEventById non implémentée' });
};

export const exportTeamSheet = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité exportTeamSheet non implémentée' });
};

export const exportIntermittents = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Fonctionnalité exportIntermittents non implémentée' });
};
