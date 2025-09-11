"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, Calendar, BarChart3, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ThemeLogo } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"

const navigationItems = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Matchs", href: "/matches", icon: Trophy },
  { name: "Tournois", href: "/tournaments", icon: Calendar },
  { name: "Classements", href: "/rankings", icon: BarChart3 },
  { name: "Profil", href: "/profile", icon: User },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Vérifie si une session utilisateur est active
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }

    checkAuth()

    // Écoute les changements d'état de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

            // Redirection conditionnelle pour "Accueil"
            const href = item.name === "Accueil" && isAuthenticated ? "/dashboard" : item.href

            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-xs transition-colors",
                  isActive
                    ? "text-primary bg-accent/20"
                    : "text-muted-foreground hover:text-primary hover:bg-accent/10",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
      {/* Spacer for bottom navigation */}
      <div className="h-16 md:hidden" />
    </>
  )
}
