"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Trophy, MapPin, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Tournament {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  registration_deadline: string
  max_participants: number
  entry_fee: number
  prize_pool: number
  location: string
  status: string
  format: string
  atp_points_winner: number
  atp_points_finalist: number
  atp_points_semifinalist: number
  atp_points_quarterfinalist: number
  current_participants: number
}

interface Participant {
  id: string
  user_id: string
  registration_date: string
  profiles: {
    username: string
    first_name: string
    last_name: string
    elo_rating: number
  }
}

export default function TournamentDetailPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const params = useParams()
  const tournamentId = params.id as string

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchTournamentData()
    getCurrentUser()
  }, [tournamentId])

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchTournamentData = async () => {
    try {
      // Récupérer les détails du tournoi
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single()

      if (tournamentError) throw tournamentError

      // Récupérer les participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("tournament_participants")
        .select(`
          *,
          profiles:user_id (
            username,
            first_name,
            last_name,
            elo_rating
          )
        `)
        .eq("tournament_id", tournamentId)
        .order("registration_date", { ascending: true })

      if (participantsError) throw participantsError

      setTournament({
        ...tournamentData,
        current_participants: participantsData?.length || 0,
      })
      setParticipants(participantsData || [])

      // Vérifier si l'utilisateur actuel est inscrit
      if (currentUser) {
        const userRegistration = participantsData?.find((p) => p.user_id === currentUser.id)
        setIsRegistered(!!userRegistration)
      }
    } catch (error) {
      console.error("Error fetching tournament data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async () => {
    if (!currentUser) {
      alert("Vous devez être connecté pour vous inscrire")
      return
    }

    try {
      const { error } = await supabase.from("tournament_participants").insert([
        {
          tournament_id: tournamentId,
          user_id: currentUser.id,
          registration_date: new Date().toISOString(),
        },
      ])

      if (error) throw error

      setIsRegistered(true)
      fetchTournamentData() // Rafraîchir les données
    } catch (error) {
      console.error("Error registering for tournament:", error)
      alert("Erreur lors de l'inscription")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "registration_open":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "À venir"
      case "registration_open":
        return "Inscriptions ouvertes"
      case "in_progress":
        return "En cours"
      case "completed":
        return "Terminé"
      default:
        return status
    }
  }

  const getFormatText = (format: string) => {
    switch (format) {
      case "single_elimination":
        return "Élimination directe"
      case "double_elimination":
        return "Double élimination"
      case "round_robin":
        return "Poules"
      case "swiss":
        return "Système suisse"
      default:
        return format
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tournoi non trouvé</h1>
          <Link href="/tournaments">
            <Button>Retour aux tournois</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/tournaments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux tournois
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                  <CardDescription className="mt-2 text-base">{tournament.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(tournament.status)}>{getStatusText(tournament.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Dates du tournoi</div>
                    <div className="text-sm">
                      {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Lieu</div>
                    <div className="text-sm">{tournament.location}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Inscription avant</div>
                    <div className="text-sm">{formatDate(tournament.registration_deadline)}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Participants</div>
                    <div className="text-sm">
                      {tournament.current_participants}/{tournament.max_participants}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{tournament.entry_fee}€</div>
                    <div className="text-sm text-gray-600">Frais d'inscription</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{tournament.prize_pool}€</div>
                    <div className="text-sm text-gray-600">Prize pool</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{getFormatText(tournament.format)}</div>
                    <div className="text-sm text-gray-600">Format</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points ATP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Points ATP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-600">{tournament.atp_points_winner}</div>
                  <div className="text-sm text-gray-600">Vainqueur</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-600">{tournament.atp_points_finalist}</div>
                  <div className="text-sm text-gray-600">Finaliste</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{tournament.atp_points_semifinalist}</div>
                  <div className="text-sm text-gray-600">Demi-finale</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{tournament.atp_points_quarterfinalist}</div>
                  <div className="text-sm text-gray-600">Quart de finale</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inscription */}
          {tournament.status === "registration_open" && (
            <Card>
              <CardHeader>
                <CardTitle>Inscription</CardTitle>
              </CardHeader>
              <CardContent>
                {isRegistered ? (
                  <div className="text-center">
                    <div className="text-green-600 font-medium mb-2">✓ Vous êtes inscrit</div>
                    <p className="text-sm text-gray-600">Vous recevrez les détails du tournoi par email.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{tournament.entry_fee}€</div>
                      <div className="text-sm text-gray-600">Frais d'inscription</div>
                    </div>
                    <Button
                      onClick={handleRegistration}
                      className="w-full"
                      disabled={tournament.current_participants >= tournament.max_participants}
                    >
                      {tournament.current_participants >= tournament.max_participants ? "Complet" : "S'inscrire"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Participants ({tournament.current_participants})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {participant.profiles.first_name} {participant.profiles.last_name}
                        </div>
                        <div className="text-sm text-gray-600">@{participant.profiles.username}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{participant.profiles.elo_rating}</div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="text-center text-gray-500 py-4">Aucun participant pour le moment</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
