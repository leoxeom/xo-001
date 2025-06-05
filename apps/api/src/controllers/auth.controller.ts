import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h';

/**
 * Génère un token JWT pour l'authentification
 */
const generateToken = (
  userId: string,
  email: string,
  organizationId: string,
  tenantId: string,
  tokenVersion: number,
  expiresIn: string = ACCESS_TOKEN_EXPIRY
): string => {
  const payload = { userId, email, organizationId, tenantId, tokenVersion };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Authentification d'un utilisateur
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenantId; // Assumé être défini par un middleware précédent

    if (!tenantId) {
      res.status(400).json({
        status: 'error',
        message: 'Tenant ID requis pour l\'authentification'
      });
      return;
    }

    // Rechercher l'utilisateur par email dans le contexte du tenant
    // Simplification: pas d'includes complexes pour le moment
    const user = await prisma.user.findFirst({
      where: {
        email,
        organization: {
          tenantId: tenantId, 
        },
        status: 'ACTIVE' 
      }
      // Removed includes: profile, organization, roleAssignments
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incrémenter le compteur d'échecs de connexion
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: {
            increment: 1
          }
        }
      });

      res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
      return;
    }

    // Réinitialiser le compteur de tentatives de connexion et mettre à jour la date de dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLoginAt: new Date()
      }
    });

    // Générer le token d'accès
    const accessToken = generateToken(
      user.id,
      user.email,
      user.organizationId, 
      tenantId, 
      user.tokenVersion 
    );

    // Simplification: pas de permissions, profile, ou organization details dans la réponse pour le moment
    res.status(200).json({
      status: 'success',
      message: 'Connexion réussie',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          // firstName: user.profile?.firstName, // Removed
          // lastName: user.profile?.lastName, // Removed
          // avatarUrl: user.profile?.avatarUrl, // Removed
          // organization: user.organization ? { id: user.organization.id, name: user.organization.name } : null, // Removed
          // permissions: [], // Removed
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la connexion'
    });
  }
};

/**
 * Déconnexion d'un utilisateur
 * @route POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la déconnexion'
    });
  }
};

/**
 * Récupération des informations de l'utilisateur connecté
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié'
      });
      return;
    }

    // Simplification: renvoyer uniquement les informations de base de req.user
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.profile?.firstName, // Assumes authenticate middleware provides this
          lastName: req.user.profile?.lastName,   // Assumes authenticate middleware provides this
          avatarUrl: req.user.profile?.avatarUrl, // Assumes authenticate middleware provides this
          // organization: req.user.organization ? { id: req.user.organization.id, name: req.user.organization.name } : null, // Removed for simplification
          // roles: req.user.roles?.map(r => ({id: r.id, name: r.name})), // Removed for simplification
          // permissions: req.user.permissions, // Removed for simplification
          emailVerified: req.user.emailVerified // Assumes authenticate middleware provides this
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des informations utilisateur'
    });
  }
};

// Méthodes à implémenter ultérieurement ou non nécessaires pour la V1
export const registerByInvitation = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const sendInvitation = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const registerTenant = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const validateSubdomain = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};

export const unregisterDevice = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ status: 'error', message: 'Non implémenté' });
};
