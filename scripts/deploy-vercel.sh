#!/bin/bash

# =====================================================
# Script de déploiement Vercel pour PLANNER Suite
# =====================================================

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Fonction pour vérifier si une commande existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Vérifier si Vercel CLI est installé
if ! command_exists vercel; then
  error "Vercel CLI n'est pas installé. Installation en cours..."
  npm install -g vercel
  if [ $? -ne 0 ]; then
    error "Échec de l'installation de Vercel CLI. Veuillez l'installer manuellement avec 'npm install -g vercel'."
    exit 1
  fi
  success "Vercel CLI installé avec succès."
fi

# Vérifier si l'utilisateur est connecté à Vercel
vercel whoami &>/dev/null
if [ $? -ne 0 ]; then
  warn "Vous n'êtes pas connecté à Vercel. Connexion en cours..."
  vercel login
  if [ $? -ne 0 ]; then
    error "Échec de la connexion à Vercel. Veuillez vous connecter manuellement avec 'vercel login'."
    exit 1
  fi
fi

# Définir les variables par défaut
ENVIRONMENT="production"
PROJECT_ROOT=$(pwd)
APP_DIR="apps/web"
TEAM=""
BUILD_FIRST=true
FORCE_DEPLOY=false

# Afficher l'aide
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --env ENV        Environnement de déploiement (production, preview) [défaut: production]"
  echo "  -d, --dir DIR        Répertoire de l'application à déployer [défaut: apps/web]"
  echo "  -t, --team TEAM      Équipe Vercel à utiliser"
  echo "  --no-build           Ne pas construire l'application avant le déploiement"
  echo "  -f, --force          Forcer le déploiement même en cas d'erreurs"
  echo "  -h, --help           Afficher cette aide"
  echo ""
  exit 0
}

# Analyser les arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -d|--dir)
      APP_DIR="$2"
      shift 2
      ;;
    -t|--team)
      TEAM="--scope $2"
      shift 2
      ;;
    --no-build)
      BUILD_FIRST=false
      shift
      ;;
    -f|--force)
      FORCE_DEPLOY=true
      shift
      ;;
    -h|--help)
      show_help
      ;;
    *)
      error "Option inconnue: $1"
      show_help
      ;;
  esac
done

# Vérifier si le répertoire de l'application existe
if [ ! -d "$PROJECT_ROOT/$APP_DIR" ]; then
  error "Le répertoire '$APP_DIR' n'existe pas. Veuillez vérifier le chemin."
  exit 1
fi

# Construire l'application si nécessaire
if [ "$BUILD_FIRST" = true ]; then
  log "Construction de l'application avant le déploiement..."
  cd "$PROJECT_ROOT" || exit 1
  
  if [ -f "yarn.lock" ]; then
    yarn workspace web build
  elif [ -f "package-lock.json" ]; then
    npm run build --workspace=web
  else
    cd "$APP_DIR" || exit 1
    npm run build
    cd "$PROJECT_ROOT" || exit 1
  fi
  
  if [ $? -ne 0 ] && [ "$FORCE_DEPLOY" = false ]; then
    error "Échec de la construction. Déploiement annulé."
    exit 1
  elif [ $? -ne 0 ]; then
    warn "Échec de la construction, mais le déploiement continue en raison de l'option --force."
  else
    success "Construction terminée avec succès."
  fi
fi

# Se déplacer dans le répertoire de l'application
cd "$PROJECT_ROOT/$APP_DIR" || exit 1

# Définir les options de déploiement
DEPLOY_OPTIONS=""

if [ "$ENVIRONMENT" = "production" ]; then
  DEPLOY_OPTIONS="--prod"
  log "Déploiement en PRODUCTION..."
else
  log "Déploiement en PREVIEW..."
fi

# Exécuter le déploiement
log "Déploiement de l'application sur Vercel..."
vercel $TEAM $DEPLOY_OPTIONS

if [ $? -ne 0 ]; then
  error "Échec du déploiement sur Vercel."
  exit 1
fi

success "Déploiement terminé avec succès!"

# Afficher les informations post-déploiement
log "Vous pouvez voir votre déploiement sur le tableau de bord Vercel:"
echo "https://vercel.com/dashboard"

exit 0
