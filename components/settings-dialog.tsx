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
import {
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  History,
} from "lucide-react";
import type { BackupEntry } from "@/types";

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings } =
    useAppStore();

  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<"success" | "error" | null>(null);
  const [showBackups, setShowBackups] = useState(false);

  const loadBackups = async () => {
    if (!settings.steamPath || !settings.steamUserId) return;

    setLoadingBackups(true);
    setRestoreResult(null);
    try {
      const entries = await invoke<BackupEntry[]>("list_shortcuts_backups", {
        steamPath: settings.steamPath,
        steamUserId: settings.steamUserId,
      });
      setBackups(entries);
      setShowBackups(true);
    } catch {
      setBackups([]);
      setShowBackups(true);
    } finally {
      setLoadingBackups(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    setRestoring(true);
    setRestoreResult(null);
    try {
      await invoke("restore_shortcuts_backup", {
        steamPath: settings.steamPath,
        steamUserId: settings.steamUserId,
        filename,
      });
      setRestoreResult("success");
    } catch {
      setRestoreResult("error");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(open) => {
        setSettingsOpen(open);
        if (!open) {
          setShowBackups(false);
          setRestoreResult(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure paths for XCloud Condenser
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Chrome Path */}
          <div className="space-y-2">
            <Label htmlFor="chrome-path">Chrome Executable Path</Label>
            <Input
              id="chrome-path"
              value={settings.chromePath}
              onChange={(e) => updateSettings({ chromePath: e.target.value })}
              placeholder="Path to chrome.exe or google-chrome"
            />
            <p className="text-xs text-muted-foreground">
              The path to your Chrome browser executable
            </p>
          </div>

          {/* Steam Path */}
          <div className="space-y-2">
            <Label htmlFor="steam-path">Steam Installation Path</Label>
            <Input
              id="steam-path"
              value={settings.steamPath}
              onChange={(e) => updateSettings({ steamPath: e.target.value })}
              placeholder="Path to Steam installation"
            />
            <p className="text-xs text-muted-foreground">
              Used to locate shortcuts.vdf and grid artwork folder
            </p>
          </div>

          {/* Steam User ID */}
          <div className="space-y-2">
            <Label htmlFor="steam-user-id">Steam User ID (optional)</Label>
            <Input
              id="steam-user-id"
              value={settings.steamUserId}
              onChange={(e) => updateSettings({ steamUserId: e.target.value })}
              placeholder="Your Steam user ID number"
            />
            <p className="text-xs text-muted-foreground">
              The numeric folder name in Steam/userdata/ (for direct file
              placement)
            </p>
          </div>

          {/* Backup / Restore */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Shortcuts Backup</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBackups}
                disabled={loadingBackups || !settings.steamPath}
              >
                {loadingBackups ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <History className="mr-2 h-3 w-3" />
                )}
                View Backups
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A backup of shortcuts.vdf is created automatically each time you
              add games to Steam
            </p>

            {restoreResult === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Backup restored. Restart Steam to see the changes.
              </div>
            )}

            {restoreResult === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Failed to restore backup.
              </div>
            )}

            {showBackups && (
              <div className="rounded-lg border border-border">
                {backups.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No backups found
                  </p>
                ) : (
                  <ScrollArea className="max-h-[160px]">
                    <div className="divide-y divide-border">
                      {backups.map((backup) => (
                        <div
                          key={backup.filename}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <span className="text-sm text-muted-foreground">
                            {backup.displayDate}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreBackup(backup.filename)}
                            disabled={restoring}
                          >
                            {restoring ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="mr-1 h-3 w-3" />
                            )}
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
