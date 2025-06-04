import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';
import { tenantRequired } from '../middlewares/tenant.middleware';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authentification d'un utilisateur
 * @access Public
 */
router.post(
  '/login',
  [
    tenantRequired,
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
    validateRequest,
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 tentatives max
      message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
    })
  ],
  authController.login
);

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion d'un utilisateur
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/auth/register-by-invitation
 * @desc Inscription d'un utilisateur via invitation
 * @access Public
 */
router.post(
  '/register-by-invitation',
  [
    tenantRequired,
    body('token').notEmpty().withMessage('Token d\'invitation requis'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('lastName').notEmpty().withMessage('Nom requis'),
    validateRequest
  ],
  authController.registerByInvitation
);

/**
 * @route POST /api/auth/send-invitation
 * @desc Envoi d'une invitation à un utilisateur
 * @access Private (Admin/Manager)
 */
router.post(
  '/send-invitation',
  [
    authenticate,
    tenantRequired,
    body('email').isEmail().withMessage('Email invalide'),
    body('roleId').notEmpty().withMessage('Rôle requis'),
    validateRequest
  ],
  authController.sendInvitation
);

/**
 * @route POST /api/auth/verify-email
 * @desc Validation de l'adresse email
 * @access Public
 */
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Token de vérification requis'),
    validateRequest
  ],
  authController.verifyEmail
);

/**
 * @route POST /api/auth/resend-verification
 * @desc Renvoi de l'email de vérification
 * @access Private
 */
router.post(
  '/resend-verification',
  [
    authenticate,
    validateRequest
  ],
  authController.resendVerification
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Demande de réinitialisation de mot de passe
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    tenantRequired,
    body('email').isEmail().withMessage('Email invalide'),
    validateRequest,
    rateLimiter({
      windowMs: 60 * 60 * 1000, // 1 heure
      max: 3, // 3 tentatives max
      message: 'Trop de demandes de réinitialisation, veuillez réessayer plus tard'
    })
  ],
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Réinitialisation du mot de passe
 * @access Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token de réinitialisation requis'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
    validateRequest
  ],
  authController.resetPassword
);

/**
 * @route GET /api/auth/me
 * @desc Récupération des informations de l'utilisateur connecté
 * @access Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route POST /api/auth/refresh-token
 * @desc Rafraîchissement du token JWT
 * @access Public (avec refresh token)
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token requis'),
    validateRequest
  ],
  authController.refreshToken
);

/**
 * @route POST /api/auth/register-tenant
 * @desc Création d'un nouveau tenant (inscription organisation)
 * @access Public
 */
router.post(
  '/register-tenant',
  [
    body('organizationName').notEmpty().withMessage('Nom de l\'organisation requis'),
    body('subdomain')
      .notEmpty().withMessage('Sous-domaine requis')
      .matches(/^[a-z0-9]+(-[a-z0-9]+)*$/).withMessage('Format de sous-domaine invalide'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('lastName').notEmpty().withMessage('Nom requis'),
    body('modules').isArray().withMessage('Modules requis'),
    validateRequest,
    rateLimiter({
      windowMs: 60 * 60 * 1000, // 1 heure
      max: 5, // 5 tentatives max
      message: 'Trop de tentatives d\'inscription, veuillez réessayer plus tard'
    })
  ],
  authController.registerTenant
);

/**
 * @route GET /api/auth/validate-subdomain/:subdomain
 * @desc Vérification de la disponibilité d'un sous-domaine
 * @access Public
 */
router.get(
  '/validate-subdomain/:subdomain',
  authController.validateSubdomain
);

/**
 * @route POST /api/auth/change-password
 * @desc Changement de mot de passe
 * @access Private
 */
router.post(
  '/change-password',
  [
    authenticate,
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
    validateRequest
  ],
  authController.changePassword
);

/**
 * @route POST /api/auth/register-device
 * @desc Enregistrement d'un token d'appareil pour les notifications push
 * @access Private
 */
router.post(
  '/register-device',
  [
    authenticate,
    body('token').notEmpty().withMessage('Token d\'appareil requis'),
    body('platform').isIn(['IOS', 'ANDROID', 'WEB']).withMessage('Plateforme invalide'),
    validateRequest
  ],
  authController.registerDevice
);

/**
 * @route DELETE /api/auth/unregister-device
 * @desc Suppression d'un token d'appareil
 * @access Private
 */
router.delete(
  '/unregister-device',
  [
    authenticate,
    body('token').notEmpty().withMessage('Token d\'appareil requis'),
    validateRequest
  ],
  authController.unregisterDevice
);

export default router;
