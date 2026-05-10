import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur px-4 sm:px-6">
      <h1 className="text-base sm:text-lg font-semibold tracking-tight flex-1 truncate">
        {title}
      </h1>
      <ThemeToggle />
      <NotificationBell />
    </header>
  );
}
