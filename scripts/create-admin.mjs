import { PrismaClient, UserRole } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin.dpa";
  const nomComplet = process.env.ADMIN_FULLNAME ?? "Admin DPA";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const cityCode = process.env.ADMIN_CITY_CODE ?? "DKR";

  const city = await prisma.city.findUnique({ where: { code: cityCode } });
  if (!city) {
    throw new Error(`Ville ${cityCode} introuvable. Lance d'abord: npm run db:seed`);
  }

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      nomComplet,
      role: UserRole.ADMIN,
      cityId: city.id,
      actif: true,
      passwordHash: hashPassword(password),
    },
    create: {
      username,
      nomComplet,
      role: UserRole.ADMIN,
      cityId: city.id,
      actif: true,
      passwordHash: hashPassword(password),
    },
  });

  console.log(`Admin prêt: ${admin.username} (${city.code})`);
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
