import { ArrowsClockwise, FilmSlate, Moon, SignOut } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { SCENES } from "../data/demo";
import { useProviders, useVisibleEntities } from "../state/providers";
import { useStore } from "../state/store";
import { DeviceCard } from "../ui/DeviceCard";
import { RoomTile } from "../ui/RoomTile";
import { SkyHero } from "../ui/SkyHero";

const SCENE_ICON = { dormir: Moon, cinema: FilmSlate, sair: SignOut } as const;

export function HomePage({ onOpenProviders }: { onOpenProviders: () => void }) {
  const entities = useVisibleEntities();
  const { toggle, applyScene, notice, setNotice } = useStore();
  const { errors, refreshing, refresh, providers } = useProviders();
  const [room, setRoom] = useState("Todos");

  const rooms = useMemo(() => ["Todos", ...new Set(entities.map((e) => e.room))], [entities]);
  const current = rooms.includes(room) ? room : "Todos";
  const shown = current === "Todos" ? entities : entities.filter((e) => e.room === current);
  const roomStats = (r: string) => {
    const list = r === "Todos" ? entities : entities.filter((e) => e.room === r);
    return {
      total: list.length,
      lit: list.filter((e) => e.on && e.online && e.kind === "light").length,
    };
  };

  const lights = entities.filter((e) => e.kind === "light");
  const failures = Object.entries(errors);

  return (
    <div className="space-y-6">
      <SkyHero
        lightsOn={lights.filter((l) => l.on && l.online).length}
        lights={lights.length}
        online={entities.filter((e) => e.online).length}
        total={entities.length}
      />

      {notice && (
        <p
          role="alert"
          className="glass flex items-start justify-between gap-3 rounded-2xl border-rose/40 p-3 text-sm text-rose"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 underline">
            fechar
          </button>
        </p>
      )}
      {failures.map(([id, message]) => (
        <p key={id} role="alert" className="glass rounded-2xl border-rose/40 p-3 text-sm text-rose">
          {providers.find((p) => p.id === id)?.label ?? "Provedor"}: {message}
        </p>
      ))}

      <section
        aria-label="Cenas"
        className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1"
      >
        {SCENES.map((s) => {
          const Icon = SCENE_ICON[s.id as keyof typeof SCENE_ICON] ?? Moon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => applyScene(s.id)}
              className="glass flex min-h-12 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-medium transition-transform active:scale-95"
            >
              <Icon size={20} weight="duotone" className="text-amber" aria-hidden />
              {s.name}
            </button>
          );
        })}
        {providers.length > 0 && (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            aria-label="Atualizar dispositivos"
            className="glass ml-auto grid size-12 shrink-0 place-items-center rounded-full disabled:opacity-60"
          >
            <ArrowsClockwise size={20} aria-hidden className={refreshing ? "animate-spin" : ""} />
          </button>
        )}
      </section>

      <div
        role="tablist"
        aria-label="Cômodos"
        className="no-scrollbar -mx-4 -my-3 flex gap-3 overflow-x-auto px-4 py-5 md:-mx-6 md:px-6"
      >
        {rooms.map((r, i) => (
          <RoomTile
            key={r}
            name={r}
            index={i}
            active={current === r}
            onSelect={() => setRoom(r)}
            {...roomStats(r)}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass rounded-3xl border-dashed p-8 text-center text-sm text-mute">
          Nenhum dispositivo ainda.{" "}
          <button type="button" onClick={onOpenProviders} className="text-teal underline">
            Configure um provedor
          </button>{" "}
          para controlar suas tomadas e o Home Assistant.
        </div>
      ) : (
        <section
          aria-label="Dispositivos"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
        >
          {shown.map((e, i) => (
            <DeviceCard key={e.id} entity={e} onToggle={toggle} index={i} />
          ))}
        </section>
      )}
    </div>
  );
}
