import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
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

    // Get the authorization header to verify the requesting user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nu ești autorizat' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Token invalid' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Nu ai permisiuni de administrator' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, fullName, role, username } = await req.json();

    if (!password || !username) {
      return new Response(
        JSON.stringify({ error: 'Username și parola sunt obligatorii' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the notification email (can be shared across users)
    const notificationEmail = email || null;
    
    // Generate a unique internal email for auth (username-based to ensure uniqueness)
    const internalAuthEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@internal.perfectsmile.local`;

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Parola trebuie să aibă minim 6 caractere' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (username.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Username-ul trebuie să aibă minim 3 caractere' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if username already exists
    const { data: existingUsername, error: usernameCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (usernameCheckError) {
      console.error('Error checking username:', usernameCheckError);
    }

    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: 'Acest nume de utilizator este deja folosit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user using admin API with internal email (doesn't affect current session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: internalAuthEmail,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      // Translate common Supabase auth errors to Romanian
      let errorMessage = createError.message;
      if (createError.message.includes('already been registered')) {
        // This shouldn't happen since username is unique, but handle it
        errorMessage = 'Acest nume de utilizator generează un email intern duplicat. Încercați alt username.';
      } else if (createError.message.includes('invalid format')) {
        errorMessage = 'Formatul username-ului nu este valid';
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Wait for trigger to create profile, then update with username, notification_email and must_change_password
    if (newUser.user) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update or insert profile with username, notification_email and must_change_password = true
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: newUser.user.id,
          full_name: fullName || null,
          username: username,
          notification_email: notificationEmail,
          must_change_password: true,
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Error setting profile:', profileError);
        // If username constraint fails, delete the user and return error
        if (profileError.message.includes('unique') || profileError.message.includes('duplicate')) {
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: 'Acest nume de utilizator este deja folosit' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // If role is admin, update the role
      if (role === 'admin') {
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', newUser.user.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user?.id, 
          email: notificationEmail,
          internalEmail: internalAuthEmail,
          username: username
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(
      JSON.stringify({ error: 'Eroare internă la crearea utilizatorului' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
