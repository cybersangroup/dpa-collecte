-- CreateEnum ProfileType
CREATE TYPE "ProfileType" AS ENUM ('ETUDIANT_ELEVE', 'PROF', 'SURVEILLANT', 'PARENT');

-- Ajouter les nouvelles colonnes à Student
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "profileType"    "ProfileType" NOT NULL DEFAULT 'ETUDIANT_ELEVE',
  ADD COLUMN IF NOT EXISTS "nom"            TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "prenom"         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "genre"          TEXT,
  ADD COLUMN IF NOT EXISTS "age"            INTEGER,
  ADD COLUMN IF NOT EXISTS "dateNaissance"  TEXT,
  ADD COLUMN IF NOT EXISTS "niveauScolaire" TEXT,
  ADD COLUMN IF NOT EXISTS "classe"         TEXT,
  ADD COLUMN IF NOT EXISTS "nombreEleves"   INTEGER,
  ADD COLUMN IF NOT EXISTS "etablissement"  TEXT;

-- Migrer nomComplet → nom + prenom (pour les données existantes)
UPDATE "Student"
SET
  "prenom" = TRIM(SPLIT_PART("nomComplet", ' ', 1)),
  "nom"    = TRIM(SUBSTRING("nomComplet" FROM POSITION(' ' IN "nomComplet") + 1))
WHERE "nomComplet" IS NOT NULL AND "nomComplet" != '';

-- Rendre adresse nullable
ALTER TABLE "Student" ALTER COLUMN "adresse" DROP NOT NULL;

-- Supprimer la clé étrangère vers StudyLevel
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_studyLevelId_fkey";

-- Supprimer les colonnes obsolètes
ALTER TABLE "Student"
  DROP COLUMN IF EXISTS "nomComplet",
  DROP COLUMN IF EXISTS "studyLevelId";

-- Mettre à jour les index
DROP INDEX IF EXISTS "Student_nomComplet_idx";
CREATE INDEX IF NOT EXISTS "Student_nom_idx" ON "Student"("nom");
