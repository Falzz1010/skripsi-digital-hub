
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'lecturer', 'admin');

-- Create enum for thesis status
CREATE TYPE public.thesis_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_needed');

-- Create enum for submission types
CREATE TYPE public.submission_type AS ENUM ('proposal', 'chapter', 'final', 'revision');

-- Create profiles table for additional user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nim_nidn TEXT,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thesis table
CREATE TABLE public.thesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lecturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  status thesis_status DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table for file uploads
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID REFERENCES public.thesis(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type submission_type NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  version INTEGER DEFAULT 1,
  comments TEXT,
  status thesis_status DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID REFERENCES public.thesis(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guidance schedule table
CREATE TABLE public.guidance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID REFERENCES public.thesis(id) ON DELETE CASCADE NOT NULL,
  lecturer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_schedule ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for thesis
CREATE POLICY "Students can view their own thesis" ON public.thesis
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = lecturer_id);

CREATE POLICY "Students can create their own thesis" ON public.thesis
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students and lecturers can update thesis" ON public.thesis
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = lecturer_id);

-- Create RLS policies for submissions
CREATE POLICY "Users can view related submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() IN (
    SELECT lecturer_id FROM public.thesis WHERE id = submissions.thesis_id
  ));

CREATE POLICY "Students can create submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their submissions" ON public.submissions
  FOR UPDATE USING (auth.uid() = student_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages for their thesis" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() IN (
    SELECT student_id FROM public.thesis WHERE id = messages.thesis_id
    UNION
    SELECT lecturer_id FROM public.thesis WHERE id = messages.thesis_id
  ));

CREATE POLICY "Users can create messages for their thesis" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create RLS policies for guidance schedule
CREATE POLICY "Users can view their guidance schedule" ON public.guidance_schedule
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = lecturer_id);

CREATE POLICY "Lecturers can create guidance schedule" ON public.guidance_schedule
  FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

CREATE POLICY "Users can update their guidance schedule" ON public.guidance_schedule
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = lecturer_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.thesis REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.guidance_schedule REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thesis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_schedule;

-- Create storage bucket for thesis files
INSERT INTO storage.buckets (id, name, public) VALUES ('thesis-files', 'thesis-files', true);

-- Create storage policies
CREATE POLICY "Users can upload thesis files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thesis-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view thesis files" ON storage.objects
  FOR SELECT USING (bucket_id = 'thesis-files');

CREATE POLICY "Users can update their thesis files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'thesis-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their thesis files" ON storage.objects
  FOR DELETE USING (bucket_id = 'thesis-files' AND auth.uid()::text = (storage.foldername(name))[1]);
