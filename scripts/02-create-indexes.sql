-- Index pour optimiser les performances

-- Profils
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Stats joueurs
CREATE INDEX idx_player_stats_elo ON player_stats(elo_rating DESC);
CREATE INDEX idx_player_stats_tournament_points ON player_stats(tournament_points DESC);

-- Tournois
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);

-- Inscriptions tournois
CREATE INDEX idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_player ON tournament_registrations(player_id);

-- Matchs
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_type ON matches(match_type);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);

-- Défis
CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_challenged ON duels(challenged_id);
CREATE INDEX idx_duels_status ON duels(status);

-- Événements calendrier
CREATE INDEX idx_calendar_events_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);

-- Classements
CREATE INDEX idx_official_rankings_period ON official_rankings(ranking_period);
CREATE INDEX idx_official_rankings_position ON official_rankings(ranking_period, position);

-- Historique Elo
CREATE INDEX idx_elo_history_player ON elo_history(player_id);
CREATE INDEX idx_elo_history_match ON elo_history(match_id);

-- Litiges
CREATE INDEX idx_disputes_match ON disputes(match_id);
CREATE INDEX idx_disputes_status ON disputes(status);
