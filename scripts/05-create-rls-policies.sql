-- Enable Row Level Security and create policies

-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Player stats table policies
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_stats_select_all" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "player_stats_insert_own" ON public.player_stats
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "player_stats_update_system" ON public.player_stats
  FOR UPDATE USING (true); -- Allow system updates via triggers

-- Tournaments table policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select_all" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "tournaments_insert_staff" ON public.tournaments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

CREATE POLICY "tournaments_update_creator_or_staff" ON public.tournaments
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- Tournament participants table policies
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_participants_select_all" ON public.tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "tournament_participants_insert_own" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "tournament_participants_update_own_or_staff" ON public.tournament_participants
  FOR UPDATE USING (
    auth.uid() = player_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

CREATE POLICY "tournament_participants_delete_own_or_staff" ON public.tournament_participants
  FOR DELETE USING (
    auth.uid() = player_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- Matches table policies
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_all" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "matches_insert_participant_or_staff" ON public.matches
  FOR INSERT WITH CHECK (
    auth.uid() IN (player1_id, player2_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

CREATE POLICY "matches_update_participant_or_staff" ON public.matches
  FOR UPDATE USING (
    auth.uid() IN (player1_id, player2_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- Match sets table policies
ALTER TABLE public.match_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_sets_select_all" ON public.match_sets
  FOR SELECT USING (true);

CREATE POLICY "match_sets_insert_match_participant_or_staff" ON public.match_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id AND (
        auth.uid() IN (player1_id, player2_id) OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_staff = true
        )
      )
    )
  );

-- Elo history table policies
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elo_history_select_all" ON public.elo_history
  FOR SELECT USING (true);

CREATE POLICY "elo_history_insert_system" ON public.elo_history
  FOR INSERT WITH CHECK (true); -- Allow system inserts via triggers

-- Rankings table policies
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rankings_select_all" ON public.rankings
  FOR SELECT USING (true);

CREATE POLICY "rankings_insert_staff" ON public.rankings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

CREATE POLICY "rankings_update_staff" ON public.rankings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- Events table policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_public_or_participant" ON public.events
  FOR SELECT USING (
    is_public = true OR
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.event_participants 
      WHERE event_id = id AND player_id = auth.uid()
    )
  );

CREATE POLICY "events_insert_authenticated" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "events_update_creator_or_staff" ON public.events
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- Event participants table policies
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_select_all" ON public.event_participants
  FOR SELECT USING (true);

CREATE POLICY "event_participants_insert_own" ON public.event_participants
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "event_participants_update_own" ON public.event_participants
  FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "event_participants_delete_own" ON public.event_participants
  FOR DELETE USING (auth.uid() = player_id);

-- Notifications table policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
