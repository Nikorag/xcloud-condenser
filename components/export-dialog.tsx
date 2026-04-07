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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Gamepad2,
  RefreshCw,
} from "lucide-react";
import type { AddToSteamResult, SteamUser, SteamConfig } from "@/types";

type DialogState = "user-select" | "adding" | "done" | "error";

export function ExportDialog() {
  const { exportDialogOpen, setExportDialogOpen, selectedGames, settings, clearSelectedGames } =
    useAppStore();

  const [state, setState] = useState<DialogState>("user-select");
  const [steamUsers, setSteamUsers] = useState<SteamUser[]>([]);
  const [detectedSteamPath, setDetectedSteamPath] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<AddToSteamResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentGame, setCurrentGame] = useState("");

  const resetState = () => {
    setState("user-select");
    setResult(null);
    setErrorMsg("");
    setSteamUsers([]);
    setDetectedSteamPath("");
    setDetecting(false);
    setCurrentGame("");
  };

  const handleOpen = async (open: boolean) => {
    setExportDialogOpen(open);
    if (!open) {
      resetState();
      return;
    }

    resetState();
    setDetecting(true);

    try {
      const config = await invoke<SteamConfig>("detect_steam_config");
      setDetectedSteamPath(config.steamPath);
      setSteamUsers(config.users);
    } catch {
      setDetectedSteamPath(settings.steamPath);
    } finally {
      setDetecting(false);
    }
  };

  const startAddToSteam = async (userId: string) => {
    setState("adding");
    setCurrentGame("");

    const steamPath = detectedSteamPath || settings.steamPath;

    try {
      const games = selectedGames.map((g) => ({
        name: g.name,
        launchUrl: g.launchUrl,
      }));

      setCurrentGame("Adding games and fetching artwork...");

      const res = await invoke<AddToSteamResult>("add_games_to_steam", {
        games,
        chromePath: settings.chromePath,
        steamPath,
        steamUserId: userId,
      });

      setResult(res);
      setState("done");
      clearSelectedGames();
    } catch (e) {
      setErrorMsg(String(e));
      setState("error");
    }
  };

  return (
    <Dialog open={exportDialogOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[85vh] sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Add to Steam
          </DialogTitle>
          <DialogDescription>
            {state === "user-select" &&
              `Add ${selectedGames.length} game${selectedGames.length !== 1 ? "s" : ""} to your Steam library`}
            {state === "adding" && "Adding games to Steam..."}
            {state === "done" && "Games added to Steam"}
            {state === "error" && "Something went wrong"}
          </DialogDescription>
        </DialogHeader>

        {/* User Selection */}
        {state === "user-select" && (
          <div className="space-y-4">
            {detecting ? (
              <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Detecting Steam installation...</span>
              </div>
            ) : steamUsers.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No Steam users detected. Please enter your Steam user ID in
                  settings (the numeric folder in Steam/userdata/).
                </p>
                {settings.steamUserId && (
                  <Button
                    className="w-full"
                    onClick={() => startAddToSteam(settings.steamUserId)}
                  >
                    Use configured ID: {settings.steamUserId}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select which Steam profile to add games to:
                </p>
                {steamUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="flex w-full items-center justify-between"
                    onClick={() => startAddToSteam(user.id)}
                  >
                    <span className="font-medium">{user.persona}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {user.id}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {detectedSteamPath && (
              <p className="text-xs text-muted-foreground">
                Steam found at: {detectedSteamPath}
              </p>
            )}
          </div>
        )}

        {/* Adding Progress */}
        {state === "adding" && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Adding games to Steam...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentGame || "Generating launchers and fetching artwork"}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {state === "done" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">
                  {result.successCount} of {result.totalGames} games added
                  successfully
                </p>
                {result.failCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {result.failCount} failed
                  </p>
                )}
              </div>
            </div>

            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {result.results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                    )}
                    <span className="flex-1 truncate text-sm">{r.name}</span>
                    {r.error && (
                      <span className="text-xs text-destructive">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Restart Steam to see your games
              </p>
              <p className="mt-1">
                Your XCloud games will appear in your Steam library with artwork.
                Launch them to play via Xbox Cloud Gaming.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4">
              <XCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium">Failed to add games</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setState("user-select")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
