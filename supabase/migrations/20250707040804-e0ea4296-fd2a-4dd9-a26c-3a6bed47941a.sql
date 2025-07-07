-- Remove all dummy/sample data
DELETE FROM public.messages;
DELETE FROM public.submissions;
DELETE FROM public.guidance_schedule;
DELETE FROM public.thesis;
DELETE FROM public.profiles WHERE email IN ('admin@siskripsi.ac.id', 'dosen1@siskripsi.ac.id', 'mahasiswa1@siskripsi.ac.id');