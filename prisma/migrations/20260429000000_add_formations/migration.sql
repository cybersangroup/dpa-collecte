-- CreateEnum
CREATE TYPE "CategorieFormation" AS ENUM ('ENFANT', 'ADULTE');

-- CreateEnum
CREATE TYPE "TypeInscrit" AS ENUM ('ADULTE', 'PARENT');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE');

-- CreateTable
CREATE TABLE "Formation" (
    "id"          TEXT NOT NULL,
    "nom"         TEXT NOT NULL,
    "description" TEXT,
    "categorie"   "CategorieFormation" NOT NULL,
    "duree"       TEXT,
    "prix"        TEXT,
    "devise"      TEXT NOT NULL DEFAULT 'FCFA',
    "frequence"   TEXT,
    "jours"       TEXT,
    "actif"       BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationShift" (
    "id"          TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "label"       TEXT NOT NULL,
    "heureDebut"  TEXT NOT NULL,
    "heureFin"    TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormationShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id"            TEXT NOT NULL,
    "type"          "TypeInscrit" NOT NULL,
    "statut"        "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "nomParent"     TEXT,
    "telephone"     TEXT NOT NULL,
    "countryCode"   TEXT,
    "adresse"       TEXT,
    "formationId"   TEXT NOT NULL,
    "shiftId"       TEXT,
    "modeFormation" TEXT,
    "recuUrl"       TEXT,
    "addedById"     TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscriptionEnfant" (
    "id"            TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "nom"           TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscriptionEnfant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Formation_nom_key" ON "Formation"("nom");

-- CreateIndex
CREATE INDEX "Formation_categorie_actif_idx" ON "Formation"("categorie", "actif");

-- CreateIndex
CREATE INDEX "FormationShift_formationId_idx" ON "FormationShift"("formationId");

-- CreateIndex
CREATE INDEX "Inscription_formationId_createdAt_idx" ON "Inscription"("formationId", "createdAt");

-- CreateIndex
CREATE INDEX "Inscription_telephone_idx" ON "Inscription"("telephone");

-- CreateIndex
CREATE INDEX "InscriptionEnfant_inscriptionId_idx" ON "InscriptionEnfant"("inscriptionId");

-- AddForeignKey
ALTER TABLE "FormationShift" ADD CONSTRAINT "FormationShift_formationId_fkey"
    FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_formationId_fkey"
    FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "FormationShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_addedById_fkey"
    FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscriptionEnfant" ADD CONSTRAINT "InscriptionEnfant_inscriptionId_fkey"
    FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
