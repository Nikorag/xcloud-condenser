"use client";

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

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings } =
    useAppStore();

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure paths and API keys for XCloud Condenser
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
              The numeric folder name in Steam/userdata/ (for direct file placement)
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
