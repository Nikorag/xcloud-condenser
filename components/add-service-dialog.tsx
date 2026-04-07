"use client";

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Check, Plus, AlertCircle } from "lucide-react";
import type { SteamGridDBSearchResult, SteamGridDBImage } from "@/types";

const STEAMGRIDDB_API_KEY = "f80f92019254471cca9d62ff91c21eee";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "details" | "search" | "pick-art" | "done";

export function AddServiceDialog({ open, onOpenChange }: AddServiceDialogProps) {
  const { addCustomService } = useAppStore();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#6366F1");

  // SteamGridDB state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SteamGridDBSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSteamGridId, setSelectedSteamGridId] = useState<number | null>(null);
  const [images, setImages] = useState<SteamGridDBImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep("details");
    setName("");
    setUrl("");
    setColor("#6366F1");
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
    setSelectedSteamGridId(null);
    setImages([]);
    setLoadingImages(false);
    setSelectedImageUrl(null);
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) resetState();
  };

  const goToArtwork = () => {
    if (!name.trim() || !url.trim()) return;
    setSearchQuery(name);
    setStep("search");
  };

  const searchSteamGridDB = async () => {
    if (!searchQuery.trim()) return;
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

  const selectSteamGridGame = async (result: SteamGridDBSearchResult) => {
    setSelectedSteamGridId(result.id);
    setLoadingImages(true);
    setError(null);
    setStep("pick-art");

    try {
      const imgs = await invoke<SteamGridDBImage[]>("fetch_steamgriddb_images", {
        apiKey: STEAMGRIDDB_API_KEY,
        gameId: result.id,
        artType: "grid",
      });
      setImages(imgs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load artwork");
    } finally {
      setLoadingImages(false);
    }
  };

  const saveService = () => {
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
    addCustomService({
      id,
      name: name.trim(),
      url: url.trim(),
      color,
    });
    setStep("done");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Service
          </DialogTitle>
          <DialogDescription>
            {step === "details" && "Enter the service name and URL"}
            {step === "search" && "Search SteamGridDB for artwork"}
            {step === "pick-art" && "Pick artwork for the service"}
            {step === "done" && "Service added"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Name and URL */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Streaming App"
                onKeyDown={(e) => e.key === "Enter" && goToArtwork()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-url">URL</Label>
              <Input
                id="service-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://example.com"
                onKeyDown={(e) => e.key === "Enter" && goToArtwork()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-color">Card Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="service-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  saveService();
                }}
              >
                Skip Artwork
              </Button>
              <Button onClick={goToArtwork} disabled={!name.trim() || !url.trim()}>
                Find Artwork
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Search SteamGridDB */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SteamGridDB..."
                onKeyDown={(e) => e.key === "Enter" && searchSteamGridDB()}
                autoFocus
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

            {searchResults.length > 0 && (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => selectSteamGridGame(result)}
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

            {searchResults.length === 0 && !searching && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Press search to find artwork on SteamGridDB
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("details")}>
                &larr; Back
              </Button>
              <Button variant="outline" onClick={saveService}>
                Skip Artwork
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pick artwork */}
        {step === "pick-art" && (
          <div className="space-y-4">
            {loadingImages ? (
              <div className="flex h-[250px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <p>No artwork found</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="grid grid-cols-3 gap-3">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageUrl(image.url)}
                      className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImageUrl === image.url
                          ? "border-primary"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <img
                        src={image.thumb}
                        alt="Artwork"
                        className="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                      />
                      {selectedImageUrl === image.url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                            <Check className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedSteamGridId(null);
                  setImages([]);
                  setSelectedImageUrl(null);
                  setStep("search");
                }}
              >
                &larr; Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveService}>
                  Skip
                </Button>
                <Button
                  onClick={saveService}
                  disabled={!selectedImageUrl}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Use Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
              <Check className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">{name} added</p>
                <p className="text-sm text-muted-foreground">
                  You can now select it from the Streaming tab and add it to Steam.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
