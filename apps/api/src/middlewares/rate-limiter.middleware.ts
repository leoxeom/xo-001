import { Request, Response, NextFunction } from 'express';
import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../services/redis.service'; // Assuming redis service is set up

/**
 * Options for the rate limiter
 */
interface RateLimiterOptions extends Partial<Options> {
  /**
   * Durée de la fenêtre en millisecondes
   * @default 15 * 60 * 1000 (15 minutes)
   */
  windowMs?: number;

  /**
   * Nombre maximum de requêtes dans la fenêtre
   * @default 100
   */
  max?: number;

  /**
   * Message d'erreur à renvoyer lorsque la limite est atteinte
   * @default 'Trop de requêtes, veuillez réessayer plus tard'
   */
  message?: string | object | ((req: Request, res: Response) => string | object);

  /**
   * Utiliser Redis comme store pour le rate limiting
   * Utile en environnement distribué (plusieurs instances d'API)
   * @default true en production, false en développement
   */
  useRedis?: boolean;

  /**
   * Préfixe pour les clés Redis
   * @default 'rl' (rate-limit)
   */
  prefix?: string;
}

/**
 * Middleware de rate limiting configurable
 * Limite le nombre de requêtes qu'un client peut effectuer dans un intervalle de temps
 * 
 * @param options Options de configuration du rate limiter
 * @returns Middleware Express de rate limiting
 */
export const rateLimiter = (options?: RateLimiterOptions): RateLimitRequestHandler => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Options par défaut
  const defaultOptions: RateLimiterOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre par IP
    message: {
      status: 'error',
      message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer après 15 minutes.'
    },
    standardHeaders: true, // Inclure les headers standard (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    legacyHeaders: false, // Désactiver les anciens headers (X-RateLimit-*)
    useRedis: isProduction, // Utiliser Redis en production par défaut
    prefix: 'rl' // rate-limit prefix for Redis keys
  };

  // Fusionner les options par défaut avec les options fournies
  const mergedOptions: RateLimiterOptions = { ...defaultOptions, ...options };

  // Configuration du store
  if (mergedOptions.useRedis && redis && redis.isReady) {
    mergedOptions.store = new RedisStore({
      // @ts-expect-error - Known issue with types between redis v4 and rate-limit-redis
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix: mergedOptions.prefix,
    });
  } else if (mergedOptions.useRedis && (!redis || !redis.isReady)) {
    console.warn('Rate Limiter: Redis est configuré pour être utilisé mais le client Redis n\'est pas prêt. Utilisation du MemoryStore par défaut.');
  }

  // Key generator: utilise l'IP par défaut, mais peut être surchargé
  // Si un tenantId ou userId est présent dans la requête (ajouté par des middlewares précédents),
  // on peut les utiliser pour des limites plus granulaires.
  if (!mergedOptions.keyGenerator) {
    mergedOptions.keyGenerator = (req: Request, res: Response): string => {
      let key = req.ip; // Default to IP
      if (req.tenantId) {
        key = `${req.tenantId}:${req.ip}`; // Tenant-specific IP limit
      }
      // Pour des limites par utilisateur authentifié (plus strictes, ex: sur /login)
      // if (req.user?.id) {
      //   key = `${req.user.id}`;
      // }
      return key;
    };
  }
  
  return rateLimit(mergedOptions as Options);
};

/**
 * Rate limiter par défaut pour la plupart des routes API.
 */
export const defaultApiLimiter = rateLimiter();

/**
 * Rate limiter plus strict pour les routes sensibles (ex: authentification, création de compte).
 */
export const strictOperationLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite plus basse pour les opérations sensibles
  message: {
    status: 'error',
    message: 'Trop de tentatives pour cette opération. Veuillez réessayer plus tard.'
  }
});

/**
 * Rate limiter pour la création de nouveaux tenants (pour éviter les abus).
 */
export const tenantCreationLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // Très peu de tentatives par heure par IP
    message: {
        status: 'error',
        message: 'Trop de tentatives de création de compte. Veuillez réessayer plus tard.'
    }
});
