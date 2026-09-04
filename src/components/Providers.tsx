"use client";

import { SettingsProvider } from "@/context/SettingsProvider";
import { CatalogProvider } from "@/context/CatalogProvider";
import { PlayerProvider } from "@/context/PlayerProvider";
import { AppShell } from "@/components/AppShell";
import { PwaRegister } from "@/components/PwaRegister";
import { StayStandalone } from "@/components/StayStandalone";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <CatalogProvider>
        <PlayerProvider>
          <PwaRegister />
          <StayStandalone />
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </CatalogProvider>
    </SettingsProvider>
  );
}
