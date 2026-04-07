"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { GameBrowser } from "@/components/game-browser";
import { StreamingServiceBrowser } from "@/components/streaming-service-browser";
import { SelectedGamesPanel } from "@/components/selected-games-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { ExportDialog } from "@/components/export-dialog";
import { ArtworkDialog } from "@/components/artwork-dialog";
import { AboutDialog } from "@/components/about-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, Info, Gamepad2, Tv } from "lucide-react";

export default function HomePage() {
  const { setSettingsOpen, setExportDialogOpen, exportDialogOpen } = useAppStore();
  const [artworkGameId, setArtworkGameId] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="XCloud Condenser"
            className="h-9 w-9 rounded-lg"
          />
          <div>
            <h1 className="text-lg font-semibold leading-none">
              XCloud Condenser
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add games and apps to Steam
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAboutOpen(true)}
            title="About"
          >
            <Info className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <Tabs defaultValue="xcloud" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-4 pt-2">
            <TabsList>
              <TabsTrigger value="xcloud" className="gap-1.5">
                <Gamepad2 className="h-4 w-4" />
                XCloud Games
              </TabsTrigger>
              <TabsTrigger value="streaming" className="gap-1.5">
                <Tv className="h-4 w-4" />
                Streaming
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="xcloud" className="flex-1 overflow-hidden m-0">
            <GameBrowser />
          </TabsContent>

          <TabsContent value="streaming" className="flex-1 overflow-hidden m-0">
            <StreamingServiceBrowser />
          </TabsContent>
        </Tabs>

        {/* Selected games sidebar */}
        <aside className="hidden w-80 flex-shrink-0 border-l border-border bg-card lg:block">
          <SelectedGamesPanel
            onOpenExport={() => setExportDialogOpen(true)}
            onOpenArtwork={(id) => setArtworkGameId(id)}
          />
        </aside>
      </div>

      {/* Mobile bottom bar for selected games */}
      <MobileSelectionBar
        onOpenExport={() => setExportDialogOpen(true)}
      />

      {/* Dialogs */}
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <SettingsDialog />
      <ExportDialog />
      <ArtworkDialog
        open={artworkGameId !== null}
        onOpenChange={(open) => !open && setArtworkGameId(null)}
        gameId={artworkGameId}
      />
    </div>
  );
}

function MobileSelectionBar({ onOpenExport }: { onOpenExport: () => void }) {
  const { selectedGames } = useAppStore();

  if (selectedGames.length === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-border bg-card p-3 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {selectedGames.slice(0, 3).map((game) => (
            <div
              key={game.id}
              className="h-8 w-6 overflow-hidden rounded border-2 border-card bg-muted"
            >
              {game.imageUrl ? (
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs">
                  {game.name.charAt(0)}
                </div>
              )}
            </div>
          ))}
          {selectedGames.length > 3 && (
            <div className="flex h-8 w-6 items-center justify-center rounded border-2 border-card bg-muted text-xs">
              +{selectedGames.length - 3}
            </div>
          )}
        </div>
        <span className="text-sm font-medium">
          {selectedGames.length} selected
        </span>
      </div>
      <Button size="sm" onClick={onOpenExport}>
        Generate
      </Button>
    </div>
  );
}
