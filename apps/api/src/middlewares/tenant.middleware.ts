import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Tenant, ModuleType, TenantStatus } from '@prisma/client';
import winston from 'winston'; // Assuming logger is configured elsewhere or add basic config here

const prisma = new PrismaClient();

// Basic logger configuration if not already global
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tenant-middleware' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});


/**
 * Identifies the tenant from subdomain or x-tenant-id header.
 * Adds tenantId to the request object if found, but does not fail if not found.
 * This is for routes that can be global or tenant-specific.
 */
export const tenantIdentifier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hostParts = req.hostname.split('.');
    let potentialSubdomain: string | undefined = undefined;

    // Avoid using 'www', 'api', or common TLDs as subdomains
    if (hostParts.length > 2 && !['www', 'api'].includes(hostParts[0])) {
        potentialSubdomain = hostParts[0];
    }
    
    const tenantIdFromHeader = req.headers['x-tenant-id'] as string;
    const tenantIdentifier = tenantIdFromHeader || potentialSubdomain;

    if (tenantIdentifier) {
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: tenantIdentifier },
            { subdomain: tenantIdentifier }
          ],
          // We don't check for status: 'ACTIVE' here, as some operations might be allowed on inactive tenants
          // or this middleware is just for identification. `tenantRequired` will enforce active status.
        }
      });

      if (tenant) {
        req.tenantId = tenant.id;
        logger.debug(`Tenant identified: ${tenant.id} (from ${tenantIdFromHeader ? 'header' : 'subdomain'}) for host ${req.hostname}`);
      } else {
        logger.debug(`No tenant found for identifier: ${tenantIdentifier} (from ${tenantIdFromHeader ? 'header' : 'subdomain'}) for host ${req.hostname}`);
      }
    } else {
      logger.debug(`No tenant identifier found in header or subdomain for host ${req.hostname}`);
    }
    next();
  } catch (error) {
    logger.error('Erreur dans le middleware tenantIdentifier:', { error, hostname: req.hostname });
    // Do not send error response here, as this middleware is optional for tenant identification
    next();
  }
};


/**
 * Requires a valid and active tenant for the route.
 * Fails if no tenant is identified, tenant is not active, or subscription is invalid.
 */
export const tenantRequired = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure tenantIdentifier has run or duplicate logic
    const hostParts = req.hostname.split('.');
    let potentialSubdomain: string | undefined = undefined;

    if (hostParts.length > 2 && !['www', 'api'].includes(hostParts[0])) {
        potentialSubdomain = hostParts[0];
    }
    
    const tenantIdFromHeader = req.headers['x-tenant-id'] as string;
    const tenantIdentifierValue = req.tenantId || tenantIdFromHeader || potentialSubdomain;


    if (!tenantIdentifierValue) {
      logger.warn(`TenantRequired: No tenant identifier provided for host ${req.hostname}`);
      res.status(400).json({
        status: 'error',
        message: 'Tenant requis. Veuillez spécifier un sous-domaine valide ou un header x-tenant-id.'
      });
      return;
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantIdentifierValue },
          { subdomain: tenantIdentifierValue }
        ],
      }
    });

    if (!tenant) {
      logger.warn(`TenantRequired: Tenant non trouvé pour l'identifiant '${tenantIdentifierValue}'`);
      res.status(404).json({
        status: 'error',
        message: 'Tenant non trouvé.'
      });
      return;
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      logger.warn(`TenantRequired: Tenant '${tenant.id}' non actif. Statut: ${tenant.status}`);
      res.status(403).json({
        status: 'error',
        message: `L'accès pour ce tenant est actuellement ${tenant.status}. Veuillez contacter le support.`
      });
      return;
    }
    
    // Check subscription validity
    const currentDate = new Date();
    if (tenant.subscriptionEndDate && tenant.subscriptionEndDate < currentDate) {
        logger.warn(`TenantRequired: L'abonnement du tenant '${tenant.id}' a expiré le ${tenant.subscriptionEndDate}`);
        res.status(403).json({
            status: 'error',
            message: 'L\'abonnement de ce tenant a expiré. Veuillez renouveler votre abonnement.'
        });
        return;
    }


    req.tenantId = tenant.id; // Ensure it's set if tenantIdentifier didn't run or found it differently
    logger.debug(`TenantRequired: Accès autorisé pour le tenant ${tenant.id}`);
    next();
  } catch (error) {
    logger.error('Erreur dans le middleware tenantRequired:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur interne lors de la vérification du tenant.'
    });
  }
};

/**
 * Middleware factory to check if the current tenant has access to a specific module.
 * @param moduleType The type of module to check access for.
 */
export const checkModuleAccess = (moduleType: ModuleType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        // This should ideally not happen if tenantRequired is used before this middleware
        logger.warn(`CheckModuleAccess: Tentative de vérification d'accès au module ${moduleType} sans tenantId.`);
        res.status(400).json({
          status: 'error',
          message: 'Identifiant de tenant requis pour vérifier l\'accès au module.'
        });
        return;
      }

      const moduleActivation = await prisma.moduleActivation.findFirst({
        where: {
          tenantId: req.tenantId,
          moduleType: moduleType, // Use the ModuleType enum directly
          isActive: true
        }
      });

      if (!moduleActivation) {
        logger.warn(`CheckModuleAccess: Accès refusé au module ${moduleType} pour le tenant ${req.tenantId}. Module non activé ou inexistant.`);
        res.status(403).json({
          status: 'error',
          message: `Accès refusé. Le module '${moduleType}' n'est pas activé pour votre organisation.`
        });
        return;
      }

      logger.debug(`CheckModuleAccess: Accès autorisé au module ${moduleType} pour le tenant ${req.tenantId}`);
      next();
    } catch (error) {
      logger.error(`Erreur lors de la vérification de l'accès au module ${moduleType}:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur interne lors de la vérification de l\'accès au module.'
      });
    }
  };
};
