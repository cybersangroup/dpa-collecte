import Link from "next/link";
import { Logo } from "@/components/branding/Logo";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <Logo size={64} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Vous êtes hors ligne
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Vérifiez votre connexion Internet puis réessayez. Certaines pages
          récentes peuvent rester accessibles en cache.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/connexion">
            <Button>Retour à la connexion</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
