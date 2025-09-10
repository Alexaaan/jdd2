"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CreateTournamentPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_participants: "",
    entry_fee: "",
    prize_pool: "",
    location: "",
    format: "",
    atp_points_winner: "",
    atp_points_finalist: "",
    atp_points_semifinalist: "",
    atp_points_quarterfinalist: "",
  })

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      const tournamentData = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        registration_deadline: formData.registration_deadline,
        max_participants: Number.parseInt(formData.max_participants),
        entry_fee: Number.parseFloat(formData.entry_fee),
        prize_pool: Number.parseFloat(formData.prize_pool),
        location: formData.location,
        format: formData.format,
        status: "upcoming",
        created_by: user.id,
        atp_points_winner: Number.parseInt(formData.atp_points_winner),
        atp_points_finalist: Number.parseInt(formData.atp_points_finalist),
        atp_points_semifinalist: Number.parseInt(formData.atp_points_semifinalist),
        atp_points_quarterfinalist: Number.parseInt(formData.atp_points_quarterfinalist),
      }

      const { error } = await supabase.from("tournaments").insert([tournamentData])

      if (error) throw error

      router.push("/tournaments")
    } catch (error) {
      console.error("Error creating tournament:", error)
      alert("Erreur lors de la création du tournoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-8">
        <Link href="/tournaments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux tournois
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Créer un nouveau tournoi
          </CardTitle>
          <CardDescription>Organisez un tournoi officiel JDD avec attribution de points ATP</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>

              <div>
                <Label htmlFor="name">Nom du tournoi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Open JDD de Paris"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Description du tournoi..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Lieu *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Ex: Club JDD Paris"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dates</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Date de fin *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="registration_deadline">Date limite d'inscription *</Label>
                <Input
                  id="registration_deadline"
                  type="date"
                  value={formData.registration_deadline}
                  onChange={(e) => handleInputChange("registration_deadline", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Format *</Label>
                  <Select value={formData.format} onValueChange={(value) => handleInputChange("format", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_elimination">Élimination directe</SelectItem>
                      <SelectItem value="double_elimination">Double élimination</SelectItem>
                      <SelectItem value="round_robin">Poules</SelectItem>
                      <SelectItem value="swiss">Système suisse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_participants">Nombre max de participants *</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange("max_participants", e.target.value)}
                    placeholder="Ex: 32"
                    min="4"
                    max="128"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry_fee">Frais d'inscription (€) *</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    step="0.01"
                    value={formData.entry_fee}
                    onChange={(e) => handleInputChange("entry_fee", e.target.value)}
                    placeholder="Ex: 25.00"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="prize_pool">Prize pool (€)</Label>
                  <Input
                    id="prize_pool"
                    type="number"
                    step="0.01"
                    value={formData.prize_pool}
                    onChange={(e) => handleInputChange("prize_pool", e.target.value)}
                    placeholder="Ex: 500.00"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Points ATP */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Points ATP</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="atp_points_winner">Vainqueur *</Label>
                  <Input
                    id="atp_points_winner"
                    type="number"
                    value={formData.atp_points_winner}
                    onChange={(e) => handleInputChange("atp_points_winner", e.target.value)}
                    placeholder="100"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="atp_points_finalist">Finaliste *</Label>
                  <Input
                    id="atp_points_finalist"
                    type="number"
                    value={formData.atp_points_finalist}
                    onChange={(e) => handleInputChange("atp_points_finalist", e.target.value)}
                    placeholder="60"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="atp_points_semifinalist">Demi-finaliste *</Label>
                  <Input
                    id="atp_points_semifinalist"
                    type="number"
                    value={formData.atp_points_semifinalist}
                    onChange={(e) => handleInputChange("atp_points_semifinalist", e.target.value)}
                    placeholder="30"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="atp_points_quarterfinalist">Quart de finale *</Label>
                  <Input
                    id="atp_points_quarterfinalist"
                    type="number"
                    value={formData.atp_points_quarterfinalist}
                    onChange={(e) => handleInputChange("atp_points_quarterfinalist", e.target.value)}
                    placeholder="15"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Link href="/tournaments" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Création..." : "Créer le tournoi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
