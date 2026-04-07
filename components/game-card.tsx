"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { XCloudGame } from "@/types";
import { Check } from "lucide-react";

interface GameCardProps {
  game: XCloudGame;
}

export const GameCard = memo(function GameCard({ game }: GameCardProps) {
  const isSelected = useAppStore(
    (state) => state.selectedGames.some((g) => g.id === game.id)
  );
  const toggleGameSelection = useAppStore((state) => state.toggleGameSelection);

  return (
    <button
      onClick={() => toggleGameSelection(game)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent bg-card hover:border-border"
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100"
        )}
      >
        <Check className="h-4 w-4" />
      </div>

      {/* Game artwork */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-4xl font-bold">{game.name.charAt(0)}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Game title */}
      <div className="flex flex-1 flex-col justify-end p-3">
        <h3 className="line-clamp-2 text-left text-sm font-medium leading-tight text-card-foreground">
          {game.name}
        </h3>
      </div>
    </button>
  );
});
