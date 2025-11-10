import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Repuesto {
  descripcion: string;
  cantidad: number;
  costo: number;
}

interface EmailRequest {
  clienteEmail: string;
  clienteNombre: string;
  numeroOrden: string;
  marca: string;
  modelo: string;
  repuestos: Repuesto[];
  costoTotal: number;
}

const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    console.log("Enviando cotización a:", data.clienteEmail);

    const repuestosHTML = data.repuestos.map(r => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${r.descripcion}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${r.cantidad}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCOP(r.costo)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCOP(r.cantidad * r.costo)}</td>
      </tr>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "Reparaciones <onboarding@resend.dev>",
      to: [data.clienteEmail],
      subject: `Cotización de Reparación - Orden ${data.numeroOrden}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 650px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }
              .label { font-weight: bold; color: #dc2626; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; }
              th { background-color: #dc2626; color: white; padding: 12px; text-align: left; }
              .total-row { background-color: #dc2626; color: white; font-weight: bold; font-size: 1.2em; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #dc2626; text-align: center; }
              .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .button:hover { background-color: #b91c1c; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Cotización de Reparación</h1>
                <p style="margin: 0;">Orden: ${data.numeroOrden}</p>
              </div>
              <div class="content">
                <h2>Estimado/a ${data.clienteNombre},</h2>
                <p>Hemos completado el diagnóstico de su dispositivo. A continuación el detalle de los repuestos necesarios:</p>
                
                <div class="info-row">
                  <span class="label">Dispositivo:</span> ${data.marca} ${data.modelo}
                </div>
                
                <h3 style="color: #dc2626; margin-top: 20px;">Repuestos Necesarios</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th style="text-align: center;">Cantidad</th>
                      <th style="text-align: right;">Precio Unit.</th>
                      <th style="text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${repuestosHTML}
                    <tr class="total-row">
                      <td colspan="3" style="padding: 15px; text-align: right;">TOTAL:</td>
                      <td style="padding: 15px; text-align: right;">${formatCOP(data.costoTotal)}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div class="footer">
                  <p><strong>Por favor, revise la cotización y confirme si desea proceder con la reparación.</strong></p>
                  <p>Puede aceptar o rechazar la cotización ingresando a nuestra página de consulta con su número de orden:</p>
                  <p style="font-size: 1.2em; font-weight: bold; color: #dc2626; margin: 15px 0;">${data.numeroOrden}</p>
                  <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                    <em>Nota: Si decide rechazar la cotización, se cobrará un cargo de ${formatCOP(70000)} por concepto de revisión y diagnóstico.</em>
                  </p>
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
