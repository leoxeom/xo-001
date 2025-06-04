import express from 'express';
import { body, param, query } from 'express-validator';
import * as stageplannerController from '../controllers/stageplanner.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permission.middleware';
import { tenantRequired } from '../middlewares/tenant.middleware';

const router = express.Router();

// Middleware commun pour toutes les routes
router.use(authenticate, tenantRequired);

/**
 * ============================
 * CRUD ÉVÉNEMENTS SPECTACLE
 * ============================
 */

/**
 * @route GET /api/stageplanner/events
 * @desc Récupération de tous les événements spectacle
 * @access Private
 */
router.get(
  '/events',
  [
    query('startDate').optional().isDate().withMessage('Format de date invalide'),
    query('endDate').optional().isDate().withMessage('Format de date invalide'),
    query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).withMessage('Statut invalide'),
    query('locationId').optional().isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('read:event')
  ],
  stageplannerController.getEvents
);

/**
 * @route GET /api/stageplanner/events/:id
 * @desc Récupération d'un événement spectacle par ID
 * @access Private
 */
router.get(
  '/events/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('read:event')
  ],
  stageplannerController.getEventById
);

/**
 * @route POST /api/stageplanner/events
 * @desc Création d'un nouvel événement spectacle
 * @access Private
 */
router.post(
  '/events',
  [
    body('title').notEmpty().withMessage('Titre requis'),
    body('startDate').isISO8601().toDate().withMessage('Date de début invalide'),
    body('endDate').isISO8601().toDate().withMessage('Date de fin invalide'),
    body('locationId').optional().isUUID().withMessage('Format d\'ID de lieu invalide'),
    body('description').optional(),
    body('technicalDetails').optional(),
    body('setupTime').optional().isISO8601().toDate().withMessage('Heure de montage invalide'),
    body('soundcheckTime').optional().isISO8601().toDate().withMessage('Heure de balance invalide'),
    body('doorsTime').optional().isISO8601().toDate().withMessage('Heure d\'ouverture des portes invalide'),
    body('showTime').optional().isISO8601().toDate().withMessage('Heure de spectacle invalide'),
    validateRequest,
    checkPermission('create:event')
  ],
  stageplannerController.createEvent
);

/**
 * @route PUT /api/stageplanner/events/:id
 * @desc Mise à jour d'un événement spectacle
 * @access Private
 */
router.put(
  '/events/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    body('title').optional().notEmpty().withMessage('Titre ne peut pas être vide'),
    body('startDate').optional().isISO8601().toDate().withMessage('Date de début invalide'),
    body('endDate').optional().isISO8601().toDate().withMessage('Date de fin invalide'),
    body('locationId').optional().isUUID().withMessage('Format d\'ID de lieu invalide'),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).withMessage('Statut invalide'),
    validateRequest,
    checkPermission('update:event')
  ],
  stageplannerController.updateEvent
);

/**
 * @route DELETE /api/stageplanner/events/:id
 * @desc Suppression d'un événement spectacle
 * @access Private
 */
router.delete(
  '/events/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('delete:event')
  ],
  stageplannerController.deleteEvent
);

/**
 * @route POST /api/stageplanner/events/:id/publish
 * @desc Publication d'un événement (passage de DRAFT à PUBLISHED)
 * @access Private
 */
router.post(
  '/events/:id/publish',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('update:event')
  ],
  stageplannerController.publishEvent
);

/**
 * @route POST /api/stageplanner/events/:id/cancel
 * @desc Annulation d'un événement
 * @access Private
 */
router.post(
  '/events/:id/cancel',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    body('reason').optional(),
    validateRequest,
    checkPermission('update:event')
  ],
  stageplannerController.cancelEvent
);

/**
 * ============================
 * GESTION DES ÉQUIPES TECHNIQUES
 * ============================
 */

/**
 * @route GET /api/stageplanner/technical-teams
 * @desc Récupération des équipes techniques (son, lumière, plateau)
 * @access Private
 */
router.get(
  '/technical-teams',
  [
    query('type').optional().isIn(['SOUND', 'LIGHT', 'STAGE', 'ALL']).withMessage('Type d\'équipe invalide'),
    validateRequest,
    checkPermission('read:team')
  ],
  stageplannerController.getTechnicalTeams
);

/**
 * @route GET /api/stageplanner/technical-teams/:id
 * @desc Récupération d'une équipe technique par ID
 * @access Private
 */
router.get(
  '/technical-teams/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('read:team')
  ],
  stageplannerController.getTechnicalTeamById
);

/**
 * @route POST /api/stageplanner/technical-teams
 * @desc Création d'une nouvelle équipe technique
 * @access Private
 */
router.post(
  '/technical-teams',
  [
    body('name').notEmpty().withMessage('Nom requis'),
    body('description').optional(),
    body('color').optional().isHexColor().withMessage('Format de couleur invalide'),
    body('type').isIn(['SOUND', 'LIGHT', 'STAGE']).withMessage('Type d\'équipe invalide'),
    validateRequest,
    checkPermission('create:team')
  ],
  stageplannerController.createTechnicalTeam
);

