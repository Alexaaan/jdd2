import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, MapPin, Phone, Mail, Trophy, TrendingUp, Users, Target, Edit } from "lucide-react"
import Link from "next/link"
import MobileNavigationWrapper from "@/components/mobile-navigation-wrapper"

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get user stats
  const { data: stats } = await supabase.from("player_stats").select("*").eq("player_id", data.user.id).single()

  // Get recent matches
  const { data: recentMatches } = await supabase
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

  // Get Elo history
  const { data: eloHistory } = await supabase
    .from("elo_history")
    .select("*")
    .eq("player_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Calculate win rate
  const winRate = stats?.matches_played ? Math.round((stats.matches_won / stats.matches_played) * 100) : 0

  // Get current ranking position (simplified - in real app would use a function)
  const { data: rankingData } = await supabase
    .from("player_stats")
    .select("elo_rating")
    .gt("elo_rating", stats?.elo_rating || 1200)
    .eq("profiles.is_active", true)

  const currentRanking = (rankingData?.length || 0) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">JDD</span>
            </div>
            <h1 className="text-xl font-bold">JDD Platform</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Tableau de bord</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile/edit">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-white/20">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-white/20">
                    {profile?.display_name?.charAt(0) || profile?.first_name?.charAt(0) || "J"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">
                    {profile?.display_name || `${profile?.first_name} ${profile?.last_name}`}
                  </h2>
                  {profile?.bio && <p className="text-lg opacity-90 mb-4">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {profile.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {data.user.email}
                    </div>
                    {profile?.date_of_birth && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(profile.date_of_birth).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-75">Classement</div>
                  <div className="text-3xl font-bold">#{currentRanking}</div>
                  {profile?.is_staff && (
                    <Badge variant="secondary" className="mt-2">
                      Staff
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
            <TabsTrigger value="matches">Matchs récents</TabsTrigger>
            <TabsTrigger value="elo">Évolution Elo</TabsTrigger>
            <TabsTrigger value="achievements">Réalisations</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Key Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classement Elo</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.elo_rating || 1200}</div>
                  <p className="text-xs text-muted-foreground">Position #{currentRanking}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Matchs joués</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.matches_played || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.matches_won || 0}V - {stats?.matches_lost || 0}D
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de victoire</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{winRate}%</div>
                  <Progress value={winRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Série actuelle</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.win_streak || 0}</div>
                  <p className="text-xs text-muted-foreground">Record: {stats?.best_win_streak || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques de sets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Sets gagnés</span>
                    <span className="font-semibold">{stats?.sets_won || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sets perdus</span>
                    <span className="font-semibold">{stats?.sets_lost || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratio sets</span>
                    <span className="font-semibold">
                      {stats?.sets_lost ? ((stats?.sets_won || 0) / stats.sets_lost).toFixed(2) : "∞"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques de jeux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Jeux gagnés</span>
                    <span className="font-semibold">{stats?.games_won || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jeux perdus</span>
                    <span className="font-semibold">{stats?.games_lost || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratio jeux</span>
                    <span className="font-semibold">
                      {stats?.games_lost ? ((stats?.games_won || 0) / stats.games_lost).toFixed(2) : "∞"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matchs récents</CardTitle>
                <CardDescription>Vos 10 derniers matchs terminés</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMatches && recentMatches.length > 0 ? (
                  <div className="space-y-4">
                    {recentMatches.map((match) => {
                      const isPlayer1 = match.player1_id === data.user.id
                      const opponent = isPlayer1 ? match.player2 : match.player1
                      const playerScore = isPlayer1 ? match.player1_score : match.player2_score
                      const opponentScore = isPlayer1 ? match.player2_score : match.player1_score
                      const isWin = match.winner_id === data.user.id

                      return (
                        <div
                          key={match.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isWin ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <Badge variant={isWin ? "default" : "destructive"}>{isWin ? "Victoire" : "Défaite"}</Badge>
                            <div>
                              <div className="font-medium">
                                vs {opponent?.display_name || `${opponent?.first_name} ${opponent?.last_name}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.completed_at && new Date(match.completed_at).toLocaleDateString("fr-FR")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {playerScore} - {opponentScore}
                            </div>
                            {match.match_type === "tournament" && (
                              <div className="text-xs text-muted-foreground">Tournoi</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun match joué pour le moment.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="elo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Évolution du classement Elo</CardTitle>
                <CardDescription>Historique de vos 20 derniers changements de classement</CardDescription>
              </CardHeader>
              <CardContent>
                {eloHistory && eloHistory.length > 0 ? (
                  <div className="space-y-3">
                    {eloHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <Badge variant={entry.match_result === "win" ? "default" : "destructive"}>
                            {entry.match_result === "win" ? "Victoire" : "Défaite"}
                          </Badge>
                          <div className="text-sm">
                            <div>
                              Elo: {entry.elo_before} → {entry.elo_after}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${entry.elo_change > 0 ? "text-green-600" : "text-red-600"}`}>
                          {entry.elo_change > 0 ? "+" : ""}
                          {entry.elo_change}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun historique Elo disponible.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Réalisations</CardTitle>
                <CardDescription>Vos accomplissements sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Achievement badges based on stats */}
                  {(stats?.matches_played || 0) >= 10 && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                      <Trophy className="w-8 h-8 text-accent" />
                      <div>
                        <div className="font-semibold">Joueur expérimenté</div>
                        <div className="text-sm text-muted-foreground">10+ matchs joués</div>
                      </div>
                    </div>
                  )}

                  {(stats?.best_win_streak || 0) >= 5 && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
                      <TrendingUp className="w-8 h-8 text-primary" />
                      <div>
                        <div className="font-semibold">Série impressionnante</div>
                        <div className="text-sm text-muted-foreground">5+ victoires consécutives</div>
                      </div>
                    </div>
                  )}

                  {(stats?.elo_rating || 1200) >= 1400 && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-100">
                      <Target className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="font-semibold">Joueur confirmé</div>
                        <div className="text-sm text-muted-foreground">Elo 1400+</div>
                      </div>
                    </div>
                  )}

                  {winRate >= 70 && (stats?.matches_played || 0) >= 5 && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-100">
                      <Trophy className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="font-semibold">Dominateur</div>
                        <div className="text-sm text-muted-foreground">70%+ de victoires</div>
                      </div>
                    </div>
                  )}
                </div>

                {(!stats?.matches_played || stats.matches_played === 0) && (
                  <p className="text-muted-foreground text-center py-8">
                    Jouez vos premiers matchs pour débloquer des réalisations !
                  </p>
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
