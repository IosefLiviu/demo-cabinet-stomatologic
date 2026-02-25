import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory rate limiting (per isolate instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts = 10, windowMs = 300000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (entry) {
    if (now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxAttempts) {
      return false;
    }
    entry.count++;
    return true;
  }
  
  rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
  return true;
}

// Clean up stale entries periodically
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    if (!checkRateLimit(`ip:${ip}`, 10, 300000)) {
      // Clean up stale entries
      cleanupRateLimits();
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also rate limit per username
    if (!checkRateLimit(`user:${username.toLowerCase()}`, 5, 300000)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add minimum delay to prevent timing attacks
    const startTime = Date.now();

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .ilike('username', username)
      .maybeSingle();

    if (profileError || !profileData) {
      // Ensure consistent response time
      const elapsed = Date.now() - startTime;
      if (elapsed < 200) {
        await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
      }
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      profileData.user_id
    );

    if (userError || !userData?.user?.email) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 200) {
        await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
      }
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure consistent response time
    const elapsed = Date.now() - startTime;
    if (elapsed < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
    }

    return new Response(
      JSON.stringify({ email: userData.user.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error looking up user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
