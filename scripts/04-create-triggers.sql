-- Create triggers

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger to update player stats when match is completed
DROP TRIGGER IF EXISTS update_stats_on_match_completion ON public.matches;
CREATE TRIGGER update_stats_on_match_completion
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats();

-- Trigger to update Elo ratings when match is completed
DROP TRIGGER IF EXISTS update_elo_on_match_completion ON public.matches;
CREATE TRIGGER update_elo_on_match_completion
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_elo_ratings();

-- Triggers to update updated_at timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_stats_updated_at ON public.player_stats;
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
