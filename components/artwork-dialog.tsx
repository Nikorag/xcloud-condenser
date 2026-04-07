"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/lib/store";

const STEAMGRIDDB_API_KEY = "f80f92019254471cca9d62ff91c21eee";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Check, AlertCircle } from "lucide-react";
import type { SteamGridDBSearchResult, SteamGridDBImage } from "@/types";

interface ArtworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string | null;
}

type ArtType = "grid" | "hero" | "logo" | "icon";

export function ArtworkDialog({
  open,
  onOpenChange,
  gameId,
}: ArtworkDialogProps) {
  const { selectedGames, updateGameArt } = useAppStore();
  const game = selectedGames.find((g) => g.id === gameId);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SteamGridDBSearchResult[]>([]);
  const [selectedSteamGridId, setSelectedSteamGridId] = useState<number | null>(null);
  const [artType, setArtType] = useState<ArtType>("grid");
  const [images, setImages] = useState<SteamGridDBImage[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens with new game
  useEffect(() => {
    if (open && game) {
      setSearchQuery(game.name);
      setSearchResults([]);
      setSelectedSteamGridId(null);
      setImages([]);
      setError(null);
    }
  }, [open, game]);

  const searchSteamGridDB = async () => {
    setSearching(true);
    setError(null);

    try {
      const results = await invoke<SteamGridDBSearchResult[]>("search_steamgriddb", {
        apiKey: STEAMGRIDDB_API_KEY,
        query: searchQuery,
      });
      setSearchResults(results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const loadArtwork = async (steamGridId: number, type: ArtType) => {
    setLoadingImages(true);
    setError(null);

    try {
      const imgs = await invoke<SteamGridDBImage[]>("fetch_steamgriddb_images", {
        apiKey: STEAMGRIDDB_API_KEY,
        gameId: steamGridId,
        artType: type,
      });
      setImages(imgs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load artwork");
    } finally {
      setLoadingImages(false);
    }
  };

  const selectGame = (result: SteamGridDBSearchResult) => {
    setSelectedSteamGridId(result.id);
    loadArtwork(result.id, artType);
  };

  const selectArtwork = (image: SteamGridDBImage) => {
    if (!gameId) return;
    updateGameArt(gameId, { [artType]: image.url });
  };

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Get Artwork for {game.name}</DialogTitle>
          <DialogDescription>
            Search SteamGridDB for game artwork to use in Steam
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for game..."
              onKeyDown={(e) => e.key === "Enter" && searchSteamGridDB()}
            />
            <Button onClick={searchSteamGridDB} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && !selectedSteamGridId && (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectGame(result)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{result.name}</span>
                    {result.verified && (
                      <span className="text-xs text-primary">Verified</span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Artwork selection */}
          {selectedSteamGridId && (
            <>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSteamGridId(null);
                    setImages([]);
                  }}
                >
                  &larr; Back to search
                </Button>
              </div>

              <Tabs
                value={artType}
                onValueChange={(v) => {
                  setArtType(v as ArtType);
                  loadArtwork(selectedSteamGridId, v as ArtType);
                }}
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="hero">Hero</TabsTrigger>
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                  <TabsTrigger value="icon">Icon</TabsTrigger>
                </TabsList>

                <TabsContent value={artType} className="mt-4">
                  {loadingImages ? (
                    <div className="flex h-[200px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : images.length === 0 ? (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                      No {artType} images found
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="grid grid-cols-3 gap-3">
                        {images.map((image) => (
                          <div
                            key={image.id}
                            className="group relative overflow-hidden rounded-lg border border-border"
                          >
                            <img
                              src={image.thumb}
                              alt="Game artwork"
                              className="aspect-video w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => selectArtwork(image)}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Select
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Selected artwork preview */}
          {game.steamGridArt && Object.keys(game.steamGridArt).length > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-medium">Selected Artwork</h4>
              <div className="flex flex-wrap gap-2">
                {game.steamGridArt.grid && (
                  <img
                    src={game.steamGridArt.grid}
                    alt="Grid"
                    className="h-16 rounded object-cover"
                  />
                )}
                {game.steamGridArt.hero && (
                  <img
                    src={game.steamGridArt.hero}
                    alt="Hero"
                    className="h-16 rounded object-cover"
                  />
                )}
                {game.steamGridArt.logo && (
                  <img
                    src={game.steamGridArt.logo}
                    alt="Logo"
                    className="h-16 rounded object-contain"
                  />
                )}
                {game.steamGridArt.icon && (
                  <img
                    src={game.steamGridArt.icon}
                    alt="Icon"
                    className="h-16 w-16 rounded object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
