import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Demo user credentials
    const demoEmail = 'demo@perfectsmile.demo'
    const demoPassword = 'demo123'
    const demoUsername = 'demo'
    const demoFullName = 'Utilizator Demo'

    // Check if demo user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', demoUsername)
      .maybeSingle()

    if (existingProfile) {
      console.log('Demo user already exists')
      return new Response(
        JSON.stringify({ success: true, message: 'Demo user already exists', username: demoUsername, password: demoPassword }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the demo user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: demoFullName
      }
    })

    if (authError) {
      console.error('Error creating demo user:', authError)
      throw authError
    }

    const userId = authData.user.id
    console.log('Created demo user with ID:', userId)

    // Update the profile with username and disable password change requirement
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        username: demoUsername,
        full_name: demoFullName,
        must_change_password: false
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Give demo user admin role for full access
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, { onConflict: 'user_id,role' })

    if (roleError) {
      console.error('Error setting role:', roleError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo user created successfully',
        username: demoUsername,
        password: demoPassword
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
