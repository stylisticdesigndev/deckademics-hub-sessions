
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { student_id, instructor_id } = await req.json()

    // Validate input
    if (!student_id || !instructor_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Verify student exists and is active
    const { data: studentData, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', student_id)
      .eq('enrollment_status', 'active')
      .single()

    if (studentError || !studentData) {
      return new Response(
        JSON.stringify({ 
          error: 'Student not found or not active', 
          details: studentError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify instructor exists and is active
    const { data: instructorData, error: instructorError } = await supabaseClient
      .from('instructors')
      .select('*')
      .eq('id', instructor_id)
      .eq('status', 'active')
      .single()

    if (instructorError || !instructorData) {
      return new Response(
        JSON.stringify({ 
          error: 'Instructor not found or not active', 
          details: instructorError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create/update the relationship between student and instructor
    // For this example, we're assuming a direct field in the students table
    // In a production app, you might have a junction table instead
    const { data: updateData, error: updateError } = await supabaseClient
      .from('students')
      .update({ instructor_id: instructor_id })
      .eq('id', student_id)
      .select()

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to assign student to instructor', 
          details: updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Student assigned to instructor successfully',
        data: updateData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    // Handle any unexpected errors
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