/**
 * @route PUT /api/stageplanner/technical-teams/:id
 * @desc Mise à jour d'une équipe technique
 * @access Private
 */
router.put(
  '/technical-teams/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    body('name').optional().notEmpty().withMessage('Nom ne peut pas être vide'),
    body('color').optional().isHexColor().withMessage('Format de couleur invalide'),
    validateRequest,
    checkPermission('update:team')
  ],
  stageplannerController.updateTechnicalTeam
);

/**
 * @route DELETE /api/stageplanner/technical-teams/:id
 * @desc Suppression d'une équipe technique
 * @access Private
 */
router.delete(
  '/technical-teams/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('delete:team')
  ],
  stageplannerController.deleteTechnicalTeam
);

/**
 * @route POST /api/stageplanner/technical-teams/:id/members
 * @desc Ajout d'un membre à une équipe technique
 * @access Private
 */
router.post(
  '/technical-teams/:id/members',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    body('userId').isUUID().withMessage('Format d\'ID utilisateur invalide'),
    body('role').optional(),
    validateRequest,
    checkPermission('update:team')
  ],
  stageplannerController.addTeamMember
);

/**
 * @route DELETE /api/stageplanner/technical-teams/:id/members/:userId
 * @desc Suppression d'un membre d'une équipe technique
 * @access Private
 */
router.delete(
  '/technical-teams/:id/members/:userId',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    param('userId').isUUID().withMessage('Format d\'ID utilisateur invalide'),
    validateRequest,
    checkPermission('update:team')
  ],
  stageplannerController.removeTeamMember
);

/**
 * ============================
 * ASSIGNATION D'INTERMITTENTS
 * ============================
 */

/**
 * @route GET /api/stageplanner/intermittents
 * @desc Récupération de tous les intermittents
 * @access Private
 */
router.get(
  '/intermittents',
  [
    query('specialty').optional(),
    query('isAvailable').optional().isBoolean().withMessage('Format de disponibilité invalide'),
    validateRequest,
    checkPermission('read:user')
  ],
  stageplannerController.getIntermittents
);

/**
 * @route GET /api/stageplanner/events/:id/assignments
 * @desc Récupération des assignations pour un événement
 * @access Private
 */
router.get(
  '/events/:id/assignments',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    validateRequest,
    checkPermission('read:event')
  ],
  stageplannerController.getEventAssignments
);

/**
 * @route POST /api/stageplanner/events/:id/assignments
 * @desc Création d'une nouvelle assignation pour un événement
 * @access Private
 */
router.post(
  '/events/:id/assignments',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    body('userId').isUUID().withMessage('Format d\'ID utilisateur invalide'),
    body('role').notEmpty().withMessage('Rôle requis'),
    body('hourlyRate').optional().isNumeric().withMessage('Taux horaire invalide'),
    body('flatRate').optional().isNumeric().withMessage('Taux forfaitaire invalide'),
    body('startTime').optional().isISO8601().toDate().withMessage('Heure de début invalide'),
    body('endTime').optional().isISO8601().toDate().withMessage('Heure de fin invalide'),
    body('notes').optional(),
    validateRequest,
    checkPermission('create:assignment')
  ],
  stageplannerController.createAssignment
);

/**
 * @route PUT /api/stageplanner/events/:eventId/assignments/:assignmentId
 * @desc Mise à jour d'une assignation
 * @access Private
 */
router.put(
  '/events/:eventId/assignments/:assignmentId',
  [
    param('eventId').isUUID().withMessage('Format d\'ID événement invalide'),
    param('assignmentId').isUUID().withMessage('Format d\'ID assignation invalide'),
    body('status').optional().isIn(['PROPOSED', 'AVAILABLE', 'UNAVAILABLE', 'UNCERTAIN', 'VALIDATED', 'NOT_RETAINED']).withMessage('Statut invalide'),
    body('hourlyRate').optional().isNumeric().withMessage('Taux horaire invalide'),
    body('flatRate').optional().isNumeric().withMessage('Taux forfaitaire invalide'),
    body('notes').optional(),
    validateRequest,
    checkPermission('update:assignment')
  ],
  stageplannerController.updateAssignment
);

/**
 * @route DELETE /api/stageplanner/events/:eventId/assignments/:assignmentId
 * @desc Suppression d'une assignation
 * @access Private
 */
router.delete(
  '/events/:eventId/assignments/:assignmentId',
  [
    param('eventId').isUUID().withMessage('Format d\'ID événement invalide'),
    param('assignmentId').isUUID().withMessage('Format d\'ID assignation invalide'),
    validateRequest,
    checkPermission('delete:assignment')
  ],
  stageplannerController.deleteAssignment
);

/**
 * ============================
 * VALIDATION DES DISPONIBILITÉS
 * ============================
 */

/**
 * @route PUT /api/stageplanner/assignments/:id/respond
 * @desc Réponse d'un intermittent à une proposition d'assignation
 * @access Private
 */
router.put(
  '/assignments/:id/respond',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    body('status').isIn(['AVAILABLE', 'UNAVAILABLE', 'UNCERTAIN']).withMessage('Statut invalide'),
    body('comment').optional(),
    validateRequest
  ],
  stageplannerController.respondToAssignment
);

