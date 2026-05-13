# ── Stage 1 : dépendances ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# ── Stage 2 : build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables nécessaires au build
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL
# DATABASE_URL factice pour satisfaire Prisma à la compilation (pas de connexion réelle)
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN npm run build

# ── Stage 3 : runner (image finale légère) ────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copier le build standalone + assets statiques
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

# Copier le schéma Prisma (nécessaire pour les migrations au démarrage)
COPY --from=builder /app/prisma ./prisma

# Copier le client Prisma compilé
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Script de démarrage (migrations + lancement)
COPY scripts/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
