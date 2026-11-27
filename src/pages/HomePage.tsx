import { Button, Card, EmptyState, Spinner } from "@juninmd/sonido";
import { ArrowsClockwise, FilmSlate, Moon, Plugs, SignOut } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { availableScenes } from "../data/demo";
import { useProviders, useVisibleEntities } from "../state/providers";
import { useStore } from "../state/store";
import { DeviceCard } from "../ui/DeviceCard";
import { RoomTile } from "../ui/RoomTile";
import { SkyHero } from "../ui/SkyHero";

const SCENE_ICON = { dormir: Moon, cinema: FilmSlate, sair: SignOut } as const;

export function HomePage({ onOpenProviders }: { onOpenProviders: () => void }) {
  const entities = useVisibleEntities();
  const { toggle, applyScene, notice, setNotice, pending } = useStore();
  const { errors, refreshing, refresh, providers } = useProviders();
  const [room, setRoom] = useState("Todos");

  const rooms = useMemo(() => ["Todos", ...new Set(entities.map((e) => e.room))], [entities]);
  const current = rooms.includes(room) ? room : "Todos";
  const shown = current === "Todos" ? entities : entities.filter((e) => e.room === current);
  const scenes = useMemo(() => availableScenes(entities), [entities]);
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
        <Card
          surface="glass"
          padding="sm"
          role="alert"
          className="border-rose/40 text-sm text-rose"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{notice}</span>
            <Button variant="link" size="sm" onClick={() => setNotice(null)} className="shrink-0">
              fechar
            </Button>
          </div>
        </Card>
      )}
      {failures.map(([id, message]) => (
        <Card
          key={id}
          surface="glass"
          padding="sm"
          role="alert"
          className="border-rose/40 text-sm text-rose"
        >
          {providers.find((p) => p.id === id)?.label ?? "Provedor"}: {message}
        </Card>
      ))}

      {(scenes.length > 0 || providers.length > 0) && (
        <section
          aria-label="Cenas"
          className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1"
        >
          {scenes.map((s) => {
            const Icon = SCENE_ICON[s.id as keyof typeof SCENE_ICON] ?? Moon;
            return (
              <Button
                key={s.id}
                variant="secondary"
                size="lg"
                className="shrink-0 rounded-full"
                iconStart={<Icon size={20} weight="duotone" className="text-amber" aria-hidden />}
                onClick={() => applyScene(s.id)}
              >
                {s.name}
              </Button>
            );
          })}
          {providers.length > 0 && (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Atualizar dispositivos"
              className="ml-auto size-12 shrink-0"
              disabled={refreshing}
              onClick={() => void refresh()}
              iconStart={
                refreshing ? <Spinner size={18} /> : <ArrowsClockwise size={20} aria-hidden />
              }
            />
          )}
        </section>
      )}

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
        <EmptyState
          icon={<Plugs size={26} weight="duotone" />}
          title="Nenhum dispositivo ainda"
          description="Configure um provedor para controlar suas tomadas e o Home Assistant."
          action={
            <Button variant="primary" onClick={onOpenProviders}>
              Configurar provedor
            </Button>
          }
        />
      ) : (
        <section
          aria-label="Dispositivos"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
        >
          {shown.map((e, i) => (
            <DeviceCard key={e.id} entity={e} onToggle={toggle} index={i} busy={!!pending[e.id]} />
          ))}
        </section>
      )}
    </div>
  );
}
