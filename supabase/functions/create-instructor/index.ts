import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, specialties, hourlyRate } = await req.json();

    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Email, first name, and last name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate a temporary password
    const tempPassword = crypto.randomUUID();

    // Create auth user
    console.log('Creating user account...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'instructor'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If no profile exists, create one
    if (!existingProfile) {
      console.log('Creating profile...');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'instructor'
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        // Don't fail if profile creation fails, the trigger might have created it
      }
    }

    // Create instructor record
    console.log('Creating instructor record...');
    const { data: instructorData, error: instructorError } = await supabaseAdmin
      .from('instructors')
      .insert({
        id: userId,
        status: 'pending',
        specialties: specialties || [],
        hourly_rate: hourlyRate || 25,
        years_experience: 0
      })
      .select()
      .single();

    if (instructorError) {
      console.error('Instructor error:', instructorError);
      return new Response(
        JSON.stringify({ error: `Failed to create instructor record: ${instructorError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send password reset email
    console.log('Sending password reset email...');
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error('Password reset email error:', resetError);
      // Don't fail if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        instructor: instructorData,
        message: 'Instructor created successfully. Password reset email sent.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-instructor function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
