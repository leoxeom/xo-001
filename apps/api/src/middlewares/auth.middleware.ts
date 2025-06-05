import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, Role, Permission, Profile, Organization } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  tenantId: string;
  tokenVersion: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User & {
        profile?: Profile | null;
        organization?: Organization | null;
        roles?: (Role & { permissions: Permission[] })[];
      };
      permissions?: string[];
      organizationId?: string;
      tenantId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Accès non autorisé. Token manquant ou mal formaté.'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_please_change';

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        organization: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Utilisateur non trouvé pour ce token.'
      });
      return;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
        res.status(401).json({
            status: 'error',
            message: 'Token invalide (version incorrecte). Veuillez vous reconnecter.'
        });
        return;
    }
    
    if (user.status !== 'ACTIVE') {
        res.status(403).json({
            status: 'error',
            message: `Le compte utilisateur est ${user.status}. Accès refusé.`
        });
        return;
    }

    const roles = user.roleAssignments.map(ra => ra.role);
    const permissionsSet = new Set<string>();
    roles.forEach(role => {
      if (role && role.permissions) {
        role.permissions.forEach(permission => {
          permissionsSet.add(permission.name);
        });
      }
    });

    // Populate req.user and other relevant request properties
    req.user = {
      ...user, // Includes id, email, organizationId, status, etc.
      profile: user.profile,
      organization: user.organization,
      roles: roles as (Role & { permissions: Permission[] })[], // Cast for type safety
    };
    req.permissions = Array.from(permissionsSet);
    req.organizationId = user.organizationId; // Already on user object
    
    // Set tenantId from token if not already set by tenantMiddleware
    // This ensures tenant context even if tenantMiddleware runs after auth in some setups
    if (!req.tenantId && decoded.tenantId) {
      req.tenantId = decoded.tenantId;
    }
    
    // Ensure organizationId from token matches user's organization for consistency
    if (decoded.organizationId !== user.organizationId) {
        console.warn(`Incohérence d'organizationId pour l'utilisateur ${user.id}: token ${decoded.organizationId} vs DB ${user.organizationId}`);
        // Decide on handling: error out, log, or trust DB record
    }


    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: 'error',
        message: 'Token invalide.',
        detail: error.message
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        message: 'Token expiré.',
        detail: error.message
      });
    } else {
      console.error('Erreur d\'authentification inattendue:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur interne lors de l\'authentification.'
      });
    }
  }
};

export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié pour la vérification des permissions.'
      });
      return;
    }
    if (!req.permissions || !req.permissions.includes(requiredPermission)) {
      res.status(403).json({
        status: 'error',
        message: `Accès refusé. Permission '${requiredPermission}' insuffisante.`
      });
      return;
    }
    next();
  };
};
