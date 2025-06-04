import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

// Routes pour chaque module
import stageplannerRoutes from './routes/stageplanner.routes';
import barplannerRoutes from './routes/barplanner.routes';
import cleanplannerRoutes from './routes/cleanplanner.routes';
import secureplannerRoutes from './routes/secureplanner.routes';
import commercantsplannerRoutes from './routes/commercantsplanner.routes';
import festivalplannerRoutes from './routes/festivalplanner.routes';
import lifeplannerRoutes from './routes/lifeplanner.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

// Chargement des variables d'environnement
dotenv.config();

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'planner-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Initialisation de Prisma
const prisma = new PrismaClient();

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware pour identifier le tenant
interface TenantRequest extends Request {
  tenantId?: string;
}

const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction) => {
  // Extraire le tenant ID depuis l'en-tête ou le sous-domaine
  const tenantId = req.headers['x-tenant-id'] as string || 
                  (req.hostname.split('.')[0] !== 'api' ? req.hostname.split('.')[0] : undefined);
  
  if (tenantId) {
    req.tenantId = tenantId;
    logger.debug(`Tenant identifié: ${tenantId}`);
  } else {
    // Si pas de tenant spécifique, on considère que c'est une requête globale
    logger.debug('Aucun tenant spécifique identifié');
  }
  
  next();
};

// Configuration des middlewares
app.use(helmet()); // Sécurité HTTP
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://app.planner-suite.com'] 
    : '*',
  credentials: true
}));
app.use(compression()); // Compression des réponses
app.use(express.json({ limit: '10mb' })); // Parsing du corps des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging des requêtes

// Rate limiting pour prévenir les attaques par force brute
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

// Appliquer le rate limiting aux routes d'authentification
app.use('/api/auth', apiLimiter);

// Middleware pour identifier le tenant
app.use(tenantMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stageplanner', stageplannerRoutes);
app.use('/api/barplanner', barplannerRoutes);
app.use('/api/cleanplanner', cleanplannerRoutes);
app.use('/api/secureplanner', secureplannerRoutes);
app.use('/api/commercantsplanner', commercantsplannerRoutes);
app.use('/api/festivalplanner', festivalplannerRoutes);
app.use('/api/lifeplanner', lifeplannerRoutes);

// Route 404 pour les routes non définies
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} non trouvée`
  });
});

// Middleware de gestion des erreurs
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Erreur: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });
  
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Une erreur interne est survenue' 
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Démarrage du serveur
const server = app.listen(PORT, async () => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    logger.info(`Connexion à la base de données établie`);
    logger.info(`Serveur démarré sur le port ${PORT} en mode ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    logger.error('Erreur lors de la connexion à la base de données:', error);
    process.exit(1);
  }
});

// Gestion de l'arrêt propre du serveur
process.on('SIGTERM', async () => {
  logger.info('Signal SIGTERM reçu. Arrêt du serveur...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Serveur arrêté');
    process.exit(0);
  });
});

export default app;
