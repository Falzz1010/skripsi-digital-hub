import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    const { message, context, type } = await req.json();
    
    // Initialize Supabase client for data context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = '';
    let userPrompt = message;

    // Customize prompts based on type
    switch (type) {
      case 'thesis_analysis':
        systemPrompt = `Anda adalah asisten AI untuk sistem manajemen skripsi. Berikan analisis mendalam tentang progress skripsi, identifikasi masalah potensial, dan berikan rekomendasi untuk meningkatkan kualitas dan progres skripsi. Jawab dalam bahasa Indonesia dengan format yang jelas dan terstruktur.`;
        break;
      case 'schedule_optimization':
        systemPrompt = `Anda adalah asisten AI untuk optimalisasi jadwal bimbingan skripsi. Analisis pola jadwal, identifikasi konflik potensial, dan berikan rekomendasi untuk penjadwalan yang lebih efektif. Jawab dalam bahasa Indonesia.`;
        break;
      case 'file_review':
        systemPrompt = `Anda adalah asisten AI untuk review file skripsi. Berikan analisis kualitas, struktur, dan konten file yang diupload. Identifikasi area yang perlu diperbaiki dan berikan saran konstruktif. Jawab dalam bahasa Indonesia dengan format yang mudah dipahami.`;
        break;
      case 'student_performance':
        systemPrompt = `Anda adalah asisten AI untuk analisis performa mahasiswa. Evaluasi progress, pola aktivitas, dan berikan insight tentang performa akademik mahasiswa dalam pengerjaan skripsi. Jawab dalam bahasa Indonesia dengan rekomendasi yang actionable.`;
        break;
      default:
        systemPrompt = `Anda adalah asisten AI untuk sistem informasi skripsi (SISKRIPSI). Berikan bantuan yang relevan dan berguna untuk mahasiswa dan dosen dalam pengelolaan skripsi. Jawab dalam bahasa Indonesia dengan ramah dan profesional.`;
    }

    // Add context if provided
    if (context) {
      userPrompt += `\n\nKonteks data: ${JSON.stringify(context)}`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    console.log('AI Assistant request processed successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      type: type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Maaf, terjadi kesalahan dalam memproses permintaan AI. Silakan coba lagi nanti.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});