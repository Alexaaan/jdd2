-- JDD Platform Database Schema
-- Tables principales pour la plateforme de tournois JDD

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs (étend auth.users de Supabase)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'staff', 'admin')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques globales des joueurs
CREATE TABLE player_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    -- Stats globales
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_sets_won INTEGER DEFAULT 0,
    total_sets_lost INTEGER DEFAULT 0,
    -- Stats tournois officiels
    tournament_matches INTEGER DEFAULT 0,
    tournament_wins INTEGER DEFAULT 0,
    tournament_points INTEGER DEFAULT 0,
    -- Stats 1v1
    duel_matches INTEGER DEFAULT 0,
    duel_wins INTEGER DEFAULT 0,
    elo_rating INTEGER DEFAULT 1000,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Table des tournois
CREATE TABLE tournaments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    format VARCHAR(20) NOT NULL CHECK (format IN ('elimination', 'pools', 'round_robin')),
    max_participants INTEGER,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled')),
    points_distribution JSONB, -- Distribution des points par position
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des inscriptions aux tournois
CREATE TABLE tournament_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn')),
    UNIQUE(tournament_id, player_id)
);

-- Table des matchs (tournois et 1v1)
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE, -- NULL pour les matchs 1v1
    player1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('tournament', 'duel')),
    round_name VARCHAR(50), -- Pour les tournois (ex: "Quart de finale")
    
    -- Scores
    player1_sets INTEGER DEFAULT 0,
    player2_sets INTEGER DEFAULT 0,
    sets_detail JSONB, -- Détail des sets [{"player1": 6, "player2": 4}, ...]
    
    -- Statut du match
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed', 'cancelled')),
    winner_id UUID REFERENCES profiles(id),
    
    -- Validation des scores
    player1_score_confirmed BOOLEAN DEFAULT FALSE,
    player2_score_confirmed BOOLEAN DEFAULT FALSE,
    staff_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES profiles(id),
    
    -- Timestamps
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des défis 1v1
CREATE TABLE duels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenged_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE, -- Lien vers le match une fois accepté
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements du calendrier
CREATE TABLE calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('tournament', 'match', 'other')),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des classements officiels (historique)
CREATE TABLE official_rankings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ranking_period VARCHAR(20) NOT NULL, -- ex: "2024-S1", "2024-S2"
    position INTEGER NOT NULL,
    points INTEGER NOT NULL,
    tournaments_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des historiques Elo
CREATE TABLE elo_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    old_rating INTEGER NOT NULL,
    new_rating INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    opponent_id UUID REFERENCES profiles(id),
    opponent_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des litiges
CREATE TABLE disputes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
