-- Fonctions utilitaires pour la base de données

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_duels_updated_at BEFORE UPDATE ON duels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement les stats d'un joueur
CREATE OR REPLACE FUNCTION create_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_stats (player_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer les stats automatiquement
CREATE TRIGGER create_player_stats_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_player_stats();

-- Fonction pour calculer le nouveau rating Elo
CREATE OR REPLACE FUNCTION calculate_elo_rating(
    player_rating INTEGER,
    opponent_rating INTEGER,
    player_won BOOLEAN,
    k_factor INTEGER DEFAULT 32
)
RETURNS INTEGER AS $$
DECLARE
    expected_score FLOAT;
    actual_score FLOAT;
    new_rating INTEGER;
BEGIN
    -- Calcul du score attendu
    expected_score := 1.0 / (1.0 + POWER(10.0, (opponent_rating - player_rating) / 400.0));
    
    -- Score réel (1 si victoire, 0 si défaite)
    actual_score := CASE WHEN player_won THEN 1.0 ELSE 0.0 END;
    
    -- Nouveau rating
    new_rating := ROUND(player_rating + k_factor * (actual_score - expected_score));
    
    RETURN new_rating;
END;
$$ language 'plpgsql';

-- Ajout de la fonction pour mettre à jour les statistiques après un match
CREATE OR REPLACE FUNCTION update_match_stats()
RETURNS TRIGGER AS $$
DECLARE
    winner_stats RECORD;
    loser_stats RECORD;
    winner_new_elo INTEGER;
    loser_new_elo INTEGER;
BEGIN
    -- Vérifier que le match est terminé et validé
    IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND OLD.status != 'completed' THEN
        
        -- Récupérer les stats actuelles des joueurs
        SELECT * INTO winner_stats FROM player_stats WHERE player_id = NEW.winner_id;
        SELECT * INTO loser_stats FROM player_stats WHERE player_id = 
            CASE WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id ELSE NEW.player1_id END;
        
        -- Calculer les nouveaux ratings Elo
        winner_new_elo := calculate_elo_rating(winner_stats.elo_rating, loser_stats.elo_rating, TRUE);
        loser_new_elo := calculate_elo_rating(loser_stats.elo_rating, winner_stats.elo_rating, FALSE);
        
        -- Mettre à jour les stats du gagnant
        UPDATE player_stats SET
            total_matches = total_matches + 1,
            total_wins = total_wins + 1,
            total_sets_won = total_sets_won + NEW.player1_sets + NEW.player2_sets,
            duel_matches = CASE WHEN NEW.match_type = 'duel' THEN duel_matches + 1 ELSE duel_matches END,
            duel_wins = CASE WHEN NEW.match_type = 'duel' THEN duel_wins + 1 ELSE duel_wins END,
            tournament_matches = CASE WHEN NEW.match_type = 'tournament' THEN tournament_matches + 1 ELSE tournament_matches END,
            tournament_wins = CASE WHEN NEW.match_type = 'tournament' THEN tournament_wins + 1 ELSE tournament_wins END,
            elo_rating = winner_new_elo
        WHERE player_id = NEW.winner_id;
        
        -- Mettre à jour les stats du perdant
        UPDATE player_stats SET
            total_matches = total_matches + 1,
            total_losses = total_losses + 1,
            total_sets_lost = total_sets_lost + NEW.player1_sets + NEW.player2_sets,
            duel_matches = CASE WHEN NEW.match_type = 'duel' THEN duel_matches + 1 ELSE duel_matches END,
            tournament_matches = CASE WHEN NEW.match_type = 'tournament' THEN tournament_matches + 1 ELSE tournament_matches END,
            elo_rating = loser_new_elo
        WHERE player_id = CASE WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id ELSE NEW.player1_id END;
        
        -- Enregistrer l'historique Elo
        INSERT INTO elo_history (player_id, match_id, old_rating, new_rating, rating_change, opponent_id, opponent_rating)
        VALUES 
            (NEW.winner_id, NEW.id, winner_stats.elo_rating, winner_new_elo, winner_new_elo - winner_stats.elo_rating, 
             CASE WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id ELSE NEW.player1_id END, loser_stats.elo_rating),
            (CASE WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id ELSE NEW.player1_id END, NEW.id, 
             loser_stats.elo_rating, loser_new_elo, loser_new_elo - loser_stats.elo_rating, NEW.winner_id, winner_stats.elo_rating);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour les stats automatiquement
CREATE TRIGGER update_match_stats_trigger
    AFTER UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_match_stats();
