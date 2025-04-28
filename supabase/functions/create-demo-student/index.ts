
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

    // Create profile first
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: student_id,
        email: email_address, 
        first_name: first_name || 'Demo',
        last_name: last_name || 'Student',
        role: 'student'
      });

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Then create student record
    const { data: studentData, error: studentError } = await supabaseClient
      .from('students')
      .insert({
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
