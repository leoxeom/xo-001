import { User, Organization, Role, Permission, Profile } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /**
       * ID du tenant identifié par le middleware `tenantIdentifier` ou `tenantRequired`.
       */
      tenantId?: string;

      /**
       * Objet utilisateur authentifié, enrichi par le middleware `authenticate`.
       * Contient les informations de base de l'utilisateur, son profil, son organisation,
       * ainsi que ses rôles et permissions agrégées.
       */
      user?: User & { // User de Prisma contient déjà email, status, organizationId, etc.
        profile?: Profile | null; // Le profil complet de Prisma, peut être null si non existant.
        organization?: Organization | null; // L'organisation complète de Prisma, peut être null.
        roles?: (Role & { // Role de Prisma
          permissions: Permission[]; // Permission de Prisma
        })[];
      };

      /**
       * ID de l'organisation de l'utilisateur authentifié.
       * Directement extrait de `user.organizationId` pour un accès rapide.
       */
      organizationId?: string;

      /**
       * Liste des noms des permissions agrégées de l'utilisateur authentifié.
       * Calculée à partir de tous les rôles de l'utilisateur.
       */
      permissions?: string[];

      /**
       * Contexte optionnel pour le logging et le traçage des requêtes.
       */
      requestContext?: {
        requestId: string;
        startTime: number;
        sourceIp?: string;
        userAgent?: string;
      };
    }
  }
}

// Cette ligne est nécessaire pour que le fichier soit traité comme un module et puisse étendre des types globaux.
export {};
