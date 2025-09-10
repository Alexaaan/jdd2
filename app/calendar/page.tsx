"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react"

interface Event {
  id: string
  type: "tournament" | "match"
  title: string
  description: string
  date: string
  location: string
  status: string
  participants?: number
  max_participants?: number
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  const fetchEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      // Récupérer les tournois
      const { data: tournaments, error: tournamentsError } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          description,
          start_date,
          location,
          status,
          tournament_participants(count)
        `)
        .gte("start_date", startOfMonth.toISOString())
        .lte("start_date", endOfMonth.toISOString())

      if (tournamentsError) throw tournamentsError

      // Récupérer les matchs importants (finales, demi-finales)
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id,
          created_at,
          status,
          player1:player1_id(username, first_name, last_name),
          player2:player2_id(username, first_name, last_name)
        `)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString())
        .in("status", ["scheduled", "in_progress"])

      if (matchesError) throw matchesError

      // Transformer les données en événements
      const tournamentEvents: Event[] =
        tournaments?.map((tournament) => ({
          id: tournament.id,
          type: "tournament" as const,
          title: tournament.name,
          description: tournament.description || "",
          date: tournament.start_date,
          location: tournament.location,
          status: tournament.status,
          participants: tournament.tournament_participants?.[0]?.count || 0,
        })) || []

      const matchEvents: Event[] =
        matches?.map((match) => ({
          id: match.id,
          type: "match" as const,
          title: `${match.player1?.first_name} ${match.player1?.last_name} vs ${match.player2?.first_name} ${match.player2?.last_name}`,
          description: "Match 1v1",
          date: match.created_at,
          location: "En ligne",
          status: match.status,
        })) || []

      setEvents(
        [...tournamentEvents, ...matchEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      )
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusColor = (status: string, type: string) => {
    if (type === "tournament") {
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
    } else {
      switch (status) {
        case "scheduled":
          return "bg-purple-100 text-purple-800"
        case "in_progress":
          return "bg-orange-100 text-orange-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendrier */}
        <div className="lg:w-2/3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Calendrier JDD
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium min-w-[150px] text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>Tournois officiels et matchs importants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map(({ date, isCurrentMonth }, index) => {
                  const dayEvents = getEventsForDate(date)
                  const isToday =
                    date.getDate() === new Date().getDate() &&
                    date.getMonth() === new Date().getMonth() &&
                    date.getFullYear() === new Date().getFullYear()

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                        ${isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"}
                        ${isToday ? "ring-2 ring-blue-500" : ""}
                        ${selectedDate?.getTime() === date.getTime() ? "bg-blue-50" : ""}
                      `}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`
                              text-xs p-1 rounded truncate
                              ${event.type === "tournament" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}
                            `}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayEvents.length - 2} autres</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Événements du jour sélectionné */}
        <div className="lg:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `Événements du ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
                  : "Prochains événements"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(selectedDate ? getEventsForDate(selectedDate) : events.slice(0, 5)).map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge className={getStatusColor(event.status, event.type)}>
                        {event.type === "tournament" ? "Tournoi" : "Match"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.location}
                      </div>
                      {event.participants !== undefined && (
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {event.participants} participants
                        </div>
                      )}
                    </div>

                    {event.description && <p className="text-xs text-gray-600 mt-2">{event.description}</p>}
                  </div>
                ))}

                {(selectedDate ? getEventsForDate(selectedDate) : events).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun événement prévu</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
