-- Vues utiles pour simplifier les requêtes

-- Vue pour le classement Elo actuel
CREATE VIEW current_elo_rankings AS
SELECT 
    p.id,
    p.username,
    p.full_name,
    ps.elo_rating,
    ps.duel_matches,
    ps.duel_wins,
    CASE 
        WHEN ps.duel_matches > 0 THEN ROUND((ps.duel_wins::FLOAT / ps.duel_matches * 100), 1)
        ELSE 0 
    END as win_rate,
    ROW_NUMBER() OVER (ORDER BY ps.elo_rating DESC) as rank
FROM profiles p
JOIN player_stats ps ON p.id = ps.player_id
WHERE p.role = 'player'
ORDER BY ps.elo_rating DESC;

-- Vue pour le classement officiel actuel
CREATE VIEW current_official_rankings AS
SELECT 
    p.id,
    p.username,
    p.full_name,
    ps.tournament_points,
    ps.tournament_matches,
    ps.tournament_wins,
    CASE 
        WHEN ps.tournament_matches > 0 THEN ROUND((ps.tournament_wins::FLOAT / ps.tournament_matches * 100), 1)
        ELSE 0 
    END as tournament_win_rate,
    ROW_NUMBER() OVER (ORDER BY ps.tournament_points DESC) as rank
FROM profiles p
JOIN player_stats ps ON p.id = ps.player_id
WHERE p.role = 'player'
ORDER BY ps.tournament_points DESC;

-- Vue pour les matchs avec détails des joueurs
CREATE VIEW matches_with_players AS
SELECT 
    m.*,
    p1.username as player1_username,
    p1.full_name as player1_name,
    p2.username as player2_username,
    p2.full_name as player2_name,
    w.username as winner_username,
    w.full_name as winner_name,
    t.name as tournament_name
FROM matches m
JOIN profiles p1 ON m.player1_id = p1.id
JOIN profiles p2 ON m.player2_id = p2.id
LEFT JOIN profiles w ON m.winner_id = w.id
LEFT JOIN tournaments t ON m.tournament_id = t.id;

-- Vue pour les tournois avec nombre d'inscrits
CREATE VIEW tournaments_with_registrations AS
SELECT 
    t.*,
    COALESCE(reg_count.count, 0) as registered_players,
    CASE 
        WHEN t.max_participants IS NOT NULL THEN 
            ROUND((COALESCE(reg_count.count, 0)::FLOAT / t.max_participants * 100), 1)
        ELSE NULL 
    END as fill_percentage
FROM tournaments t
LEFT JOIN (
    SELECT tournament_id, COUNT(*) as count
    FROM tournament_registrations
    WHERE status = 'registered'
    GROUP BY tournament_id
) reg_count ON t.id = reg_count.tournament_id;

-- Vue pour les défis en attente avec détails des joueurs
CREATE VIEW pending_duels_with_players AS
SELECT 
    d.*,
    challenger.username as challenger_username,
    challenger.full_name as challenger_name,
    challenged.username as challenged_username,
    challenged.full_name as challenged_name
FROM duels d
JOIN profiles challenger ON d.challenger_id = challenger.id
JOIN profiles challenged ON d.challenged_id = challenged.id
WHERE d.status = 'pending' AND d.expires_at > NOW();
