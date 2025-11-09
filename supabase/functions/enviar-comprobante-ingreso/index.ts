import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  clienteEmail: string;
  clienteNombre: string;
  numeroOrden: string;
  marca: string;
  modelo: string;
  tipoProducto: string;
  descripcionFalla: string;
  estadoFisico: string;
  fechaIngreso: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    console.log("Enviando comprobante de ingreso a:", data.clienteEmail);

    const emailResponse = await resend.emails.send({
      from: "Reparaciones <onboarding@resend.dev>",
      to: [data.clienteEmail],
      subject: `Comprobante de Ingreso - Orden ${data.numeroOrden}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
              .label { font-weight: bold; color: #dc2626; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc2626; text-align: center; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Comprobante de Ingreso</h1>
                <p style="margin: 0;">Orden: ${data.numeroOrden}</p>
              </div>
              <div class="content">
                <h2>Estimado/a ${data.clienteNombre},</h2>
                <p>Su dispositivo ha sido recibido correctamente. A continuación los detalles:</p>
                
                <div class="info-row">
                  <span class="label">Número de Orden:</span> ${data.numeroOrden}
                </div>
                <div class="info-row">
                  <span class="label">Fecha de Ingreso:</span> ${data.fechaIngreso}
                </div>
                <div class="info-row">
                  <span class="label">Dispositivo:</span> ${data.marca} ${data.modelo}
                </div>
                <div class="info-row">
                  <span class="label">Tipo:</span> ${data.tipoProducto}
                </div>
                <div class="info-row">
                  <span class="label">Descripción de la Falla:</span> ${data.descripcionFalla}
                </div>
                ${data.estadoFisico ? `
                <div class="info-row">
                  <span class="label">Estado Físico:</span> ${data.estadoFisico}
                </div>
                ` : ''}
                
                <div class="footer">
                  <p><strong>Importante:</strong> Guarde este número de orden para consultar el estado de su reparación.</p>
                  <p>Puede consultar el estado en cualquier momento en nuestra página de consulta.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error al enviar email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
