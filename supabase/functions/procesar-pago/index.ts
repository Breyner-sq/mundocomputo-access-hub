import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { reparacion_id, monto, metodo_pago } = await req.json();

    // Validar datos de entrada
    if (!reparacion_id || !monto || !metodo_pago) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar método de pago
    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!metodosValidos.includes(metodo_pago)) {
      return new Response(
        JSON.stringify({ error: 'Método de pago inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SIMULACIÓN: Todos los pagos son siempre aprobados
    const exito = true;
    const estado = 'aprobado';
    const numero_transaccion = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear registro de pago
    const { data: pago, error: errorPago } = await supabaseClient
      .from('pagos_reparaciones')
      .insert({
        reparacion_id,
        monto,
        metodo_pago,
        estado,
        numero_transaccion,
      })
      .select()
      .single();

    if (errorPago) {
      console.error('Error al crear pago:', errorPago);
      return new Response(
        JSON.stringify({ error: 'Error al procesar pago', details: errorPago }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si el pago fue aprobado, actualizar reparación
    if (exito) {
      const { error: errorReparacion } = await supabaseClient
        .from('reparaciones')
        .update({ pagado: true })
        .eq('id', reparacion_id);

      if (errorReparacion) {
        console.error('Error al actualizar reparación:', errorReparacion);
      }
    }

    return new Response(
      JSON.stringify({
        success: exito,
        pago,
        mensaje: exito ? 'Pago procesado exitosamente' : 'Pago rechazado, intente nuevamente',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en procesar-pago:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
