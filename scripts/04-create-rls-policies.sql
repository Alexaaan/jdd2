-- Row Level Security (RLS) Policies pour sécuriser l'accès aux données

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies pour player_stats
CREATE POLICY "Player stats are viewable by everyone" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Only system can update player stats" ON player_stats FOR UPDATE USING (false);

-- Policies pour tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Only staff can create tournaments" ON tournaments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
CREATE POLICY "Only staff can update tournaments" ON tournaments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- Policies pour tournament_registrations
CREATE POLICY "Tournament registrations are viewable by everyone" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Players can register themselves" ON tournament_registrations FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can update own registrations" ON tournament_registrations FOR UPDATE USING (auth.uid() = player_id);

-- Policies pour matches
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Players can update own matches" ON matches FOR UPDATE USING (
    auth.uid() = player1_id OR auth.uid() = player2_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- Policies pour duels
CREATE POLICY "Duels are viewable by involved players" ON duels FOR SELECT USING (
    auth.uid() = challenger_id OR auth.uid() = challenged_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
CREATE POLICY "Players can create duels" ON duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Players can update duels they're involved in" ON duels FOR UPDATE USING (
    auth.uid() = challenger_id OR auth.uid() = challenged_id
);

-- Policies pour calendar_events
CREATE POLICY "Calendar events are viewable by everyone" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Only staff can manage calendar events" ON calendar_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- Policies pour official_rankings
CREATE POLICY "Official rankings are viewable by everyone" ON official_rankings FOR SELECT USING (true);
CREATE POLICY "Only system can update rankings" ON official_rankings FOR INSERT WITH CHECK (false);

-- Policies pour elo_history
CREATE POLICY "Elo history is viewable by everyone" ON elo_history FOR SELECT USING (true);
CREATE POLICY "Only system can create elo history" ON elo_history FOR INSERT WITH CHECK (false);

-- Policies pour disputes
CREATE POLICY "Disputes are viewable by involved parties and staff" ON disputes FOR SELECT USING (
    auth.uid() = reported_by OR
    EXISTS (SELECT 1 FROM matches WHERE id = match_id AND (player1_id = auth.uid() OR player2_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
CREATE POLICY "Players can report disputes" ON disputes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM matches WHERE id = match_id AND (player1_id = auth.uid() OR player2_id = auth.uid()))
);
CREATE POLICY "Only staff can resolve disputes" ON disputes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
