# DPA Collecte

Interface de collecte d'étudiants pour Digital Profsan Academy (DPA), avec:

- formulaires opérateur et QR public,
- dashboard d'administration,
- base PostgreSQL (Prisma),
- exécution Docker.

## 1) Démarrage local (sans Docker)

```bash
npm install
npm run dev
```

Application: `http://localhost:3000`

**Accès depuis le réseau local (ex. `http://192.168.x.x:3000`)**  
Le script `dev` écoute sur `0.0.0.0` pour accepter l’IP LAN. Alignez dans `.env` :

- `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_URL`

sur la **même URL** que celle utilisée dans le navigateur (sinon cookies / requêtes RSC peuvent échouer).

## 2) Démarrage Docker (app + postgres)

Prerequis: Docker Desktop démarré.

```bash
docker compose up --build
```

- App: `http://localhost:3000`
- DB: `localhost:5432`

Stop:

```bash
docker compose down
```

## 3) Prisma + PostgreSQL

Variables d'environnement (voir `.env.example`):

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

Commandes utiles:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## 4) QR et test mobile

Les QR sont maintenant **réels et scannables**.  
Important: pour scanner depuis un téléphone, le QR doit pointer vers une URL atteignable par le mobile.

- En local pur: `http://localhost:3000` ne marche pas depuis un autre appareil.
- Utiliser l'IP LAN de la machine hôte, ex: `http://192.168.1.20:3000`.
- Définir `NEXT_PUBLIC_APP_URL` avec cette valeur.
