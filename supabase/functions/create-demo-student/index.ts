
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
    const { student_id, email_address, first_name, last_name } = await req.json();

    if (!student_id || !email_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the Admin key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Creating demo student with ID:", student_id);

    // First, create auth user to satisfy foreign key constraint
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      uuid: student_id,
      email: email_address,
      email_confirm: true,
      user_metadata: { first_name, last_name },
      app_metadata: { role: 'student' }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Profile should be automatically created by the handle_new_user trigger function
    
    // Create student record if needed (handle_new_user should create it, but let's ensure it exists)
    const { data: studentData, error: studentError } = await supabaseClient
      .from('students')
      .upsert({
        id: student_id,
        level: 'beginner',
        enrollment_status: 'active'
      })
      .select();

    if (studentError) {
      throw new Error(`Failed to create student: ${studentError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, student: studentData[0] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in create-demo-student function:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
