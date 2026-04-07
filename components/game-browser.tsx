"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/lib/store";
import { GameCard } from "./game-card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BATCH_SIZE = 36; // Number of games to render per batch

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function GameBrowser() {
  const {
    games,
    gamesLoading,
    gamesError,
    gamesLastFetched,
    setGames,
    setGamesLoading,
    setGamesError,
    searchQuery,
    setSearchQuery,
  } = useAppStore();

  const fetchGames = async (force = false) => {
    // Check cache validity
    if (
      !force &&
      gamesLastFetched &&
      Date.now() - gamesLastFetched < CACHE_TTL &&
      games.length > 0
    ) {
      return;
    }

    setGamesLoading(true);
    setGamesError(null);

    try {
      const games = await invoke<Array<{ id: string; name: string; imageUrl: string; launchUrl: string }>>("fetch_xcloud_games", { market: "US" });
      setGames(games);
    } catch {
      setGamesError("Failed to load XCloud games. Please try again.");
    } finally {
      setGamesLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    const query = searchQuery.toLowerCase();
    return games.filter((game) => game.name.toLowerCase().includes(query));
  }, [games, searchQuery]);

  // Incremental rendering: only render BATCH_SIZE items at a time
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [searchQuery]);

  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleCount),
    [filteredGames, visibleCount]
  );

  const hasMore = visibleCount < filteredGames.length;

  // IntersectionObserver to load more games as user scrolls
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredGames.length));
  }, [filteredGames.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "400px" } // Start loading before sentinel is visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-border bg-background/50 p-4 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchGames(true)}
          disabled={gamesLoading}
          title="Refresh games list"
        >
          <RefreshCw
            className={`h-4 w-4 ${gamesLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Games grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {gamesLoading && games.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading XCloud games...</p>
          </div>
        ) : gamesError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p>{gamesError}</p>
            <Button variant="outline" onClick={() => fetchGames(true)}>
              Try Again
            </Button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <p>No games found</p>
            {searchQuery && (
              <Button variant="ghost" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visibleGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            {/* Sentinel element triggers loading more games */}
            <div ref={sentinelRef} className="h-4" />
            {hasMore && (
              <div className="flex justify-center py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with count */}
      <div className="border-t border-border bg-background/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
        {filteredGames.length} game{filteredGames.length !== 1 ? "s" : ""}{" "}
        {searchQuery && `matching "${searchQuery}"`}
      </div>
    </div>
  );
}
