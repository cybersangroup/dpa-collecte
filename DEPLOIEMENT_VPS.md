# Feuille de route — Déploiement DPA Collecte sur VPS

## Architecture cible

```
Internet (HTTPS)
      │
  ┌───▼──────────────────────────────┐
  │  Caddy  (reverse proxy + SSL)    │  ← port 80/443
  └───┬──────────────────────────────┘
      │  réseau Docker interne (dpa_net)
  ┌───┴──────┐  ┌──────────┐  ┌──────────────┐
  │  Next.js │  │ Postgres │  │   MinIO      │
  │  :3000   │  │  :5432   │  │  :9000/:9001 │
  └──────────┘  └──────────┘  └──────────────┘
```

> **Note architecture** : Next.js est un **monolithe full-stack** (frontend + API Routes +
> Server Actions + Auth dans le même conteneur). Pas de séparation frontend/backend nécessaire.
> MinIO remplace Vercel Blob pour le stockage des reçus de paiement.

---

## Phase 1 — Préparation du projet

### 1.1 Mode standalone Next.js

Modifier `next.config.js` (ou `.ts`) pour activer la sortie optimisée :

```js
const nextConfig = {
  output: "standalone",   // ← ajouter
  // ... reste de la config
};
```

Cela génère un dossier `.next/standalone` ultra-léger, sans `node_modules` entiers.

---

### 1.2 Script d'entrée Docker (migrations automatiques)

Créer `scripts/docker-entrypoint.sh` :

```bash
#!/bin/sh
set -e
echo "▶ Running Prisma migrations..."
npx prisma migrate deploy
echo "▶ Starting Next.js..."
exec node server.js
```

---

### 1.3 Dockerfile multi-stage

Créer `Dockerfile` à la racine du projet :

```dockerfile
# ── Stage 1 : dépendances ─────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# ── Stage 2 : build ───────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables nécessaires au build (pas de valeurs sensibles ici)
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3 : runner (image finale légère) ────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copie standalone + assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public
COPY --from=builder                        /app/prisma         ./prisma
COPY --from=deps                           /app/node_modules/.prisma ./node_modules/.prisma
COPY scripts/docker-entrypoint.sh          ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
```

---

### 1.4 .dockerignore

Créer `.dockerignore` à la racine :

```
.git
.next
node_modules
*.env*
.env.local
.env.production
```

---

## Phase 2 — Migration stockage images (Vercel Blob → MinIO)

MinIO expose une API compatible S3 — le SDK AWS peut être réutilisé directement.

### 2.1 Installer le SDK S3

```bash
npm install @aws-sdk/client-s3
```

### 2.2 Remplacer le helper upload dans `app/(app)/inscriptions/actions.ts`

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint:        process.env.MINIO_ENDPOINT,   // ex. http://minio:9000
  region:          "us-east-1",                  // valeur quelconque pour MinIO
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,   // obligatoire avec MinIO
});

export async function uploadRecu(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const key  = `recus/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
  const body = Buffer.from(await file.arrayBuffer());

  await s3.send(new PutObjectCommand({
    Bucket:      process.env.MINIO_BUCKET!,
    Key:         key,
    Body:        body,
    ContentType: file.type,
  }));

  // URL publique du fichier
  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${key}`;
}
```

---

## Phase 3 — Docker Compose (production)

Créer `docker-compose.prod.yml` à la racine du projet :

```yaml
name: dpa-collecte

