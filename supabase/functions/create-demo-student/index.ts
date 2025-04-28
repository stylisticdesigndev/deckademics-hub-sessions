
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { email_address, first_name, last_name } = await req.json();

    if (!email_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the Admin key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Creating demo student with email:", email_address);

    // Step 1: First create the auth user with admin API
    console.log("Step 1: Creating auth user");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email_address,
      email_confirm: true,
      user_metadata: { 
        first_name: first_name || 'Demo', 
        last_name: last_name || 'Student',
        role: 'student'
      },
      app_metadata: { role: 'student' }
    });

    if (authError) {
      console.error("Failed to create auth user:", authError);
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUser.user.id;
    console.log("Auth user created with ID:", userId);

    // Step 2: Wait to ensure the user is properly created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Check if profile was created by the trigger, if not create it manually
    console.log("Step 2: Checking/creating profile");
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      console.log("No profile found, creating manually");
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email_address,
          first_name: first_name || 'Demo',
          last_name: last_name || 'Student',
          role: 'student'
        });

      if (profileError) {
        console.error("Failed to create profile:", profileError);
        // Log error but continue - we'll try to create the student record anyway
      } else {
        console.log("Profile created manually");
      }

      // Additional waiting time after profile creation
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log("Profile already exists");
    }

    // Step 4: Create student record with start_date
    console.log("Step 3: Creating student record");
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        id: userId,
        level: 'beginner',
        enrollment_status: 'active',
        start_date: today
      })
      .select()
      .single();

    if (studentError) {
      console.error("Failed to create student record:", studentError);
      return new Response(
        JSON.stringify({ error: `Failed to create student record: ${studentError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Student record created:", studentData);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Demo student created successfully", 
        student: studentData 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unexpected error in create-demo-student function:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
