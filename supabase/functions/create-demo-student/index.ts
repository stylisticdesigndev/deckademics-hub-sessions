import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller and verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = userData.user.id;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify caller is admin
    const { data: roleCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .single();

    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email_address, first_name, last_name } = await req.json();

    if (!email_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating demo student with email:", email_address);

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

    await new Promise(resolve => setTimeout(resolve, 1000));

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
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const today = new Date().toISOString().split('T')[0];
    
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
    console.error("Unexpected error:", (error as Error)?.message ?? error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
