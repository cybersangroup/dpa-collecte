import { PrismaClient, UserRole } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();
const defaultPasswordHash = createHash("sha256").update("ChangeMe123!").digest("hex");

async function main() {
  // Villes
  const cities = [
    { code: "DKR",  nom: "Dakar",     countryCode: "SN", countryName: "Senegal"  },
    { code: "DJIB", nom: "Djibouti",  countryCode: "DJ", countryName: "Djibouti" },
  ];
  for (const city of cities) {
    await prisma.city.upsert({ where: { code: city.code }, update: city, create: city });
  }

  const dakar    = await prisma.city.findUniqueOrThrow({ where: { code: "DKR"  } });
  const djibouti = await prisma.city.findUniqueOrThrow({ where: { code: "DJIB" } });

  // Utilisateurs
  await prisma.user.upsert({
    where:  { username: "admin.dakar" },
    update: {},
    create: { username: "admin.dakar", nomComplet: "Admin Dakar", passwordHash: defaultPasswordHash, role: UserRole.ADMIN, cityId: dakar.id },
  });
  await prisma.user.upsert({
    where:  { username: "operateur.djib" },
    update: {},
    create: { username: "operateur.djib", nomComplet: "Operateur Djibouti", passwordHash: defaultPasswordHash, role: UserRole.OPERATEUR, cityId: djibouti.id },
  });

  // Formations d'été
  const formations = [
    // ── Enfants ──
    { nom: "Initiation à la programmation avec Scratch",   description: "Apprendre les bases de la logique de programmation via Scratch, idéal pour les 8–14 ans.", categorie: "ENFANT", duree: "2 semaines", prix: "15 000", devise: "FCFA" },
    { nom: "Création de jeux vidéo (Scratch avancé)",       description: "Concevoir et publier un petit jeu interactif avec Scratch.",                                 categorie: "ENFANT", duree: "2 semaines", prix: "18 000", devise: "FCFA" },
    { nom: "Introduction au dessin numérique",              description: "Utiliser une tablette et des outils créatifs numériques pour dessiner et animer.",           categorie: "ENFANT", duree: "1 semaine",  prix: "12 000", devise: "FCFA" },
    { nom: "Atelier robotique (LEGO Mindstorms)",           description: "Construire et programmer un robot LEGO pour les 10–16 ans.",                                 categorie: "ENFANT", duree: "3 jours",    prix: "20 000", devise: "FCFA" },
    { nom: "Bureautique pour ados (Word & Excel)",          description: "Maîtriser les outils bureautiques essentiels pour l'école.",                                  categorie: "ENFANT", duree: "1 semaine",  prix: "10 000", devise: "FCFA" },
    // ── Adultes ──
    { nom: "Formation CCNA Cisco (Réseaux)",                description: "Préparation à la certification CCNA : infrastructure réseau, routage, commutation.",         categorie: "ADULTE", duree: "4 semaines", prix: "75 000", devise: "FCFA" },
    { nom: "Développement web (HTML / CSS / JS)",           description: "Créer des sites web modernes et responsives de A à Z.",                                      categorie: "ADULTE", duree: "3 semaines", prix: "50 000", devise: "FCFA" },
    { nom: "Python pour débutants",                         description: "Bases du langage Python : variables, boucles, fonctions, projets pratiques.",                categorie: "ADULTE", duree: "2 semaines", prix: "35 000", devise: "FCFA" },
    { nom: "Cybersécurité fondamentale",                    description: "Comprendre les menaces, protéger ses systèmes et se préparer aux certifications CompTIA.",   categorie: "ADULTE", duree: "3 semaines", prix: "60 000", devise: "FCFA" },
    { nom: "Excel & Analyse de données",                    description: "Tableaux croisés dynamiques, formules avancées, Power Query et initiation à Power BI.",      categorie: "ADULTE", duree: "2 semaines", prix: "30 000", devise: "FCFA" },
    { nom: "Linux & Administration système",                description: "Gestion d'un serveur Linux : commandes shell, droits, services, sécurité de base.",          categorie: "ADULTE", duree: "2 semaines", prix: "40 000", devise: "FCFA" },
  ];

  for (const f of formations) {
    await prisma.formation.upsert({
      where:  { nom: f.nom },
      update: { description: f.description, duree: f.duree, prix: f.prix, devise: f.devise },
      create: { ...f, actif: true },
    });
  }

  console.log("✅ Seed terminé — villes, utilisateurs et formations insérés.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1); });
