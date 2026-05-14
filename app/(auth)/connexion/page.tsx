"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function ConnexionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrorMessage(null);

    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") ??
      "/tableau-de-bord";

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setErrorMessage("Identifiants invalides ou compte inactif.");
      setIsSubmitting(false);
      return;
    }

    const target = result.url ?? callbackUrl;
    const resolvedTarget = (() => {
      try {
        const url = new URL(target, window.location.origin);
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return callbackUrl;
      }
    })();
    // Navigation pleine page : évite les échecs « Failed to fetch RSC payload »
    // quand l’app est ouverte via l’IP LAN (192.168.x.x) après connexion.
    window.location.assign(resolvedTarget);
  }

  return (
    <div className="min-h-dvh w-full grid lg:grid-cols-2">
      {/* Panneau visuel — desktop uniquement */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 dpa-gradient text-white overflow-hidden">
        <div className="absolute inset-0 dpa-radial opacity-60" aria-hidden />
        <div className="relative">
          <Logo size={44} withWordmark variant="light" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Collectez les inscriptions étudiantes,{" "}
            <span className="text-emerald-300">en quelques secondes</span>.
          </h2>
          <p className="mt-4 text-white/80 leading-relaxed">
            Une application terrain pensée pour les équipes de Digital Profsan
            Academy
          </p>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Digital Profsan Academy
        </p>
      </aside>

      {/* Panneau formulaire — mobile + desktop */}
      <main className="flex flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <Logo size={56} />
            <h1 className="mt-4 text-xl font-semibold tracking-tight">
              Digital Profsan Academy
            </h1>
            <p className="text-sm text-muted-foreground">
              Application de collecte
            </p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Connexion
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Accédez à votre espace de collecte.
            </p>
          </div>

          <form className="space-y-5" action={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Nom d&apos;utilisateur</Label>
              <Input
                id="username"
                name="username"
                placeholder="ex. aminata.diop"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <span className="text-xs text-primary">
                  Mot de passe oublié ?
                </span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
            {errorMessage && (
              <p className="text-sm text-destructive text-center">{errorMessage}</p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Demandez un accès à votre administrateur.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
