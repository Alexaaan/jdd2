"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from "lucide-react"

interface Player {
  id: string
  username: string
  first_name: string
  last_name: string
  elo_rating: number
  atp_points: number
  matches_played: number
  matches_won: number
  matches_lost: number
  tournaments_won: number
  win_rate: number
  rank_elo: number
  rank_atp: number
  previous_elo_rank?: number
  previous_atp_rank?: number
}

interface RankingStats {
  total_players: number
  average_elo: number
  highest_elo: number
  total_matches: number
  total_tournaments: number
}

export default function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<RankingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("elo")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      // Récupérer les profils avec statistiques
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          first_name,
          last_name,
          elo_rating,
          atp_points,
          matches_played,
          matches_won,
          matches_lost,
          tournaments_won
        `)
        .order("elo_rating", { ascending: false })

      if (profilesError) throw profilesError

      // Calculer les rangs et statistiques
      const playersWithRanks =
        profiles?.map((player, index) => ({
          ...player,
          win_rate: player.matches_played > 0 ? (player.matches_won / player.matches_played) * 100 : 0,
          rank_elo: index + 1,
          rank_atp: 0, // Sera calculé après tri par ATP
        })) || []

      // Trier par points ATP pour calculer le rang ATP
      const sortedByATP = [...playersWithRanks].sort((a, b) => b.atp_points - a.atp_points)
      sortedByATP.forEach((player, index) => {
        player.rank_atp = index + 1
      })

      setPlayers(playersWithRanks)

      // Calculer les statistiques globales
      const totalPlayers = playersWithRanks.length
      const averageElo =
        totalPlayers > 0 ? playersWithRanks.reduce((sum, p) => sum + p.elo_rating, 0) / totalPlayers : 0
      const highestElo = totalPlayers > 0 ? Math.max(...playersWithRanks.map((p) => p.elo_rating)) : 0
      const totalMatches = playersWithRanks.reduce((sum, p) => sum + p.matches_played, 0)

      // Récupérer le nombre de tournois
      const { count: tournamentsCount } = await supabase.from("tournaments").select("*", { count: "exact", head: true })

      setStats({
        total_players: totalPlayers,
        average_elo: Math.round(averageElo),
        highest_elo: highestElo,
        total_matches: totalMatches,
        total_tournaments: tournamentsCount || 0,
      })
    } catch (error) {
      console.error("Error fetching rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />
      default:
        return null
    }
  }

  const getRankChange = (currentRank: number, previousRank?: number) => {
    if (!previousRank) return <Minus className="w-4 h-4 text-gray-400" />

    if (currentRank < previousRank) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (currentRank > previousRank) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getPlayersByRanking = (type: "elo" | "atp") => {
    return [...players].sort((a, b) => {
      if (type === "elo") {
        return b.elo_rating - a.elo_rating
      } else {
        return b.atp_points - a.atp_points
      }
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classements JDD</h1>
          <p className="text-gray-600">Classements officiels Elo et ATP</p>
        </div>
      </div>

      {/* Statistiques globales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_players}</div>
              <div className="text-sm text-gray-600">Joueurs actifs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.average_elo}</div>
              <div className="text-sm text-gray-600">Elo moyen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.highest_elo}</div>
              <div className="text-sm text-gray-600">Elo le plus élevé</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.total_matches}</div>
              <div className="text-sm text-gray-600">Matchs joués</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.total_tournaments}</div>
              <div className="text-sm text-gray-600">Tournois organisés</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Classements */}
      <Card>
        <CardHeader>
          <CardTitle>Classements</CardTitle>
          <CardDescription>Classements officiels basés sur les performances</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="elo">Classement Elo</TabsTrigger>
              <TabsTrigger value="atp">Classement ATP</TabsTrigger>
            </TabsList>

            <TabsContent value="elo" className="mt-6">
              <div className="space-y-2">
                {getPlayersByRanking("elo").map((player, index) => (
                  <div
                    key={player.id}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border transition-colors
                      ${index < 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200" : "hover:bg-gray-50"}
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-600 min-w-[3rem] text-center">#{index + 1}</span>
                        {getRankIcon(index + 1)}
                        {getRankChange(index + 1, player.previous_elo_rank)}
                      </div>

                      <div>
                        <div className="font-medium text-lg">
                          {player.first_name} {player.last_name}
                        </div>
                        <div className="text-sm text-gray-600">@{player.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{player.elo_rating}</div>
                        <div className="text-xs text-gray-600">Elo</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium">
                          {player.matches_won}W - {player.matches_lost}L
                        </div>
                        <div className="text-xs text-gray-600">{player.win_rate.toFixed(1)}% victoires</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-yellow-600">{player.tournaments_won}</div>
                        <div className="text-xs text-gray-600">Tournois gagnés</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="atp" className="mt-6">
              <div className="space-y-2">
                {getPlayersByRanking("atp").map((player, index) => (
                  <div
                    key={player.id}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border transition-colors
                      ${index < 3 ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" : "hover:bg-gray-50"}
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-600 min-w-[3rem] text-center">#{index + 1}</span>
                        {getRankIcon(index + 1)}
                        {getRankChange(index + 1, player.previous_atp_rank)}
                      </div>

                      <div>
                        <div className="font-medium text-lg">
                          {player.first_name} {player.last_name}
                        </div>
                        <div className="text-sm text-gray-600">@{player.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{player.atp_points}</div>
                        <div className="text-xs text-gray-600">Points ATP</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium">{player.elo_rating}</div>
                        <div className="text-xs text-gray-600">Elo (#{player.rank_elo})</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-yellow-600">{player.tournaments_won}</div>
                        <div className="text-xs text-gray-600">Tournois gagnés</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {players.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun classement disponible</h3>
              <p className="text-gray-600">
                Les classements apparaîtront une fois que les joueurs auront commencé à jouer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
