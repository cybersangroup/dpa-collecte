import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur px-4 sm:px-6">
      {/* Bouton hamburger (mobile seulement) — rendu côté client via MobileNav */}
      <MobileNav />

      <h1 className="text-base sm:text-lg font-semibold tracking-tight flex-1 truncate">
        {title}
      </h1>

      <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-9 w-72 text-sm text-muted-foreground">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>Rechercher…</span>
        <kbd className="ml-auto rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </div>

      <Button variant="outline" size="icon" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </Button>
    </header>
  );
}
