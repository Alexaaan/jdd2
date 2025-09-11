import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import MobileNavigationWrapper from "@/components/mobile-navigation-wrapper";
import ThemeToggle from "@/components/theme-toggle"
import { ThemeLogo } from "@/components/theme-toggle";
import LogoutButton from "@/components/LogoutButton"


export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get user stats
  const { data: stats } = await supabase.from("player_stats").select("*").eq("player_id", data.user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <ThemeLogo />
            </div>
            <h1 className="text-xl font-bold">JDD Platform</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Bienvenue, {profile?.display_name || profile?.first_name || "Joueur"}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bienvenue, {profile?.display_name || profile?.first_name || "Joueur"} !
          </h2>
          <p className="text-muted-foreground">Voici un aperçu de votre activité sur la plateforme JDD.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classement Elo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.elo_rating || 1200}</div>
              <p className="text-xs text-muted-foreground">Classement actuel</p>
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
                {stats?.matches_won || 0} victoires, {stats?.matches_lost || 0} défaites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Série actuelle</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.win_streak || 0}</div>
              <p className="text-xs text-muted-foreground">Meilleure série: {stats?.best_win_streak || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de victoire</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.matches_played ? Math.round((stats.matches_won / stats.matches_played) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Sur {stats?.matches_played || 0} matchs</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau match 1v1</CardTitle>
              <CardDescription>Défiez un autre joueur en match individuel</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/matches/new">
                <Button className="w-full">Créer un match</Button>
                </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tournois disponibles</CardTitle>
              <CardDescription>Inscrivez-vous aux prochains tournois</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tournaments">
                <Button variant="outline" className="w-full bg-transparent">
                  Voir les tournois
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classements</CardTitle>
              <CardDescription>Consultez votre position dans les classements</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rankings">
                <Button variant="outline" className="w-full bg-transparent">
                  Voir les classements
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <MobileNavigationWrapper />
    </div>
  )
}
