-- Enable realtime for all tables
ALTER TABLE public.guidance_schedule REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.thesis REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thesis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Create function to get current user role for RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add admin policies for viewing all data
CREATE POLICY "Admins can view all guidance schedules" ON public.guidance_schedule
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all messages" ON public.messages
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all submissions" ON public.submissions
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all thesis" ON public.thesis
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Add admin management policies
CREATE POLICY "Admins can update all thesis" ON public.thesis
FOR UPDATE USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all submissions" ON public.submissions
FOR UPDATE USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all guidance schedules" ON public.guidance_schedule
FOR UPDATE USING (public.get_current_user_role() = 'admin');