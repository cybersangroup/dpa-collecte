import { PrismaClient, UserRole } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();
const defaultPasswordHash = createHash("sha256").update("ChangeMe123!").digest("hex");

async function main() {
  const cities = [
    { code: "DKR", nom: "Dakar", countryCode: "SN", countryName: "Senegal" },
    { code: "DJIB", nom: "Djibouti", countryCode: "DJ", countryName: "Djibouti" },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { code: city.code },
      update: city,
      create: city,
    });
  }

  const levels = [
    { code: "L1", label: "Licence 1", order: 1 },
    { code: "L2", label: "Licence 2", order: 2 },
    { code: "L3", label: "Licence 3", order: 3 },
    { code: "M1", label: "Master 1", order: 4 },
    { code: "M2", label: "Master 2", order: 5 },
    { code: "DOC", label: "Doctorat", order: 6 },
    { code: "AUTRE", label: "Autre", order: 7 },
  ];

  for (const level of levels) {
    await prisma.studyLevel.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
  }

  const dakar = await prisma.city.findUniqueOrThrow({ where: { code: "DKR" } });
  const djibouti = await prisma.city.findUniqueOrThrow({ where: { code: "DJIB" } });

  await prisma.user.upsert({
    where: { username: "admin.dakar" },
    update: {},
    create: {
      username: "admin.dakar",
      nomComplet: "Admin Dakar",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      cityId: dakar.id,
    },
  });

  await prisma.user.upsert({
    where: { username: "operateur.djib" },
    update: {},
    create: {
      username: "operateur.djib",
      nomComplet: "Operateur Djibouti",
      passwordHash: defaultPasswordHash,
      role: UserRole.OPERATEUR,
      cityId: djibouti.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