/**
 * @route PUT /api/stageplanner/events/:eventId/validate-team
 * @desc Validation de l'équipe pour un événement (passage des statuts à VALIDATED)
 * @access Private
 */
router.put(
  '/events/:eventId/validate-team',
  [
    param('eventId').isUUID().withMessage('Format d\'ID événement invalide'),
    body('assignments').isArray().withMessage('Liste d\'assignations requise'),
    body('assignments.*.id').isUUID().withMessage('Format d\'ID assignation invalide'),
    body('assignments.*.status').equals('VALIDATED').withMessage('Statut doit être VALIDATED'),
    validateRequest,
    checkPermission('update:event')
  ],
  stageplannerController.validateEventTeam
);

/**
 * @route GET /api/stageplanner/availability
 * @desc Vérification des disponibilités des intermittents pour une période donnée
 * @access Private
 */
router.get(
  '/availability',
  [
    query('startDate').isISO8601().toDate().withMessage('Date de début invalide'),
    query('endDate').isISO8601().toDate().withMessage('Date de fin invalide'),
    query('userIds').optional().isArray().withMessage('Format de liste d\'utilisateurs invalide'),
    query('specialties').optional().isArray().withMessage('Format de liste de spécialités invalide'),
    validateRequest,
    checkPermission('read:user')
  ],
  stageplannerController.checkAvailability
);

/**
 * ============================
 * TABLEAUX DE BORD ET STATISTIQUES
 * ============================
 */

/**
 * @route GET /api/stageplanner/dashboard
 * @desc Récupération des données pour le tableau de bord
 * @access Private
 */
router.get(
  '/dashboard',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Période invalide'),
    query('startDate').optional().isISO8601().toDate().withMessage('Date de début invalide'),
    query('endDate').optional().isISO8601().toDate().withMessage('Date de fin invalide'),
    validateRequest,
    checkPermission('read:statistics')
  ],
  stageplannerController.getDashboardData
);

/**
 * @route GET /api/stageplanner/statistics/events
 * @desc Statistiques sur les événements
 * @access Private
 */
router.get(
  '/statistics/events',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Période invalide'),
    query('startDate').optional().isISO8601().toDate().withMessage('Date de début invalide'),
    query('endDate').optional().isISO8601().toDate().withMessage('Date de fin invalide'),
    validateRequest,
    checkPermission('read:statistics')
  ],
  stageplannerController.getEventStatistics
);

/**
 * @route GET /api/stageplanner/statistics/intermittents
 * @desc Statistiques sur les intermittents
 * @access Private
 */
router.get(
  '/statistics/intermittents',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Période invalide'),
    query('startDate').optional().isISO8601().toDate().withMessage('Date de début invalide'),
    query('endDate').optional().isISO8601().toDate().withMessage('Date de fin invalide'),
    validateRequest,
    checkPermission('read:statistics')
  ],
  stageplannerController.getIntermittentStatistics
);

/**
 * ============================
 * EXPORT DES DONNÉES
 * ============================
 */

/**
 * @route GET /api/stageplanner/export/events
 * @desc Export des événements au format CSV/Excel
 * @access Private
 */
router.get(
  '/export/events',
  [
    query('format').isIn(['csv', 'excel', 'pdf']).withMessage('Format invalide'),
    query('startDate').optional().isISO8601().toDate().withMessage('Date de début invalide'),
    query('endDate').optional().isISO8601().toDate().withMessage('Date de fin invalide'),
    validateRequest,
    checkPermission('export:event')
  ],
  stageplannerController.exportEvents
);

/**
 * @route GET /api/stageplanner/export/event/:id
 * @desc Export d'un événement spécifique avec ses détails
 * @access Private
 */
router.get(
  '/export/event/:id',
  [
    param('id').isUUID().withMessage('Format d\'ID invalide'),
    query('format').isIn(['csv', 'excel', 'pdf']).withMessage('Format invalide'),
    validateRequest,
    checkPermission('export:event')
  ],
  stageplannerController.exportEventDetails
);

/**
 * @route GET /api/stageplanner/export/team-sheet/:eventId
 * @desc Export de la feuille d'équipe pour un événement
 * @access Private
 */
router.get(
  '/export/team-sheet/:eventId',
  [
    param('eventId').isUUID().withMessage('Format d\'ID événement invalide'),
    query('format').isIn(['csv', 'excel', 'pdf']).withMessage('Format invalide'),
    validateRequest,
    checkPermission('export:event')
  ],
  stageplannerController.exportTeamSheet
);

/**
 * @route GET /api/stageplanner/export/intermittents
 * @desc Export de la liste des intermittents
 * @access Private
 */
router.get(
  '/export/intermittents',
  [
    query('format').isIn(['csv', 'excel', 'pdf']).withMessage('Format invalide'),
    query('withContactInfo').optional().isBoolean().withMessage('Format booléen invalide'),
    validateRequest,
    checkPermission('export:user')
  ],
  stageplannerController.exportIntermittents
);

export default router;
