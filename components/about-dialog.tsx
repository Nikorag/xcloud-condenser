"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink } from "lucide-react";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="sr-only">About XCloud Condenser</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* App icon */}
          <img
            src="/icon.svg"
            alt="XCloud Condenser"
            className="h-20 w-20 rounded-2xl"
          />

          {/* App name and version */}
          <div className="text-center">
            <h2 className="text-xl font-bold">XCloud Condenser</h2>
            <p className="mt-1 text-sm text-muted-foreground">Version 0.1.0</p>
          </div>

          {/* Description */}
          <p className="text-center text-sm text-muted-foreground">
            Add Xbox Cloud Gaming titles to your Steam library with custom
            artwork from SteamGridDB. Works on macOS, Linux, and Steam Deck.
          </p>

          {/* Links */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/Nikorag/xcloud-condenser"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://www.steamgriddb.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                SteamGridDB
              </a>
            </Button>
          </div>

          {/* Credits */}
          <div className="w-full rounded-lg border border-border bg-muted/50 p-4 text-center text-xs text-muted-foreground">
            <p>
              Built with{" "}
              <a href="https://tauri.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Tauri
              </a>
              ,{" "}
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Next.js
              </a>
              , and{" "}
              <a href="https://www.rust-lang.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Rust
              </a>
            </p>
            <p className="mt-2">
              Artwork powered by{" "}
              <a href="https://www.steamgriddb.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                SteamGridDB
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
