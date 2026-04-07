"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/lib/store";
import { STREAMING_SERVICES } from "@/lib/streaming-services";
import type { StreamingService } from "@/lib/streaming-services";
import { AddServiceDialog } from "@/components/add-service-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, Tv, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SteamGridDBSearchResult, SteamGridDBImage } from "@/types";

const STEAMGRIDDB_API_KEY = "f80f92019254471cca9d62ff91c21eee";

// Module-level cache so artwork survives re-renders and tab switches
const artworkCache: Record<string, string | null> = {};

export function StreamingServiceBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const customServices = useAppStore((state) => state.customServices);
  const fetchedRef = useRef(false);

  const allServices = useMemo(
    () => [...STREAMING_SERVICES, ...customServices],
    [customServices]
  );

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return allServices;
    const query = searchQuery.toLowerCase();
    return allServices.filter((s) => s.name.toLowerCase().includes(query));
  }, [allServices, searchQuery]);

  // Fetch artwork for all services that aren't cached yet
  const fetchAllArtwork = useCallback(async () => {
    const uncached = allServices.filter((s) => !(s.id in artworkCache));
    if (uncached.length === 0) return;

    // Mark as loading (null = loading/not found)
    for (const s of uncached) {
      artworkCache[s.id] = null;
    }

    // Fetch in parallel with a concurrency limit
    const batchSize = 4;
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (service) => {
          try {
            let gameId: number | null = service.steamGridDbId ?? null;

            // If no pinned ID, search by name
            if (!gameId) {
              const results = await invoke<SteamGridDBSearchResult[]>(
                "search_steamgriddb",
                { apiKey: STEAMGRIDDB_API_KEY, query: service.name }
              );
              if (results && results.length > 0) {
                gameId = results[0].id;
              }
            }

            if (gameId) {
              const images = await invoke<SteamGridDBImage[]>(
                "fetch_steamgriddb_images",
                { apiKey: STEAMGRIDDB_API_KEY, gameId, artType: "grid" }
              );
              if (images && images.length > 0) {
                artworkCache[service.id] = images[0].thumb;
              }
            }
          } catch {
            // Non-fatal — card will show fallback color
          }
        })
      );
      // Trigger re-render after each batch so images appear progressively
      forceUpdate((n) => n + 1);
    }
  }, [allServices]);

  useEffect(() => {
    // Only auto-fetch once per mount, not on every re-render
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchAllArtwork();
    }
  }, [fetchAllArtwork]);

  // Re-fetch when custom services change
  const prevCustomLen = useRef(customServices.length);
  useEffect(() => {
    if (customServices.length > prevCustomLen.current) {
      fetchAllArtwork();
    }
    prevCustomLen.current = customServices.length;
  }, [customServices.length, fetchAllArtwork]);

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-border bg-background/50 p-4 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search streaming services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          title="Add custom service"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom
        </Button>
      </div>

      {/* Services grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredServices.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <p>No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isCustom={service.id.startsWith("custom-")}
                artworkUrl={artworkCache[service.id] ?? undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-background/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
        {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""}
        {customServices.length > 0 && ` (${customServices.length} custom)`}
      </div>

      <AddServiceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}

function ServiceCard({
  service,
  isCustom,
  artworkUrl,
}: {
  service: StreamingService;
  isCustom: boolean;
  artworkUrl?: string;
}) {
  const isSelected = useAppStore((state) =>
    state.selectedGames.some((g) => g.id === service.id)
  );
  const toggleGameSelection = useAppStore(
    (state) => state.toggleGameSelection
  );
  const removeCustomService = useAppStore(
    (state) => state.removeCustomService
  );

  const handleClick = () => {
    toggleGameSelection({
      id: service.id,
      name: service.name,
      imageUrl: "",
      launchUrl: service.url,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeCustomService(service.id);
  };

  return (
    <button
      onClick={handleClick}
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

      {/* Delete button for custom services */}
      {isCustom && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleDelete}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDelete(e as unknown as React.MouseEvent);
            }
          }}
          className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground opacity-0 transition-all hover:bg-destructive group-hover:opacity-100"
          title="Remove custom service"
        >
          <Trash2 className="h-3 w-3" />
        </div>
      )}

      {/* Service artwork */}
      <div
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: service.color }}
      >
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Tv
            className="h-12 w-12 transition-transform duration-300 group-hover:scale-110"
            style={{
              color:
                service.color === "#FFFFFF" || service.color === "#000000"
                  ? "#888888"
                  : "rgba(255,255,255,0.9)",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Service title */}
      <div className="flex flex-1 flex-col justify-end p-3">
        <h3 className="line-clamp-2 text-left text-sm font-medium leading-tight text-card-foreground">
          {service.name}
        </h3>
      </div>
    </button>
  );
}
