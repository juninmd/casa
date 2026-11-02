import { useEffect, useState } from "react";
import { AutomationsPage } from "./pages/AutomationsPage";
import { EnergyPage } from "./pages/EnergyPage";
import { HomePage } from "./pages/HomePage";
import { NetworkPage } from "./pages/NetworkPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { useProviders } from "./state/providers";
import { Ambient } from "./ui/Ambient";
import { type PageId, Shell } from "./ui/Shell";
import { useSpotlight } from "./ui/useSpotlight";

const REFRESH_MS = 30_000;

export function App() {
  const [page, setPage] = useState<PageId>("home");
  const { load, refresh, providers } = useProviders();

  useSpotlight();
  // After the first orchestrated entrance, cards stop replaying it on every re-render.
  useEffect(() => {
    const t = setTimeout(() => document.documentElement.classList.add("booted"), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll only while the window is visible and there is something to poll.
  useEffect(() => {
    if (providers.length === 0) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [providers.length, refresh]);

  return (
    <>
      <Ambient />
      <Shell page={page} onNavigate={setPage}>
        {page === "home" && <HomePage onOpenProviders={() => setPage("providers")} />}
        {page === "network" && <NetworkPage />}
        {page === "providers" && <ProvidersPage />}
        {page === "auto" && <AutomationsPage />}
        {page === "energy" && <EnergyPage />}
        {page === "roadmap" && <RoadmapPage />}
      </Shell>
    </>
  );
}
