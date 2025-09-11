"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy, MapPin, Clock } from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  location: string;
  status: "upcoming" | "registration_open" | "in_progress" | "completed";
  format: "single_elimination" | "double_elimination" | "round_robin" | "swiss";
  atp_points_winner: number;
  current_participants: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "registration_open" | "in_progress" | "completed">("all");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      let query = supabase
        .from("tournaments")
        .select(`
          *,
          tournament_participants(count)
        `)
        .order("start_date", { ascending: true });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tournamentsWithCount =
        data?.map((tournament) => ({
          ...tournament,
          current_participants: tournament.tournament_participants?.[0]?.count || 0,
        })) || [];

      setTournaments(tournamentsWithCount);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "registration_open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "À venir";
      case "registration_open":
        return "Inscriptions ouvertes";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminé";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <MobileNavigation />
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <MobileNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournois JDD</h1>
          <p className="text-gray-600">Participez aux tournois officiels et gagnez des points ATP</p>
        </div>
        <Link href="/tournaments/create">
          <Button className="mt-4 md:mt-0">
            <Trophy className="w-4 h-4 mr-2" />
            Créer un tournoi
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "Tous" },
          { key: "registration_open", label: "Inscriptions ouvertes" },
          { key: "upcoming", label: "À venir" },
          { key: "in_progress", label: "En cours" },
          { key: "completed", label: "Terminés" },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key as any)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Liste des tournois */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                  <CardDescription className="mt-1">{tournament.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(tournament.status)}>{getStatusText(tournament.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {tournament.location}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {tournament.current_participants}/{tournament.max_participants} participants
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                Inscription avant le {formatDate(tournament.registration_deadline)}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm">
                  <span className="font-medium">Prix: </span>
                  {tournament.entry_fee}€
                </div>
                <div className="text-sm">
                  <span className="font-medium">Points ATP: </span>
                  {tournament.atp_points_winner}
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/tournaments/${tournament.id}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Voir détails
                  </Button>
                </Link>
                {tournament.status === "registration_open" && (
                  <Link href={`/tournaments/${tournament.id}/register`} className="flex-1">
                    <Button className="w-full">S'inscrire</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tournoi trouvé</h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "Aucun tournoi n'est programmé pour le moment."
              : `Aucun tournoi ${getStatusText(filter).toLowerCase()} pour le moment.`}
          </p>
        </div>
      )}
    </div>
  );
}
