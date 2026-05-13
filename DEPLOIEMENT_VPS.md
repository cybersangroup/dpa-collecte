# Feuille de route — Déploiement DPA Collecte sur VPS
## (avec Nginx Proxy Manager)

## Architecture cible

```
Internet (HTTPS)
      │
  ┌───▼──────────────────────────────────────┐
  │  Nginx Proxy Manager  (déjà installé)    │  ← ports 80 / 443
  │  Interface admin sur :81                 │
  └───┬──────────────────────────────────────┘
      │  proxy vers l'hôte Docker (127.0.0.1)
  ┌───┴──────────┐  ┌──────────┐  ┌──────────────┐
  │  Next.js     │  │ Postgres │  │   MinIO      │
  │  :3000       │  │  :5432   │  │  :9000/:9001 │
  └──────────────┘  └──────────┘  └──────────────┘
         ↑ réseau Docker interne (dpa_net)
```

> **Note** : NPM est déjà en place sur le VPS. Les conteneurs DPA exposent leurs ports
> **uniquement sur l'interface loopback** (`127.0.0.1`) pour que NPM les atteigne sans les
> exposer à Internet. MinIO n'expose que la console admin (`:9001`) en local.

> **Note architecture** : Next.js est un **monolithe full-stack** (frontend + API Routes +
> Server Actions + Auth dans le même conteneur). Pas de séparation frontend/backend.

---

## Phase 1 — Préparation du projet

### 1.1 Mode standalone Next.js

`next.config.ts` a déjà `output: "standalone"` — rien à faire.

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

Rendre exécutable localement (Linux/Mac) :
```bash
chmod +x scripts/docker-entrypoint.sh
```

---

### 1.3 Dockerfile multi-stage

Créer `Dockerfile` à la racine du projet (`collecte-donnees/`) :

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

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder                        /app/prisma           ./prisma
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

### 2.1 Installer le SDK S3

```bash
cd collecte-donnees
npm install @aws-sdk/client-s3
```

### 2.2 Remplacer le helper upload dans `app/(app)/inscriptions/actions.ts`

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint:    process.env.MINIO_ENDPOINT,   // ex. http://minio:9000
  region:      "us-east-1",                  // valeur quelconque pour MinIO
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
      # API MinIO — NPM proxiera vers ce port pour les fichiers publics
      - "127.0.0.1:9000:9000"
      # Console admin — accès local uniquement (fermer après config initiale)
      - "127.0.0.1:9001:9001"
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
    ports:
      # Exposé uniquement sur localhost — NPM proxiera vers ce port
      - "127.0.0.1:3000:3000"
    networks: [dpa_net]

volumes:
  pgdata:     # données PostgreSQL
  minio_data: # fichiers MinIO (reçus)

networks:
  dpa_net:
    driver: bridge
```

> **Sécurité** : aucun port n'est ouvert sur `0.0.0.0`. Seul NPM (déjà en place)
> est exposé sur Internet via les ports 80/443.

---

## Phase 4 — Configuration Nginx Proxy Manager

NPM est déjà installé et accessible via son interface web sur `http://IP_DU_VPS:81`.

### 4.1 Enregistrements DNS (à faire en premier)

Chez le registrar (ou dans la zone DNS du domaine) :

| Type | Nom              | Valeur    | TTL  |
|------|------------------|-----------|------|
| A    | `dpa`            | IP du VPS | 300  |
| A    | `storage.dpa`    | IP du VPS | 300  |

Remplacer `dpa.mondomaine.com` par le vrai domaine partout.

---

### 4.2 Proxy Host — Application principale

Dans l'interface NPM (`http://IP:81`) :

**Hosts → Proxy Hosts → Add Proxy Host**

| Champ                  | Valeur                     |
|------------------------|----------------------------|
| Domain Names           | `dpa.mondomaine.com`       |
| Scheme                 | `http`                     |
| Forward Hostname / IP  | `127.0.0.1`                |
| Forward Port           | `3000`                     |
| Cache Assets           | ☑ activé                  |
| Block Common Exploits  | ☑ activé                  |
| Websockets Support     | ☑ activé                  |

**Onglet SSL :**

