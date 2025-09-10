"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

interface Player {
  id: string
  display_name: string
  first_name: string
  last_name: string
  avatar_url: string
  elo_rating: number
}

export default function NewMatchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null)
  const [matchData, setMatchData] = useState({
    match_type: "casual",
    best_of: "3",
    scheduled_at: "",
    location: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
    searchPlayers()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPlayers()
    }
  }, [searchTerm])

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setCurrentUser(user)
  }

  const searchPlayers = async () => {
    try {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          player_stats!inner(elo_rating)
        `)
        .eq("is_active", true)
        .neq("id", currentUser?.id)
        .limit(10)

      if (searchTerm.length >= 2) {
        query = query.or(
          `display_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error

      const formattedPlayers =
        data?.map((player: any) => ({
          id: player.id,
          display_name: player.display_name,
          first_name: player.first_name,
          last_name: player.last_name,
          avatar_url: player.avatar_url,
          elo_rating: player.player_stats?.elo_rating || 1200,
        })) || []

      setPlayers(formattedPlayers)
    } catch (error) {
      console.error("Error searching players:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setMatchData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOpponent || !currentUser) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("matches").insert({
        player1_id: currentUser.id,
        player2_id: selectedOpponent.id,
        match_type: matchData.match_type,
        best_of: Number.parseInt(matchData.best_of),
        scheduled_at: matchData.scheduled_at || null,
        location: matchData.location || null,
        notes: matchData.notes || null,
        created_by: currentUser.id,
        status: "pending",
      })

      if (error) throw error

      // Create notification for opponent
      await supabase.from("notifications").insert({
        user_id: selectedOpponent.id,
        title: "Nouveau défi reçu",
        message: `Vous avez reçu un défi de match de la part d'un autre joueur.`,
        type: "match_request",
      })

      router.push("/matches")
    } catch (error) {
      console.error("Error creating match:", error)
      setError("Erreur lors de la création du match")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/matches">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux matchs
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">JDD</span>
            </div>
            <h1 className="text-xl font-bold">Nouveau match</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau match 1v1</CardTitle>
            <CardDescription>Défiez un autre joueur en match individuel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Opponent Selection */}
              <div className="space-y-4">
                <Label>Choisir un adversaire</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un joueur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {selectedOpponent ? (
                  <div className="p-4 border rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={selectedOpponent.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {selectedOpponent.display_name?.charAt(0) || selectedOpponent.first_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {selectedOpponent.display_name ||
                              `${selectedOpponent.first_name} ${selectedOpponent.last_name}`}
                          </div>
                          <div className="text-sm text-muted-foreground">Elo: {selectedOpponent.elo_rating}</div>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOpponent(null)}>
                        Changer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedOpponent(player)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={player.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {player.display_name?.charAt(0) || player.first_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {player.display_name || `${player.first_name} ${player.last_name}`}
                            </div>
                            <div className="text-sm text-muted-foreground">Elo: {player.elo_rating}</div>
                          </div>
                        </div>
                        <Button type="button" size="sm">
                          Sélectionner
                        </Button>
                      </div>
                    ))}
                    {players.length === 0 && searchTerm.length >= 2 && (
                      <p className="text-muted-foreground text-center py-4">Aucun joueur trouvé.</p>
                    )}
                    {searchTerm.length < 2 && (
                      <p className="text-muted-foreground text-center py-4">
                        Tapez au moins 2 caractères pour rechercher des joueurs.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Match Settings */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match_type">Type de match</Label>
                  <Select
                    value={matchData.match_type}
                    onValueChange={(value) => handleInputChange("match_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Match amical</SelectItem>
                      <SelectItem value="ranked">Match classé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="best_of">Format</Label>
                  <Select value={matchData.best_of} onValueChange={(value) => handleInputChange("best_of", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 set gagnant</SelectItem>
                      <SelectItem value="3">2 sets gagnants (sur 3)</SelectItem>
                      <SelectItem value="5">3 sets gagnants (sur 5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Date et heure (optionnel)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={matchData.scheduled_at}
                    onChange={(e) => handleInputChange("scheduled_at", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu (optionnel)</Label>
                  <Input
                    id="location"
                    placeholder="Court, club, adresse..."
                    value={matchData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informations supplémentaires..."
                  value={matchData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || !selectedOpponent} className="flex-1">
                  {loading ? "Création..." : "Envoyer le défi"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/matches">Annuler</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
