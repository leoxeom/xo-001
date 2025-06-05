# PLANNER Suite – Analyse complète du repository **xo-001**  
*Version 1.0 – Juin 2025*

---

## 1. Vue d’ensemble du projet
- **Objectif** : fournir une suite modulaire de planification B2B (spectacles, bars, nettoyage, sécurité, retail, festivals) sous modèle freemium SaaS (Home/Pro/Ultra).  
- **Proposition de valeur** : calendrier collaboratif + moteur de règles métier (convention collective, primes, temps de trajet) + exports paie.  
- **Cible** : PME/ETI (10-1000 salariés) ayant des besoins de staffing souples (intermittents, extras, CDDU).  
- **Positionnement** : concurrent direct de Skello, Combo, WhenIWork, avec différenciation verticale (modules sectoriels) et IA (NLP scheduling).  

## 2. Architecture technique détaillée
### 2.1 Stack
| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend (à venir) | Next.js 15, TypeScript, Tailwind CSS, PWA | Interface client (planning drag-n-drop, command palette). |
| Backend | Node.js 18, Express 4, TypeScript, Prisma 4, Redis 7 | API REST multi-tenant, caching, rate-limit. |
| Base de données | PostgreSQL 14 | Modèle relationnel partitionné par `tenant_id`. |
| Notifications | Firebase Cloud Messaging | Push web & mobile. |
| Auth | JWT + BCrypt, refresh-token, rôles RBAC | SSO prévu (SAML/OIDC). |
| Monorepo | Turborepo | Orchestration build/lint/test. |
| Tests | Jest + Supertest | API/unit/integration. |
| DevOps | Docker-compose (local), GitHub Actions CI/CD → AWS ECS Fargate | IaC Terraform (roadmap). |

### 2.2 Structure du code
```
/apps
  /api          -> service Node/Express
/packages       -> (à créer) libs partagées (ui, utils, prisma client)
turbo.json      -> pipelines build/test/dev
docker/         -> Dockerfiles api & web
```
Patterns utilisés :  
- **Layered architecture** (routes → contrôleurs → services → prisma)  
- **Middleware chain** Express (auth, tenant, validation, rate-limit).  
- **Repository pattern** via PrismaClient injection (à factoriser).  
- **Adapter pattern** pour intégrations paie (recommandé §8).

## 3. Analyse du code existant
| Élément | État | Commentaires |
|---------|------|--------------|
| Auth routes & contrôleurs | ✅ complet (login, refresh, invitations, devices). | Bon niveau de validation (`express-validator`), rate-limit fin. |
| StagePlanner routes | 🟡 MVP CRUD + assignations. | Logique métier encore dans contrôleurs ; extraire vers services. |
| Autres modules | ⛔ non implémentés (routes vides). | Squelettes présents. |
| Qualité | ESLint + Prettier configurés, tests unitaires manquants. | 80 % couverture idéale; actuelle ~0 %. |
| Observabilité | Winston + morgan. | Ajouter tracing OpenTelemetry. |

## 4. Modèle de données (Prisma)
### 4.1 Multi-tenancy
```prisma
model Tenant {
  id           String   @id @default(cuid())
  subdomain    String   @unique
  organizations Organization[]
}
```
- Chaque requête porte `tenantId` détecté via sous-domaine ou header `x-tenant-id`.  
- Indices composites (`tenantId, createdAt`) sur tables volumineuses (Event).  

### 4.2 Relations clés
- `Organization 1-n User` (via `organizationId`).  
- `User n-m Role` → `RoleAssignment`.  
- `Event` polymorphe via enum `EventType` + champs optionnels (spectacle, shift, cleaning).  
- `ModuleActivation` (pivot Tenant-ModuleType) pour feature-flag.  

Schéma conforme, mais migrations incomplètes : ajouter contraintes FK ON DELETE CASCADE.

## 5. API & endpoints
- **Base path** `/api`  
- **Auth** JWT Bearer + refresh, cookies httpOnly optionnel.  
- **Principales routes** :
  - `POST /api/auth/login` – obtention access/refresh.
  - `GET  /api/stageplanner/events` – list events (tenant scope).
  - `POST /api/stageplanner/assignments` – assign intermittent.
- **Sécurité**
  - Helmet, CORS whitelist dynamique, rate-limit par IP.
  - TODO : CSRF pour endpoints cookie-based, validation schema Zod côté service.