| Champ                  | Valeur                     |
|------------------------|----------------------------|
| SSL Certificate        | Request a new SSL Certificate |
| Force SSL              | ☑ activé                  |
| HTTP/2 Support         | ☑ activé                  |
| Email (Let's Encrypt)  | adresse e-mail réelle      |

Cliquer **Save** — NPM génère le certificat automatiquement.

---

### 4.3 Proxy Host — MinIO (fichiers publics)

**Hosts → Proxy Hosts → Add Proxy Host**

| Champ                  | Valeur                      |
|------------------------|-----------------------------|
| Domain Names           | `storage.dpa.mondomaine.com`|
| Scheme                 | `http`                      |
| Forward Hostname / IP  | `127.0.0.1`                 |
| Forward Port           | `9000`                      |
| Cache Assets           | ☑ activé                   |
| Block Common Exploits  | ☑ activé                   |

**Onglet SSL :** même procédure que l'app principale.

> Ce sous-domaine sert les reçus de paiement (images). NPM le proxie vers l'API MinIO.

---

### 4.4 Paramètre client_max_body_size (upload reçus)

Par défaut Nginx limite les uploads à **1 Mo**. Les reçus de paiement peuvent être plus lourds.

Dans NPM, sur le proxy host de l'application :

**Onglet Advanced → Custom Nginx Configuration :**

```nginx
client_max_body_size 10m;
```

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

# Copier la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/dpa_deploy.pub deploy@IP_DU_VPS

# Afficher la clé privée à coller dans le secret GitHub VPS_SSH_KEY
cat ~/.ssh/dpa_deploy
```

### 5.3 Workflow `.github/workflows/deploy.yml`

Créer ce fichier dans le dépôt :

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE:    ghcr.io/${{ github.repository_owner }}/dpa-collecte

jobs:

  # ── Étape 1 : Build et push de l'image Docker ────────────
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Connexion GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Activer le cache Docker
        uses: docker/setup-buildx-action@v3

      - name: Build & push
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

  # ── Étape 2 : Déploiement sur le VPS ─────────────────────
  deploy:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Copier docker-compose.prod.yml sur le VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key:      ${{ secrets.VPS_SSH_KEY }}
          source:   "collecte-donnees/docker-compose.prod.yml"
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

            # Écrire le fichier .env à partir des secrets GitHub
            cat > .env << 'ENVEOF'
            DOMAIN=${{ secrets.DOMAIN }}
            POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
            NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}
            MINIO_ACCESS_KEY=${{ secrets.MINIO_ACCESS_KEY }}
            MINIO_SECRET_KEY=${{ secrets.MINIO_SECRET_KEY }}
            ENVEOF

            # Connexion GHCR pour puller la nouvelle image
            echo "${{ secrets.GITHUB_TOKEN }}" | \
              docker login ghcr.io -u ${{ github.actor }} --password-stdin

            docker pull ghcr.io/${{ github.repository_owner }}/dpa-collecte:latest

            # Redémarrer les conteneurs
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            # Nettoyage
            docker image prune -f

            echo "✅ Déploiement terminé."
```

---

## Phase 6 — Préparation du VPS

Se connecter en root et exécuter :

```bash
# 1. Installer Docker (si pas déjà fait — NPM l'utilise déjà, Docker est présent)
# Vérifier : docker --version

# 2. Créer un utilisateur dédié au déploiement
adduser deploy
usermod -aG docker deploy

# 3. Créer le dossier de déploiement
mkdir -p /opt/dpa-collecte
chown deploy:deploy /opt/dpa-collecte

# 4. Ajouter la clé publique SSH GitHub Actions
su - deploy
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "CONTENU_DE_dpa_deploy.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit

# 5. Pare-feu — seuls les ports de NPM doivent être ouverts
#    (80, 443, 81 pour l'admin NPM — déjà configurés si NPM fonctionne)
#    Ne pas ouvrir 3000 ni 9000 sur l'interface publique
ufw status
```

> Si NPM tourne déjà, Docker est déjà installé et les ports 80/443 déjà ouverts.

---

## Phase 7 — Premier déploiement manuel

À faire **une seule fois** sur le VPS, avant que CI/CD prenne le relais.

```bash
ssh deploy@IP_DU_VPS
cd /opt/dpa-collecte

# 1. Créer le fichier .env
cat > .env << 'EOF'
DOMAIN=dpa.mondomaine.com
POSTGRES_PASSWORD=mot_de_passe_fort_ici
NEXTAUTH_SECRET=$(openssl rand -base64 32)
MINIO_ACCESS_KEY=dpa_minio_admin
MINIO_SECRET_KEY=mot_de_passe_minio_fort
EOF

# 2. Uploader docker-compose.prod.yml (depuis ta machine locale)
# scp collecte-donnees/docker-compose.prod.yml deploy@IP:/opt/dpa-collecte/

# 3. Puller l'image et démarrer les services
docker login ghcr.io -u TON_USERNAME_GITHUB
docker pull ghcr.io/cybersangroup/dpa-collecte:latest
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

# 6. Seeder la base si vide
docker exec -it dpa-collecte-app-1 node -e "
  import('./prisma/seed.mjs').then(() => process.exit(0))
"

# 7. Créer le compte admin
docker exec -it dpa-collecte-app-1 node scripts/create-admin.mjs
```

---

## Phase 8 — Configurer NPM (après démarrage des conteneurs)

Une fois les conteneurs démarrés, créer les deux proxy hosts comme décrit en **Phase 4**.

Vérifier que les deux URL fonctionnent en HTTPS :
- `https://dpa.mondomaine.com` → l'application
- `https://storage.dpa.mondomaine.com` → MinIO (accès fichiers)

Tester depuis un navigateur, vérifier le cadenas SSL.

---

## Récapitulatif des volumes Docker

| Volume       | Contenu                     | Criticité    |
|--------------|-----------------------------|--------------|
| `pgdata`     | Données PostgreSQL          | 🔴 Critique   |
| `minio_data` | Reçus de paiement (images)  | 🔴 Critique   |

> NPM gère ses propres certificats et données dans ses propres volumes Docker.

### Sauvegarde automatique (cron recommandé)

```bash
# Ajouter dans crontab -e (en tant que deploy)
0 3 * * * /opt/dpa-collecte/scripts/backup.sh
```

Créer `scripts/backup.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=/opt/backups/dpa-collecte
mkdir -p $BACKUP_DIR

# Dump PostgreSQL
docker exec dpa-collecte-db-1 \
  pg_dump -U dpa_user dpa_collecte | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Supprimer les backups de plus de 30 jours
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "✅ Backup $DATE terminé."
```

---

## Réseau entre les conteneurs

| Depuis → Vers   | Adresse interne  | Port |
|-----------------|------------------|------|
| `app` → `db`    | `db:5432`        | 5432 |
| `app` → `minio` | `minio:9000`     | 9000 |
| NPM → `app`     | `127.0.0.1:3000` | 3000 |
| NPM → `minio`   | `127.0.0.1:9000` | 9000 |

NPM et les conteneurs DPA ne sont **pas sur le même réseau Docker** — NPM accède
aux services via `127.0.0.1` (interface loopback de l'hôte), ce qui est sécurisé
car ces ports ne sont pas exposés à l'extérieur.

---

## Ordre d'exécution global

```
Étape 1  →  Préparer le VPS (utilisateur deploy, clé SSH)
Étape 2  →  Configurer le DNS (enregistrements A → IP du VPS)
Étape 3  →  Migrer uploadRecu : Vercel Blob → MinIO (SDK S3)
Étape 4  →  Créer Dockerfile + .dockerignore + docker-entrypoint.sh
Étape 5  →  Créer docker-compose.prod.yml
Étape 6  →  Ajouter les secrets dans GitHub
Étape 7  →  Créer .github/workflows/deploy.yml
Étape 8  →  Premier déploiement manuel (init BDD + bucket MinIO)
Étape 9  →  Configurer les deux Proxy Hosts dans NPM (+ SSL Let's Encrypt)
Étape 10 →  Vérifier HTTPS sur les deux sous-domaines
Étape 11 →  Pousser un commit sur main → CI/CD automatique activé
Étape 12 →  Fermer le port 9001 (console MinIO) dans le pare-feu après init
Étape 13 →  Mettre en place le cron de sauvegarde
```

---

## Variables d'environnement — référence complète

| Variable              | Exemple                                           | Usage                        |
|-----------------------|---------------------------------------------------|------------------------------|
| `DATABASE_URL`        | `postgresql://dpa_user:PWD@db:5432/dpa_collecte`  | Prisma (connexion poolée)    |
| `DIRECT_URL`          | `postgresql://dpa_user:PWD@db:5432/dpa_collecte`  | Prisma (migrations)          |
| `NEXTAUTH_URL`        | `https://dpa.mondomaine.com`                      | Auth.js                      |
| `NEXTAUTH_SECRET`     | `chaine_aleatoire_32_car_min`                     | Auth.js (JWT signing)        |
| `NEXT_PUBLIC_APP_URL` | `https://dpa.mondomaine.com`                      | QR codes, liens publics      |
| `MINIO_ENDPOINT`      | `http://minio:9000`                               | Upload reçus (réseau interne)|
| `MINIO_ACCESS_KEY`    | `dpa_minio_admin`                                 | Auth MinIO                   |
| `MINIO_SECRET_KEY`    | `mot_de_passe_fort`                               | Auth MinIO                   |
| `MINIO_BUCKET`        | `recus`                                           | Nom du bucket                |
| `MINIO_PUBLIC_URL`    | `https://storage.dpa.mondomaine.com`              | URL publique des fichiers    |
