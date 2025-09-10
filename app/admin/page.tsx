"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Trophy,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react"

interface DashboardStats {
  total_users: number
  active_users: number
  total_matches: number
  pending_matches: number
  total_tournaments: number
  active_tournaments: number
  pending_validations: number
  reported_users: number
}

interface PendingMatch {
  id: string
  player1: { username: string; first_name: string; last_name: string }
  player2: { username: string; first_name: string; last_name: string }
  player1_score: number
  player2_score: number
  status: string
  created_at: string
}

interface ReportedUser {
  id: string
  reported_user: { username: string; first_name: string; last_name: string }
  reporter: { username: string; first_name: string; last_name: string }
  reason: string
  description: string
  created_at: string
  status: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    checkAdminAccess()
    fetchDashboardData()
  }, [])

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = "/auth/login"
      return
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "staff" && profile?.role !== "admin") {
      window.location.href = "/"
      return
    }

    setCurrentUser(user)
  }

  const fetchDashboardData = async () => {
    try {
      // Statistiques générales
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalMatches },
        { count: pendingMatches },
        { count: totalTournaments },
        { count: activeTournaments },
        { count: pendingValidations },
        { count: reportedUsers },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("last_seen", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pending_validation"),
        supabase.from("tournaments").select("*", { count: "exact", head: true }),
        supabase
          .from("tournaments")
          .select("*", { count: "exact", head: true })
          .in("status", ["registration_open", "in_progress"]),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pending_validation"),
        supabase.from("user_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ])

      setStats({
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_matches: totalMatches || 0,
        pending_matches: pendingMatches || 0,
        total_tournaments: totalTournaments || 0,
        active_tournaments: activeTournaments || 0,
        pending_validations: pendingValidations || 0,
        reported_users: reportedUsers || 0,
      })

      // Matchs en attente de validation
      const { data: matchesData } = await supabase
        .from("matches")
        .select(`
          id,
          player1_score,
          player2_score,
          status,
          created_at,
          player1:player1_id(username, first_name, last_name),
          player2:player2_id(username, first_name, last_name)
        `)
        .eq("status", "pending_validation")
        .order("created_at", { ascending: false })
        .limit(10)

      setPendingMatches(matchesData || [])

      // Utilisateurs signalés
      const { data: reportsData } = await supabase
        .from("user_reports")
        .select(`
          id,
          reason,
          description,
          created_at,
          status,
          reported_user:reported_user_id(username, first_name, last_name),
          reporter:reporter_id(username, first_name, last_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10)

      setReportedUsers(reportsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateMatch = async (matchId: string, isValid: boolean) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          status: isValid ? "completed" : "disputed",
          validated_by: currentUser?.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", matchId)

      if (error) throw error

      // Rafraîchir les données
      fetchDashboardData()
    } catch (error) {
      console.error("Error validating match:", error)
      alert("Erreur lors de la validation du match")
    }
  }

  const handleUserReport = async (reportId: string, action: "approve" | "reject") => {
    try {
      const { error } = await supabase
        .from("user_reports")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          handled_by: currentUser?.id,
          handled_at: new Date().toISOString(),
        })
        .eq("id", reportId)

      if (error) throw error

      // Si approuvé, on pourrait aussi suspendre l'utilisateur
      if (action === "approve") {
        // Logique de suspension à implémenter
      }

      fetchDashboardData()
    } catch (error) {
      console.error("Error handling report:", error)
      alert("Erreur lors du traitement du signalement")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Shield className="w-8 h-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Staff</h1>
          <p className="text-gray-600">Administration de la plateforme JDD</p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
                  <div className="text-sm text-gray-600">Utilisateurs totaux</div>
                  <div className="text-xs text-green-600">{stats.active_users} actifs (30j)</div>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.total_matches}</div>
                  <div className="text-sm text-gray-600">Matchs totaux</div>
                  <div className="text-xs text-orange-600">{stats.pending_matches} en attente</div>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.total_tournaments}</div>
                  <div className="text-sm text-gray-600">Tournois totaux</div>
                  <div className="text-xs text-blue-600">{stats.active_tournaments} actifs</div>
                </div>
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.pending_validations}</div>
                  <div className="text-sm text-gray-600">Validations en attente</div>
                  <div className="text-xs text-orange-600">{stats.reported_users} signalements</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets de gestion */}
      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matches">Validation Matchs</TabsTrigger>
          <TabsTrigger value="reports">Signalements</TabsTrigger>
          <TabsTrigger value="tournaments">Tournois</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        {/* Validation des matchs */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Matchs en attente de validation</CardTitle>
              <CardDescription>Validez ou contestez les résultats des matchs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMatches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="text-center">
                            <div className="font-medium">
                              {match.player1.first_name} {match.player1.last_name}
                            </div>
                            <div className="text-sm text-gray-600">@{match.player1.username}</div>
                          </div>

                          <div className="text-2xl font-bold text-center px-4">
                            {match.player1_score} - {match.player2_score}
                          </div>

                          <div className="text-center">
                            <div className="font-medium">
                              {match.player2.first_name} {match.player2.last_name}
                            </div>
                            <div className="text-sm text-gray-600">@{match.player2.username}</div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">Joué le {formatDate(match.created_at)}</div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateMatch(match.id, true)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateMatch(match.id, false)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Contester
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingMatches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun match en attente de validation</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signalements */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Signalements d'utilisateurs</CardTitle>
              <CardDescription>Gérez les signalements de comportements inappropriés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportedUsers.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div>
                            <div className="font-medium text-red-600">
                              Utilisateur signalé: {report.reported_user.first_name} {report.reported_user.last_name}
                            </div>
                            <div className="text-sm text-gray-600">@{report.reported_user.username}</div>
                          </div>

                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {report.reason}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Description:</strong> {report.description}
                        </div>

                        <div className="text-xs text-gray-600">
                          Signalé par @{report.reporter.username} le {formatDate(report.created_at)}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserReport(report.id, "approve")}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Sanctionner
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserReport(report.id, "reject")}
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {reportedUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun signalement en attente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des tournois */}
        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des tournois</CardTitle>
              <CardDescription>Créez et gérez les tournois officiels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des tournois</h3>
                  <p className="text-gray-600 mb-4">Accédez à la gestion complète des tournois</p>
                  <Button asChild>
                    <a href="/tournaments">Gérer les tournois</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytiques */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytiques de la plateforme</CardTitle>
              <CardDescription>Statistiques détaillées et métriques de performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <BarChart3 className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Activité des joueurs</h3>
                  <p className="text-gray-600 text-sm">Suivi de l'engagement et de la participation</p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <Trophy className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Performance des tournois</h3>
                  <p className="text-gray-600 text-sm">Analyse des taux de participation et satisfaction</p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <Activity className="w-12 h-12 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Métriques des matchs</h3>
                  <p className="text-gray-600 text-sm">Statistiques sur les matchs et les scores</p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <Settings className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Configuration système</h3>
                  <p className="text-gray-600 text-sm">Paramètres globaux de la plateforme</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
