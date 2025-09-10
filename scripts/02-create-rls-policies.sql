-- User profiles policies
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Staff can manage tournaments" ON public.tournaments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_staff = true)
);

-- Matches policies
CREATE POLICY "Users can view all matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Players can update their matches" ON public.matches FOR UPDATE USING (
  auth.uid() = player1_id OR auth.uid() = player2_id OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_staff = true)
);
CREATE POLICY "Users can create matches" ON public.matches FOR INSERT WITH CHECK (
  auth.uid() = player1_id OR auth.uid() = player2_id
);

-- Tournament participants policies
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can register themselves" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can update own registration" ON public.tournament_participants FOR UPDATE USING (auth.uid() = player_id);

-- Events policies
CREATE POLICY "Anyone can view public events" ON public.events FOR SELECT USING (is_public = true);
CREATE POLICY "Staff can manage events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_staff = true)
);
