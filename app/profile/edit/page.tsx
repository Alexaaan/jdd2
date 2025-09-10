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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

interface ProfileData {
  first_name: string
  last_name: string
  display_name: string
  bio: string
  date_of_birth: string
  location: string
  phone: string
  avatar_url: string
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    display_name: "",
    bio: "",
    date_of_birth: "",
    location: "",
    phone: "",
    avatar_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          display_name: data.display_name || "",
          bio: data.bio || "",
          date_of_birth: data.date_of_birth || "",
          location: data.location || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setError("Erreur lors du chargement du profil")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`.trim(),
          bio: profile.bio,
          date_of_birth: profile.date_of_birth || null,
          location: profile.location,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/profile")
      }, 1500)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Erreur lors de la sauvegarde du profil")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au profil
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">JDD</span>
            </div>
            <h1 className="text-xl font-bold">Modifier le profil</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Modifier votre profil</CardTitle>
            <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || "J"}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Changer la photo (bientôt disponible)
                </Button>
              </div>

              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Nom d'affichage</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={profile.display_name}
                  onChange={handleInputChange}
                  placeholder="Laissez vide pour utiliser prénom + nom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  placeholder="Parlez-nous de vous..."
                  rows={3}
                />
              </div>

              {/* Additional Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date de naissance</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={profile.date_of_birth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleInputChange}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleInputChange}
                  placeholder="Ville, Pays"
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                  Profil mis à jour avec succès ! Redirection en cours...
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/profile">Annuler</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