services:

  # ── Base de données ─────────────────────────────────────
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB:       dpa_collecte
      POSTGRES_USER:     dpa_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks: [dpa_net]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dpa_user"]
      interval: 10s
      retries: 5

  # ── Stockage fichiers (reçus paiements) ─────────────────
  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER:     ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "127.0.0.1:9001:9001"   # console admin (accès local uniquement)
    networks: [dpa_net]

  # ── Application Next.js ──────────────────────────────────
  app:
    image: ghcr.io/cybersangroup/dpa-collecte:latest
    restart: unless-stopped
    depends_on:
      db:    { condition: service_healthy }
      minio: { condition: service_started }
    environment:
      DATABASE_URL:        postgresql://dpa_user:${POSTGRES_PASSWORD}@db:5432/dpa_collecte
      DIRECT_URL:          postgresql://dpa_user:${POSTGRES_PASSWORD}@db:5432/dpa_collecte
      NEXTAUTH_URL:        https://${DOMAIN}
      NEXTAUTH_SECRET:     ${NEXTAUTH_SECRET}
      NEXT_PUBLIC_APP_URL: https://${DOMAIN}
      MINIO_ENDPOINT:      http://minio:9000
      MINIO_ACCESS_KEY:    ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY:    ${MINIO_SECRET_KEY}
      MINIO_BUCKET:        recus
      MINIO_PUBLIC_URL:    https://storage.${DOMAIN}
    networks: [dpa_net]

  # ── Reverse proxy + SSL automatique ─────────────────────
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"   # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [dpa_net]

volumes:
  pgdata:       # données PostgreSQL
  minio_data:   # fichiers MinIO (reçus)
  caddy_data:   # certificats SSL Let's Encrypt
  caddy_config: # configuration Caddy

networks:
  dpa_net:
    driver: bridge
```

---

## Phase 4 — Domaine & SSL (Caddyfile)

Créer `Caddyfile` à la racine du projet :

```caddyfile
# Application principale
dpa.mondomaine.com {
    reverse_proxy app:3000
    encode gzip zstd
}

# Accès public aux fichiers MinIO (reçus de paiement)
storage.dpa.mondomaine.com {
    reverse_proxy minio:9000
}
```

> Caddy gère **Let's Encrypt automatiquement** — aucune configuration SSL manuelle.
> Il suffit que les enregistrements DNS pointent vers le VPS avant le premier démarrage.

### Configuration DNS chez le registrar

| Type | Nom           | Valeur     |
|------|---------------|------------|
| A    | `dpa`         | IP du VPS  |
| A    | `storage.dpa` | IP du VPS  |

Remplacer `mondomaine.com` par le domaine réel dans le Caddyfile et les secrets.

---

## Phase 5 — CI/CD avec GitHub Actions

### 5.1 Secrets GitHub à configurer

Dans le dépôt GitHub : `Settings → Secrets and variables → Actions → New repository secret`

| Secret              | Description                                 |
|---------------------|---------------------------------------------|
| `VPS_HOST`          | IP ou hostname du VPS                       |
| `VPS_USER`          | `deploy` (utilisateur dédié, voir Phase 6)  |
| `VPS_SSH_KEY`       | Clé SSH privée (contenu complet)            |
| `VPS_DEPLOY_PATH`   | `/opt/dpa-collecte`                         |
| `DOMAIN`            | `dpa.mondomaine.com`                        |
| `POSTGRES_PASSWORD` | Mot de passe base de données                |
| `NEXTAUTH_SECRET`   | Secret Auth.js (min. 32 caractères)         |
| `MINIO_ACCESS_KEY`  | Identifiant MinIO                           |
| `MINIO_SECRET_KEY`  | Mot de passe MinIO (min. 8 caractères)      |

### 5.2 Générer la paire de clés SSH dédiée au déploiement

```bash
# Sur ta machine locale
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/dpa_deploy

# Copier la clé publique sur le VPS (dans ~/.ssh/authorized_keys de l'utilisateur deploy)
ssh-copy-id -i ~/.ssh/dpa_deploy.pub deploy@IP_DU_VPS

