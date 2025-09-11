"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LogoutButton() {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Déconnexion
    </Button>
  )
}