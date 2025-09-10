import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Calendar, Users, Trophy, Clock } from "lucide-react"
import Link from "next/link"
import MobileNavigationWrapper from "@/components/mobile-navigation-wrapper"

export default async function MatchesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get pending matches (waiting for acceptance)
  const { data: pendingMatches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(display_name, first_name, last_name),
      player2:profiles!matches_player2_id_fkey(display_name, first_name, last_name),
      created_by_profile:profiles!matches_created_by_fkey(display_name, first_name, last_name)
    `)
    .or(`player1_id.eq.${data.user.id},player2_id.eq.${data.user.id}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get accepted matches (ready to play)
  const { data: acceptedMatches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(display_name, first_name, last_name),
      player2:profiles!matches_player2_id_fkey(display_name, first_name, last_name)
    `)
    .or(`player1_id.eq.${data.user.id},player2_id.eq.${data.user.id}`)
    .eq("status", "accepted")
    .order("scheduled_at", { ascending: true })

  // Get in-progress matches
  const { data: inProgressMatches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(display_name, first_name, last_name),
      player2:profiles!matches_player2_id_fkey(display_name, first_name, last_name)
    `)
    .or(`player1_id.eq.${data.user.id},player2_id.eq.${data.user.id}`)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })

  // Get recent completed matches
  const { data: completedMatches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(display_name, first_name, last_name),
      player2:profiles!matches_player2_id_fkey(display_name, first_name, last_name),
      winner:profiles!matches_winner_id_fkey(display_name, first_name, last_name)
    `)
    .or(`player1_id.eq.${data.user.id},player2_id.eq.${data.user.id}`)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10)

  const getOpponent = (match: any) => {
    return match.player1_id === data.user.id ? match.player2 : match.player1
  }

  const getMatchResult = (match: any) => {
    if (match.winner_id === data.user.id) return "Victoire"
    if (match.winner_id) return "Défaite"
    return "Match nul"
  }

  const getMatchResultColor = (match: any) => {
    if (match.winner_id === data.user.id) return "default"
    if (match.winner_id) return "destructive"
    return "secondary"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">JDD</span>
            </div>
            <h1 className="text-xl font-bold">Mes Matchs</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Tableau de bord</Link>
            </Button>
            <Button asChild>
              <Link href="/matches/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau match
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En attente ({pendingMatches?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Acceptés ({acceptedMatches?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              En cours ({inProgressMatches?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Terminés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matchs en attente</CardTitle>
                <CardDescription>Matchs en attente d'acceptation</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingMatches && pendingMatches.length > 0 ? (
                  <div className="space-y-4">
                    {pendingMatches.map((match) => {
                      const opponent = getOpponent(match)
                      const isChallenger = match.created_by === data.user.id

                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div className="flex items-center space-x-4">
                            <Badge variant={isChallenger ? "secondary" : "default"}>
                              {isChallenger ? "Défi envoyé" : "Défi reçu"}
                            </Badge>
                            <div>
                              <div className="font-medium">
                                vs {opponent?.display_name || `${opponent?.first_name} ${opponent?.last_name}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.scheduled_at
                                  ? `Programmé le ${new Date(match.scheduled_at).toLocaleDateString("fr-FR")}`
                                  : "Pas encore programmé"}
                              </div>
                              {match.location && (
                                <div className="text-sm text-muted-foreground">📍 {match.location}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!isChallenger && (
                              <>
                                <Button size="sm" asChild>
                                  <Link href={`/matches/${match.id}/accept`}>Accepter</Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/matches/${match.id}/decline`}>Refuser</Link>
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/matches/${match.id}`}>Détails</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun match en attente.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matchs acceptés</CardTitle>
                <CardDescription>Matchs prêts à être joués</CardDescription>
              </CardHeader>
              <CardContent>
                {acceptedMatches && acceptedMatches.length > 0 ? (
                  <div className="space-y-4">
                    {acceptedMatches.map((match) => {
                      const opponent = getOpponent(match)

                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div className="flex items-center space-x-4">
                            <Badge variant="default">Accepté</Badge>
                            <div>
                              <div className="font-medium">
                                vs {opponent?.display_name || `${opponent?.first_name} ${opponent?.last_name}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.scheduled_at
                                  ? `Programmé le ${new Date(match.scheduled_at).toLocaleDateString("fr-FR")}`
                                  : "À programmer"}
                              </div>
                              {match.location && (
                                <div className="text-sm text-muted-foreground">📍 {match.location}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" asChild>
                              <Link href={`/matches/${match.id}/play`}>Commencer</Link>
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/matches/${match.id}`}>Détails</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun match accepté.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matchs en cours</CardTitle>
                <CardDescription>Matchs commencés mais pas encore terminés</CardDescription>
              </CardHeader>
              <CardContent>
                {inProgressMatches && inProgressMatches.length > 0 ? (
                  <div className="space-y-4">
                    {inProgressMatches.map((match) => {
                      const opponent = getOpponent(match)

                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">En cours</Badge>
                            <div>
                              <div className="font-medium">
                                vs {opponent?.display_name || `${opponent?.first_name} ${opponent?.last_name}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Commencé le {match.started_at && new Date(match.started_at).toLocaleDateString("fr-FR")}
                              </div>
                              <div className="text-sm font-medium">
                                Score actuel:{" "}
                                {match.player1_id === data.user.id ? match.player1_score : match.player2_score} -{" "}
                                {match.player1_id === data.user.id ? match.player2_score : match.player1_score}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" asChild>
                              <Link href={`/matches/${match.id}/play`}>Continuer</Link>
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/matches/${match.id}`}>Détails</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun match en cours.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matchs terminés</CardTitle>
                <CardDescription>Vos 10 derniers matchs terminés</CardDescription>
              </CardHeader>
              <CardContent>
                {completedMatches && completedMatches.length > 0 ? (
                  <div className="space-y-4">
                    {completedMatches.map((match) => {
                      const opponent = getOpponent(match)
                      const playerScore = match.player1_id === data.user.id ? match.player1_score : match.player2_score
                      const opponentScore =
                        match.player1_id === data.user.id ? match.player2_score : match.player1_score

                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div className="flex items-center space-x-4">
                            <Badge variant={getMatchResultColor(match)}>{getMatchResult(match)}</Badge>
                            <div>
                              <div className="font-medium">
                                vs {opponent?.display_name || `${opponent?.first_name} ${opponent?.last_name}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.completed_at && new Date(match.completed_at).toLocaleDateString("fr-FR")}
                              </div>
                              <div className="text-sm font-medium">
                                Score final: {playerScore} - {opponentScore}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/matches/${match.id}`}>Détails</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun match terminé.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavigationWrapper />
    </div>
  )
}