# Copier le contenu de la clé PRIVÉE dans le secret GitHub VPS_SSH_KEY
cat ~/.ssh/dpa_deploy
```

### 5.3 Workflow `.github/workflows/deploy.yml`

Créer ce fichier dans le dépôt GitHub :

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE:    ghcr.io/${{ github.repository_owner }}/dpa-collecte

jobs:

  # ── Étape 1 : Build de l'image Docker et push sur GHCR ──
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Connexion au registre GitHub (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Activer le cache Docker
        uses: docker/setup-buildx-action@v3

      - name: Build & push de l'image
        uses: docker/build-push-action@v5
        with:
          context: ./collecte-donnees
          push: true
          tags: |
            ${{ env.IMAGE }}:latest
            ${{ env.IMAGE }}:${{ github.sha }}
          build-args: |
            NEXTAUTH_URL=https://${{ secrets.DOMAIN }}
            NEXT_PUBLIC_APP_URL=https://${{ secrets.DOMAIN }}
          cache-from: type=gha
          cache-to:   type=gha,mode=max

  # ── Étape 2 : Déploiement sur le VPS ────────────────────
  deploy:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Copier les fichiers de configuration sur le VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key:      ${{ secrets.VPS_SSH_KEY }}
          source:   "collecte-donnees/docker-compose.prod.yml,collecte-donnees/Caddyfile"
          target:   ${{ secrets.VPS_DEPLOY_PATH }}
          strip_components: 1

      - name: Déployer via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key:      ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd ${{ secrets.VPS_DEPLOY_PATH }}

            # Écriture du fichier .env à partir des secrets
            cat > .env <<'ENVEOF'
            DOMAIN=${{ secrets.DOMAIN }}
            POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
            NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}
            MINIO_ACCESS_KEY=${{ secrets.MINIO_ACCESS_KEY }}
            MINIO_SECRET_KEY=${{ secrets.MINIO_SECRET_KEY }}
            ENVEOF

            # Connexion GHCR pour puller l'image
            echo "${{ secrets.GITHUB_TOKEN }}" | \
              docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # Récupérer la nouvelle image
            docker pull ghcr.io/${{ github.repository_owner }}/dpa-collecte:latest

            # Redémarrer les conteneurs sans interruption
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            # Nettoyage des anciennes images non utilisées
            docker image prune -f

            echo "✅ Déploiement terminé."
```

---

## Phase 6 — Préparation du VPS

Se connecter au VPS en root puis exécuter :

```bash
# 1. Installer Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 2. Créer un utilisateur dédié au déploiement (ne pas utiliser root)
adduser deploy
usermod -aG docker deploy

# 3. Créer le dossier de déploiement
mkdir -p /opt/dpa-collecte
chown deploy:deploy /opt/dpa-collecte

# 4. Ajouter la clé publique SSH GitHub Actions
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "CONTENU_DE_LA_CLE_PUBLIQUE_dpa_deploy.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit

# 5. (Optionnel) Ouvrir uniquement les ports nécessaires sur le pare-feu
ufw allow 22    # SSH
ufw allow 80    # HTTP (redirection Caddy)
ufw allow 443   # HTTPS
ufw enable
```

---

## Phase 7 — Premier déploiement manuel

À faire **une seule fois** sur le VPS, avant que le CI/CD prenne le relais.

```bash
# Se connecter en tant que deploy
ssh deploy@IP_DU_VPS
cd /opt/dpa-collecte

# 1. Créer le fichier .env de production
cat > .env <<EOF
DOMAIN=dpa.mondomaine.com
POSTGRES_PASSWORD=mot_de_passe_fort_ici
NEXTAUTH_SECRET=chaine_aleatoire_32_caracteres_min
MINIO_ACCESS_KEY=dpa_minio_admin
MINIO_SECRET_KEY=mot_de_passe_minio_fort
EOF

# 2. Uploader manuellement les fichiers de config (1ère fois seulement)
# Depuis ta machine locale :
scp collecte-donnees/docker-compose.prod.yml deploy@IP:/opt/dpa-collecte/
scp collecte-donnees/Caddyfile              deploy@IP:/opt/dpa-collecte/

# 3. Démarrer tous les services
docker compose -f docker-compose.prod.yml up -d

# 4. Vérifier que tout tourne
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs app --tail 50

# 5. Initialiser le bucket MinIO (une seule fois)
docker exec -it dpa-collecte-minio-1 sh -c "
  mc alias set local http://localhost:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD &&
  mc mb local/recus &&
  mc anonymous set download local/recus
"

# 6. Seeder la base de données (si vide)
docker exec -it dpa-collecte-app-1 node -e "
  import('./prisma/seed.mjs').then(() => process.exit(0))
"
```

---

## Récapitulatif des volumes Docker

