import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Send2FARequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: Send2FARequest = await req.json();

    // Crear cliente de Supabase con la clave de servicio
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

    // Verificar credenciales del usuario
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

    // Verificar si el usuario está activo
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('activo, nombre_completo')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile?.activo) {
      return new Response(
        JSON.stringify({ error: "Usuario inactivo o no encontrado" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calcular tiempo de expiración (5 minutos)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Guardar código en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        mfa_code: code,
        mfa_expires_at: expiresAt,
        mfa_verified: false,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Error al guardar el código" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Enviar código por correo usando Resend
    const emailBody = {
      from: "MundoComputo <ventas@email.juanchito.me>",
      to: [email],
      subject: "Código de verificación - MundoComputo",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Código de Verificación</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">MundoComputo</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Código de Verificación</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
              <p style="margin: 0 0 20px 0;">Hola ${profile.nombre_completo || 'Usuario'},</p>
              
              <p style="margin: 0 0 20px 0;">
                Has solicitado iniciar sesión en MundoComputo. Usa el siguiente código de verificación para completar tu inicio de sesión:
              </p>
              
              <div style="background: #f0f4ff; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                  ${code}
                </div>
              </div>
              
              <p style="margin: 20px 0; color: #666; font-size: 14px;">
                Este código expirará en <strong>5 minutos</strong>.
              </p>
              
              <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este correo. Tu cuenta está segura.
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0;">
                  Este es un correo automático, por favor no respondas a este mensaje.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailBody),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Error sending email:", errorData);
      return new Response(
        JSON.stringify({ error: "Error al enviar el correo" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailData = await emailResponse.json();
    console.log("2FA code sent successfully:", emailData);

    // Cerrar la sesión temporal
    await supabaseClient.auth.signOut();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código enviado exitosamente",
        userId: authData.user.id 
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
    console.error("Error sending 2FA code:", error);
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
