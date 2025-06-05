#!/bin/sh
# Vercel build script for the 'web' application in a Yarn 1.x / Turborepo monorepo.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Vercel build script (scripts/build-vercel.sh) started..."
echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# This script assumes it is being executed from the monorepo root.
# The buildCommand in apps/web/vercel.json should ensure this, for example:
# "buildCommand": "cd ../.. && sh ./scripts/build-vercel.sh"
# This navigates from apps/web to the monorepo root and then executes this script.

echo "Running Turborepo build for the 'web' application..."

# Using Turborepo to build the 'web' application.
# The --filter=web flag targets the 'web' workspace/package.
# Turborepo will handle the build process as defined in the 'web' package's package.json build script.
# The output is expected to be in 'apps/web/.next' if 'web' is a Next.js app.
turbo run build --filter=web

echo "Turborepo build for 'web' application completed successfully."
echo "Vercel build script (scripts/build-vercel.sh) finished."
