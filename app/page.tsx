import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Trophy, Users, Calendar, TrendingUp } from "lucide-react"
import { MobileNavigation } from "@/components/mobile-navigation"

export default function HomePage() {
  return (
    <>
      <MobileNavigation />

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-16 md:pb-0">
        <header className="border-b bg-card/80 backdrop-blur-sm hidden md:block">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">JDD</span>
              </div>
              <h1 className="text-xl font-bold">JDD Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-8 md:py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-balance">
              La plateforme officielle des tournois <span className="text-primary">JDD</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty">
              Participez aux tournois officiels, défiez d'autres joueurs en 1v1, suivez votre progression avec le
              système Elo et grimpez dans les classements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="text-lg px-8">
                <Link href="/auth/signup">Commencer à jouer</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
                <Link href="/auth/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Fonctionnalités principales</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Tout ce dont vous avez besoin pour votre expérience JDD
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Tournois officiels</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Participez aux tournois organisés par le staff avec système d'élimination, round-robin ou suisse.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Matchs 1v1</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Défiez d'autres joueurs en matchs individuels et améliorez votre classement Elo.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Système Elo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Suivez votre progression avec un système de classement Elo précis et équitable.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Calendrier</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Consultez le calendrier des événements, tournois et séances d'entraînement.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 md:py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="text-center py-8 md:py-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Prêt à commencer ?</h3>
              <p className="text-base md:text-lg mb-6 md:mb-8 opacity-90">
                Rejoignez la communauté JDD et commencez votre parcours vers le sommet.
              </p>
              <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                <Link href="/auth/signup">Créer mon compte</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t bg-card/80 backdrop-blur-sm hidden md:block">
          <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
            <p>&copy; 2024 JDD Platform. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
