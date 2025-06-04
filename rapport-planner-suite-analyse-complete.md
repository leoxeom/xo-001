# PLANNER Suite  
Analyse 360 ° & Recommandations stratégiques  
*Version 1.0 – Juin 2025*

---

## 1. Introduction
PLANNER Suite est un ensemble modulaire (STAGEPLANNER, BARPLANNER, CLEANPLANNER, SECUREPLANNER, COMMERÇANTS PLANNER, FESTIVALPLANNER) adossé à deux briques transversales : LIFEPLANNER (agenda personnel) et le Profil Social unifié.  
Objectif de ce rapport : fournir une analyse complète – marché & concurrence, choix technologiques, architecture, conformité, modèles économiques – et des recommandations actionnables pour accélérer le go-to-market et sécuriser l’exécution.

---

## 2. Analyse concurrentielle
*(contenu inchangé, voir version précédente)*

---

## 3. Architecture & Technologies recommandées
*(contenu inchangé)*

---

## 4. Conformité réglementaire
*(contenu inchangé)*

---

## 5. Modèles de pricing
*(contenu inchangé)*

---

## 6. Recommandations stratégiques
*(contenu inchangé)*

---

## 7. Conclusion
*(contenu inchangé)*

---

## 8. Intégrations & écosystème technologique

### 8.1. Systèmes de paie français  
| Fournisseur | Type d’intégration | Cas d’usage | Modalités techniques |
|-------------|-------------------|-------------|----------------------|
| **Listo Paye** | Embedded payroll via REST API | Génération bulletins, déclarations sociales automatisées | OAuth2, endpoints `/employees`, `/runs` |
| **PayFit** | Intégration “Connect” (webhooks + API GraphQL) | Push variables de paie (heures, primes, absences) | Webhook sortant (event `payroll_variable.created`) + mutation GraphQL |
| **Pop Paye** | SFTP + API propriétaire | Traitement paie intermittents & sécurité privée | Dépôt fichier CSV + callback JSON |
| **Silae** | Connecteur iProgest (SaaS) | Contrats courts, multi-conventions | SOAP / REST hybride, JWT auth |

*Recommandation :* abstraire ces intégrations via un **Payroll Adapter Service** (pattern adapter), versionné, exposant un schéma commun (`PayrollEventDTO`).  

### 8.2. Notifications & engagement  
- **Firebase Cloud Messaging (FCM)** pour push mobile et web.  
- Priorité haute uniquement pour notifications critiques (Doze mode best practices – Android, FCM 2025).  
- Stockage token avec timestamp, refresh mensuel (cf. Firebase guidelines).

### 8.3. APIs tierces clés  
| Domaine | Fournisseur | Rôle | Notes |
|---------|-------------|------|-------|
| Géolocalisation | Mapbox | Cartes, distance crew → site | RGPD : anonymiser avant persistence |
| Stockage fichiers | AWS S3 + presigned URLs | Plans scène, fiches techniques | Encryption at rest, lifecycle policy 365 j |
| Signatures électroniques | Yousign | Contrats intermittents | eIDAS compliant |
| Paiement | Stripe | Facturation modules et IA vocale crédits | SCA-ready |

---

## 9. Métriques de performance & KPIs

| Catégorie | KPI | Formule | Benchmark SaaS B2B 2025 |
|-----------|-----|---------|-------------------------|
| **Croissance** | ARR | Σ contrats récurrents annuels | >€1 M ARR Year-2 |
|  | MRR growth rate | (MRR_t – MRR_t-1)/MRR_t-1 | 10-15 % mensuel seed |
| **Rétention** | GRR | 1 – Churn $ | ≥ 90 % |
|  | NRR | (ARR début + upsell – churn)/ARR début | 110 % SMB, 120 % Enterprise (SaaStr) |
| **Acquisition** | CAC | Sales + Marketing $ / # nouveaux clients | CAC payback < 12 mois SMB / 18 mois Enterprise |
|  | CAC:LTV | LTV / CAC | ≥ 3:1 |
| **Engagement produit** | DAU/MAU | Quotidien vs mensuel | > 30 % (outil pro) |
| **Satisfaction** | NPS | % promotors – % detractors | > 40 |
| **Churn** | Logo churn | # clients perdus / # total | < 10 % annuel (Enterprise) / < 20 % SMB |
| **Efficiences** | Magic Number | (ARR_t – ARR_t-1) *4 / Sales & Mktg coûts_t-1 | 0.75-1.0 = sain |

*Dashboard* : Metabase + Snowflake, rafraîchissement quotidien via Airbyte.

---

## 10. Investissement & financement

### 10.1. Hypothèses coûts (18 mois)
| Poste | Montant (€k) |
|-------|--------------|
| Dév. produit (9 FTE) | 1 080 |
| UX/UI & PM | 240 |
| DevOps / Cloud | 180 |
| IA vocale (API OpenAI + hosting) | 120 |
| Sales & Marketing (2 pax + budget) | 360 |
| Légal & conformité (RGPD, audits) | 80 |
| **TOTAL** | **2 060 k€** |

### 10.2. Plan de financement
- **Seed** : 2,5 M€ equity (lead VC SaaS + Bpifrance).  
- **Subventions** : BPI i-Nov (100 k€) pour composant IA vocale multilingue.  
- **Crédit Impôt Recherche** : ~90 k€ / an (R&D IA).  
- **Bridge dette innovation** (Banque Pop) : 300 k€ ligne de trésorerie.

*Runway* : 22 mois avec burn mensuel moyen 95 k€.

### 10.3. Valorisation cible
ARR 12 mois = 1,2 M€ → multiple x8 (bench Nordics 2025) → pre-money ≈ 9,6 M€.

---

## 11. Déploiement & infrastructure

| Axe | Recommandations |
|-----|-----------------|
| **Cloud** | AWS – région eu-west-3 (Paris) pour souveraineté. Utiliser ECS Fargate + RDS Postgres Multi-AZ |
| **Scalabilité** | Auto-scaling ECS (CPU>70 %). Base données : partitionnement par `tenant_id`, read replicas pour reporting |
| **CI/CD** | GitHub Actions → ECR → Terraform (IaC) avec Atlantis PR workflow |
| **Monitoring & observabilité** | Prometheus + Grafana ; traces OpenTelemetry, logs centralisés AWS CloudWatch + Loki |
| **Sécurité** | IAM least privilege, SSO (SAML) pour staff, chiffrement KMS, WAF + Shield, scans Snyk |
| **Back-up & DR** | RDS snapshots 30j, S3 cross-region, RTO 4h / RPO 15 min |
| **Compliance** | ISO 27001 roadmap ; Pentest semestriel ; Politique BYOD MDM |
| **Coûts infra** | Budget initial 3 k€/mois (prod + staging), +35 %/an avec croissance utilisateurs |

---

## 12. Annexes
- Glossaire des acronymes  
- Exemple de schéma `PayrollEventDTO`  
- Calendrier précis roadmap 12 mois  

---

### Sources principales
*(liste inchangée + ajouts)*  
- Listo Paye – LinkedIn “embedded payroll” 2025.  
- PayFit – Site officiel, fiche intégrations 2025.  
- Pop Paye – https://poppaye.fr  
- iProgest / Silae – https://iprogest.com  
- Firebase Blog – Best practices FCM 2025.  
- Viking Venture – “Top SaaS KPIs 2025”.  
- HubSpot Blog – “SaaS Metrics” 2024.  
