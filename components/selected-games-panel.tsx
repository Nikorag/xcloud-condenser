"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, ImageIcon, Trash2, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedGamesPanelProps {
  onOpenExport: () => void;
  onOpenArtwork: (gameId: string) => void;
}

export function SelectedGamesPanel({
  onOpenExport,
  onOpenArtwork,
}: SelectedGamesPanelProps) {
  const { selectedGames, removeSelectedGame, clearSelectedGames } =
    useAppStore();

  if (selectedGames.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
        <div className="rounded-full bg-muted p-4">
          <Gamepad2 className="h-8 w-8" />
        </div>
        <div>
          <p className="font-medium text-foreground">No games selected</p>
          <p className="mt-1 text-sm">
            Click on games to add them to Steam
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold">
          Selected ({selectedGames.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelectedGames}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Selected games list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {selectedGames.map((game) => (
            <div
              key={game.id}
              className="group flex items-center gap-3 rounded-lg bg-card p-2 transition-colors hover:bg-accent"
            >
              {/* Thumbnail */}
              <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-muted">
                {game.imageUrl ? (
                  <img
                    src={game.imageUrl}
                    alt={game.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground">
                    {game.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{game.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {game.steamGridArt?.grid && (
                    <span className="text-primary">Has artwork</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenArtwork(game.id)}
                  title="Get artwork from SteamGridDB"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  onClick={() => removeSelectedGame(game.id)}
                  title="Remove from selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Export button */}
      <div className="border-t border-border p-4">
        <Button className="w-full" onClick={onOpenExport}>
          <Gamepad2 className="mr-2 h-4 w-4" />
          Add to Steam
        </Button>
      </div>
    </div>
  );
}
