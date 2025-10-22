import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Verify2FARequest {
  email: string;
  password: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, code }: Verify2FARequest = await req.json();

    // Crear cliente de Supabase
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

    // Primero, verificar las credenciales
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Obtener el código almacenado y verificar
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('mfa_code, mfa_expires_at, activo')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabaseClient.auth.signOut();
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verificar si el usuario está activo
    if (!profile.activo) {
      await supabaseClient.auth.signOut();
      return new Response(
        JSON.stringify({ error: "Usuario inactivo" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verificar si el código ha expirado
    const expiresAt = new Date(profile.mfa_expires_at);
    const now = new Date();

    if (now > expiresAt) {
      await supabaseClient.auth.signOut();
      return new Response(
        JSON.stringify({ error: "El código ha expirado" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verificar si el código coincide
    if (profile.mfa_code !== code) {
      await supabaseClient.auth.signOut();
      return new Response(
        JSON.stringify({ error: "Código incorrecto" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Marcar el código como verificado y limpiar
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        mfa_code: null,
        mfa_expires_at: null,
        mfa_verified: true,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      await supabaseClient.auth.signOut();
      return new Response(
        JSON.stringify({ error: "Error al verificar el código" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("2FA verification successful for user:", authData.user.id);

    // Cerrar la sesión temporal para que el cliente pueda crear una nueva
    await supabaseClient.auth.signOut();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código verificado exitosamente"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error verifying 2FA code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
