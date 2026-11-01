import { Broadcast, ChartLineUp, House, Lightning, MapTrifold, Plugs } from "@phosphor-icons/react";
import { type ComponentType, type ReactNode, useCallback } from "react";
import { flushSync } from "react-dom";
import type { IconProps } from "./kinds";

export type PageId = "home" | "network" | "providers" | "auto" | "energy" | "roadmap";

const NAV: {
  id: PageId;
  label: string;
  short?: string;
  Icon: ComponentType<IconProps & { "aria-hidden"?: boolean }>;
}[] = [
  { id: "home", label: "Início", Icon: House },
  { id: "network", label: "Rede", Icon: Broadcast },
  { id: "providers", label: "Provedores", short: "Contas", Icon: Plugs },
  { id: "auto", label: "Automações", short: "Regras", Icon: Lightning },
  { id: "energy", label: "Energia", Icon: ChartLineUp },
  { id: "roadmap", label: "Roadmap", Icon: MapTrifold },
];

interface Props {
  page: PageId;
  onNavigate: (p: PageId) => void;
  children: ReactNode;
}

function Logo() {
  return (
    <span className="flex items-center gap-3 px-2">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <defs>
          <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd27a" />
            <stop offset="1" stopColor="#ff7a3d" />
          </linearGradient>
        </defs>
        <path d="M16 3 4 14h3v13h18V14h3L16 3Z" fill="url(#logo)" />
        <rect x="13" y="18" width="6" height="9" rx="1.5" fill="#070912" opacity="0.85" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">Casa</span>
    </span>
  );
}

export function Shell({ page, onNavigate, children }: Props) {
  // Same-document view transition; browsers without it just swap. Focus follows the new page.
  const go = useCallback(
    (id: PageId) => {
      if (id === page) return;
      const focusTitle = () =>
        document.getElementById("page-title")?.focus({ preventScroll: true });
      if (!document.startViewTransition) {
        onNavigate(id);
        return;
      }
      document
        .startViewTransition(() => flushSync(() => onNavigate(id)))
        .finished.finally(focusTitle);
    },
    [page, onNavigate],
  );

  return (
    <div className="flex h-full flex-col md:flex-row md:gap-4 md:p-4">
      <nav
        aria-label="Principal"
        className="glass hidden w-64 shrink-0 flex-col gap-1.5 rounded-[28px] p-4 md:flex"
      >
        <div className="mb-5 mt-1">
          <Logo />
        </div>
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => go(id)}
              className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] transition-colors ${
                active
                  ? "bg-white/12 text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]"
                  : "text-mute hover:bg-white/6 hover:text-ink"
              }`}
            >
              <span
                className={`grid size-9 place-items-center rounded-xl transition-transform group-active:scale-90 ${
                  active ? "bg-amber/20 text-amber" : "bg-white/5"
                }`}
              >
                <Icon size={21} weight="duotone" aria-hidden />
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pb-8 md:pt-4">
        <div className="page mx-auto max-w-6xl">{children}</div>
      </main>

      <nav
        aria-label="Principal"
        className="glass dock fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 grid grid-cols-6 rounded-[28px] p-1.5 md:hidden"
      >
        {NAV.map(({ id, label, short, Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => go(id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10.5px] transition-colors ${
                active ? "bg-white/12 text-amber" : "text-mute"
              }`}
            >
              <Icon size={22} weight="duotone" aria-hidden />
              {short ?? label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
