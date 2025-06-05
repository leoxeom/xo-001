# PLANNER Suite — Application Web (`apps/web`)

Interface Next.js 15 futuriste (glassmorphism + néon) servant de **hub** et de premier module **STAGE PLANNER** pour la PLANNER Suite.

---

## 1. Description

Ce paquet **`web`** fournit :

* un tableau de bord central listant tous les modules (Stage, Bar, Secure, Clean, Commerçants, Festival, Life)
* le module **STAGE PLANNER** (calendrier interactif, stats, CRUD événements)  
* pages Auth (login) et routes utilitaires
* navigation réactive (navbar responsive, notifications, menu utilisateur)
* design sombre + glassmorphism avec animations Framer Motion
* intégration multi-tenant basée sur le sous-domaine

---

## 2. Stack & technologies

| Domaine | Outils |
|---------|--------|
| Framework | **Next.js 15** (App Router, Server/Client Components) |
| Langage | **TypeScript 5** |
| UI & Design | Tailwind CSS 3 + tailwindcss-animate, Radix UI Primitives, Lucide Icons |
| Animations | Framer Motion 11 |
| State / Form | React-hook-form + Zod |
| Auth | Next-Auth v5 (pré-intégré, endpoints backend prêts) |
| HTTP Client | Axios (wrapper `src/lib/api.ts`) |
| Monorepo | Turborepo + Yarn Workspaces |
| Qualité | ESLint 8, Prettier |
| Déploiement | **Vercel** (fichier `vercel.json`) |

---

## 3. Installation & configuration

```bash
# racine du monorepo
yarn install          # installe toutes les dépendances (root + workspaces)
yarn workspace web dev   # lance le serveur Next.js en local (http://localhost:3000)
```

1. Copiez le fichier d’exemple :

```bash
cp apps/web/.env.example apps/web/.env.local
```

2. Renseignez au minimum :

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_SECRET=<votre_secret>
```

> Le backend API Express se lance via `yarn workspace api dev` (port 3001).

---

## 4. Structure du projet

```
apps/web/
├─ .env.example           # variables d'env
├─ package.json           # scripts & deps spécifiques
├─ tailwind.config.js
├─ tsconfig.json
├─ postcss.config.js
├─ vercel.json
└─ src
   ├─ app/                # App Router (layout, pages)
   │  ├─ layout.tsx
   │  ├─ page.tsx         # dashboard / hub
   │  ├─ auth/…           # login, register, reset…
   │  └─ stageplanner/…   # module Stage Planner
   ├─ components/
   │  ├─ layout/          # Navbar, Footer…
   │  └─ ui/              # Toaster, boutons…
   ├─ styles/             # fichiers CSS globaux
   ├─ lib/                # helpers (axios, i18n…)
   ├─ hooks/              # custom hooks
   ├─ contexts/           # contextes React (auth, tenant…)
   ├─ utils/              # fonctions génériques
   └─ types/              # types partagés
```

---

## 5. Scripts disponibles

| Commande (root)                               | Rôle |
|-----------------------------------------------|------|
| `yarn workspace web dev`                      | Lancement Next.js en mode développement |
| `yarn workspace web build`                    | Build production (`.next/`) |
| `yarn workspace web start`                    | Démarrage serveur Next.js prod |
| `yarn workspace web lint`                     | Lint + format |
| `yarn workspace web format`                   | Prettier sur tous les fichiers |
| `yarn dev`                                    | Turborepo : `api` + `web` en parallèle |
| `yarn docker:up`                              | Stack complète via docker-compose (db, redis, api) |

---

## 6. Déploiement (Vercel)

* **Projet GitHub connecté à Vercel** : chaque push sur `main` ou `feat/frontend-v1` déclenche un build automatique.
* Fichier [`apps/web/vercel.json`](./vercel.json) :
  * headers de sécurité, rewrites `/api/*` vers backend
  * variables d’environnement de production
  * régions : `cdg1` (Paris)
* Build command dans Vercel : `yarn workspace web build`
* Output directory : `.next`

---

## 7. Guide de développement

1. Créez une branche : `git checkout -b feat/<votre-feature>`.
2. Développez en suivant l’architecture **atomic component** (UI <= components/layout <= pages).
3. Utilisez `cn()` (`src/utils/cn.ts`) pour composer les classes Tailwind.
4. Ajoutez vos animations avec Framer Motion :
   ```tsx
   <motion.div initial={{opacity:0}} animate={{opacity:1}} />
   ```
5. Vérifiez le lint : `yarn workspace web lint`.
6. Commits conventionnels (`feat:`, `fix:`, `chore:`…) obligatoires.
7. Ouvrez une PR ; la CI GitHub Actions lance `yarn turbo run lint build`.
8. Après merge sur `main`, Vercel déploie automatiquement.

---

## 8. Roadmap prochaines versions

| Version | Contenu |
|---------|---------|
| **1.1** | Command Palette globale ⌘K, mode clair, tests Playwright |
| **1.2** | CRUD complet via API, persistence calendrier, drag-and-drop |
| **1.3** | Modules BAR / SECURE en bêta |
| **2.0** | Temps réel (WebSockets), IA d’optimisation planning |

---

### Support

Pour toute question : `@davidmarchand` sur Slack ou créez un ticket GitHub.
