import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh w-full">
      {/* Sidebar desktop uniquement */}
      <Sidebar />

      {/* Zone de contenu principale */}
      {/* pb-16 réserve de l'espace pour la BottomNav sur mobile */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {children}
      </div>

      {/* Navigation mobile fixe en bas — masquée sur desktop */}
      <BottomNav />

      {/* Bannière mise à jour PWA */}
      <UpdatePrompt />
    </div>
  );
}