## 6. Infrastructure & déploiement
- **docker-compose** lance Postgres, Redis, API, Web, PgAdmin.  
- **Dockerfiles** multi-stage (dev/prod), manque layer cache pour `node_modules`.  
- **CI/CD** (non committé) : pipeline GitHub Actions à créer :
  1. Lint/test → build → push image ECR.  
  2. Terraform plan → apply via Atlantis.  
- **Observabilité** : Prometheus/Grafana (roadmap), logs CloudWatch.  
- **Secrets** : .env, prévoir AWS Secrets Manager.

## 7. Fonctionnalités par module
| Module | Statut | Fonctionnalités prévues |
|--------|--------|-------------------------|
| STAGEPLANNER | alpha | Gestion dates spectacle, équipes techniques, intermittents, exports fiche technique. |
| BARPLANNER | backlog | Gestion shifts bar, caisse, inventaire rapide. |
| CLEANPLANNER | backlog | Tournées nettoyage sites, checklist qualité. |
| SECUREPLANNER | backlog | Ronde sécurité, feuille de route agents, main-courante digitale. |
| COMMERÇANTS | backlog | Horaires retail, optimisation coûts travailleurs. |
| FESTIVALPLANNER | backlog | Multisite, billetterie liaison, hébergement staff. |
| LIFEPLANNER (transverse) | backlog | Agenda personnel, vue 360 employé. |

## 8. Recommandations pour la suite
1. **Factoriser packages partagés** (`@planner/prisma`, `@planner/logger`, `@planner/auth`).  
2. **Séparer logique métier** dans dossier `services/` + tests unitaires Jest (>80 %).  
3. **Mettre en place CI/CD** complet GitHub Actions + review apps (Vercel / AWS).  
4. **Implémenter modules restants** en s’appuyant sur schéma générique `Event`.  
5. **Adapter paie** : créer `PayrollAdapterService` + interfaces Listo/PayFit/PopPaye (§rapport).  
6. **Frontend** : démarrer Next.js + Radix UI, hook SWR, calendriers `@fullcalendar/react`.  
7. **Observabilité** : OpenTelemetry + traces Jaeger, metrics Prometheus.  
8. **Scalabilité BDD** : partitionnement logique par `tenant_id` + read-replica lecture dashboard.  
9. **RGPD** : registre traitements, fiches sous-traitants, anonymisation logs >90 j.

## 9. Analyse concurrentielle
| Critère | PLANNER Suite | Skello | Combo | WhenIWork |
|---------|---------------|--------|-------|-----------|
| Verticalisation | Modules sectoriels spécialisés | Généraliste CHR | CHR | Généraliste |
| IA / NLP | ✔ roadmap (slotting auto) | ✖ (prévision simple) | ✖ | ✖ |
| Multi-tenant sous-domaine | ✔ | ✔ | ✔ | ✔ |
| Paie intégrée FR | Connecteurs multiples (plan) | Connecteurs natifs limités | Connecteur PayFit | US focus |
| Tarifs | Freemium Home 0 € / Pro 4 € / Ultra 7 € | 89 €/mois/étab | 79 € | 4 $ user/mo |
| Mobile offline | roadmap PWA | ✔ | ✔ | ✔ |
PLANNER doit accentuer : intégrations paie, IA, UX calendrier 3D, pricing agressif.

## 10. Feuille de route technique (12 mois)
| Trimestre | Objectifs clé | KPIs |
|-----------|--------------|------|
| **T1 2025** | • Monorepo refactor (packages)  <br>• CI/CD prod v1  <br>• Module STAGEPLANNER GA | 95 % tests verts, déploiement 1-clic |
| **T2 2025** | • BARPLANNER & CLEANPLANNER bêta  <br>• Frontend PWA v1  <br>• Observabilité livrée | DAU/MAU 30 %, p95 API < 300 ms |
| **T3 2025** | • PayrollAdapterService  <br>• SECUREPLANNER alpha  <br>• Multi-langues (i18n) | Exports paie Listo/PayFit live |
| **T4 2025** | • LIFEPLANNER intégration  <br>• IA Scheduling v1  <br>• ISO 27001 audit préparation | NPS > 40, uptime > 99.9 % |

---

### Annexes
- Exemple endpoint `GET /api/stageplanner/events?from=2025-06-01&to=2025-06-30`
- Snippet Prisma partition :
```sql
CREATE TABLE event_y2025 PARTITION OF "Event"
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```
- Exemple workflow GitHub Actions `ci.yml` (lint/test/build/push).

Fin du rapport.
