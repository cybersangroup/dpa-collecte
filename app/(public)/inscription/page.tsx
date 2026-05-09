import { Logo } from "@/components/branding/Logo";
import { InscriptionForm } from "@/components/forms/InscriptionForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InscriptionPage() {
  const formations = await db.formation.findMany({
    where: { actif: true },
    select: { id: true, nom: true, categorie: true, duree: true, prix: true, devise: true },
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  });

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-center">
          <Logo size={36} withWordmark />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-xl mx-auto w-full">
          <div className="text-center mb-8">
            <span className="inline-block text-3xl mb-3">🎓</span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Formations d'été — DPA
            </h1>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Inscrivez-vous à l'une de nos formations de l'été, pour enfants (Scratch,
              robotique…) ou adultes (CCNA, développement web, Python…).
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <InscriptionForm
              formations={formations.map((f) => ({
                ...f,
                categorie: f.categorie as "ENFANT" | "ADULTE",
                devise: f.devise,
              }))}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Digital Profsan Academy — Vos données sont protégées.
        </div>
      </footer>
    </div>
  );
}
