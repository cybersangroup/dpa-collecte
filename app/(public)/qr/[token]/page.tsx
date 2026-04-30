import { Logo } from "@/components/branding/Logo";
import { StudentForm } from "@/components/forms/StudentForm";
import { Badge } from "@/components/ui/Badge";

export default async function QrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size={36} withWordmark />
          <Badge variant="success">Tournée en cours · DKR</Badge>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Bienvenue à Digital Profsan Academy
            </h1>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Remplissez ce formulaire pour vous enregistrer auprès de notre équipe.
              Vos données sont confidentielles et utilisées uniquement par DPA.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <StudentForm mode="qr" />
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Token : <span className="font-mono">{token.slice(0, 8)}…</span> · Sécurisé
          </p>
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