| Volume        | Contenu                          | Criticité       |
|---------------|----------------------------------|-----------------|
| `pgdata`      | Données PostgreSQL               | 🔴 Critique      |
| `minio_data`  | Reçus de paiement (images)       | 🔴 Critique      |
| `caddy_data`  | Certificats SSL Let's Encrypt    | 🟡 Important     |
| `caddy_config`| Configuration Caddy interne      | 🟡 Important     |

### Sauvegarde automatique (cron recommandé)

```bash
# Ajouter dans crontab -e de l'utilisateur deploy
# Backup quotidien à 3h du matin
0 3 * * * /opt/dpa-collecte/scripts/backup.sh
```

Exemple de `scripts/backup.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=/opt/backups/dpa-collecte

mkdir -p $BACKUP_DIR

# Dump PostgreSQL
docker exec dpa-collecte-db-1 \
  pg_dump -U dpa_user dpa_collecte | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Sync MinIO vers stockage externe (ex. Backblaze B2 ou autre S3)
# rclone sync /var/lib/docker/volumes/dpa-collecte_minio_data/_data \
#   backblaze:mon-bucket-backup/minio/$DATE

# Supprimer les backups de plus de 30 jours
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "✅ Backup $DATE terminé."
```

---

## Réseau entre les conteneurs

Tous les services partagent le réseau Docker interne `dpa_net`.
Les conteneurs se parlent **par nom de service** — aucun port externe exposé sauf Caddy.

| Depuis → Vers     | Adresse interne         | Port  |
|-------------------|-------------------------|-------|
| `app` → `db`      | `db:5432`               | 5432  |
| `app` → `minio`   | `minio:9000`            | 9000  |
| `caddy` → `app`   | `app:3000`              | 3000  |
| `caddy` → `minio` | `minio:9000`            | 9000  |

---

## Ordre d'exécution global

```
Étape 1  →  Préparer le VPS (Docker, utilisateur deploy, clé SSH, pare-feu)
Étape 2  →  Configurer le DNS (enregistrements A → IP du VPS)
Étape 3  →  Modifier next.config : output "standalone"
Étape 4  →  Migrer uploadRecu de Vercel Blob vers MinIO (SDK S3)
Étape 5  →  Créer Dockerfile + .dockerignore + docker-entrypoint.sh
Étape 6  →  Créer docker-compose.prod.yml + Caddyfile
Étape 7  →  Ajouter les secrets dans GitHub
Étape 8  →  Créer .github/workflows/deploy.yml
Étape 9  →  Premier déploiement manuel (init BDD + bucket MinIO)
Étape 10 →  Pousser un commit sur main → CI/CD automatique déclenché
Étape 11 →  Vérifier HTTPS, tester l'app en production
Étape 12 →  Fermer le port 9001 (console MinIO) après configuration initiale
Étape 13 →  Mettre en place le cron de sauvegarde
```

---

## Variables d'environnement — référence complète

| Variable              | Exemple                                              | Usage                         |
|-----------------------|------------------------------------------------------|-------------------------------|
| `DATABASE_URL`        | `postgresql://dpa_user:PWD@db:5432/dpa_collecte`     | Prisma (connexion poolée)     |
| `DIRECT_URL`          | `postgresql://dpa_user:PWD@db:5432/dpa_collecte`     | Prisma (migrations directes)  |
| `NEXTAUTH_URL`        | `https://dpa.mondomaine.com`                         | Auth.js                       |
| `NEXTAUTH_SECRET`     | `chaine_aleatoire_32_car_min`                        | Auth.js (JWT signing)         |
| `NEXT_PUBLIC_APP_URL` | `https://dpa.mondomaine.com`                         | QR codes, liens publics       |
| `MINIO_ENDPOINT`      | `http://minio:9000`                                  | Upload reçus (interne)        |
| `MINIO_ACCESS_KEY`    | `dpa_minio_admin`                                    | Authentification MinIO        |
| `MINIO_SECRET_KEY`    | `mot_de_passe_fort`                                  | Authentification MinIO        |
| `MINIO_BUCKET`        | `recus`                                              | Nom du bucket                 |
| `MINIO_PUBLIC_URL`    | `https://storage.dpa.mondomaine.com`                 | URL publique des fichiers     |
