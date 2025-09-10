"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Composant pour le logo dynamique
export function ThemeLogo() {
  const { theme } = useTheme();

  return (
    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
      <img
        src={theme === "dark" ? "/icon-192.jpg" : "/icon-1922l.jpg"}
        alt="JDD Logo"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
}

// Composant pour le bouton de changement de thème
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-4">
      {/* Logo dynamique */}

      {/* Bouton pour changer le thème */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
        <span className="sr-only">Changer le thème</span>
      </Button>
    </div>
  );
}
