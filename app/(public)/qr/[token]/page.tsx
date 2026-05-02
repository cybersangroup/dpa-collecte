import { notFound } from "next/navigation";
import { Logo } from "@/components/branding/Logo";
import { StudentForm } from "@/components/forms/StudentForm";
import { db } from "@/lib/db";

export default async function QrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const campaign = await db.campaign.findUnique({
    where: { qrToken: token },
    select: { id: true, cityId: true, qrIsActive: true, endsAt: true },
  });

  if (!campaign || !campaign.qrIsActive || campaign.endsAt < new Date()) {
    notFound();
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-center">
          <Logo size={36} withWordmark />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Bienvenue à Digital Profsan Academy
            </h1>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Remplissez ce formulaire pour vous enregistrer.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <StudentForm
              mode="qr"
              cityId={campaign.cityId}
              campaignId={campaign.id}
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
