import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

Deno.serve(async (req) => {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear cliente de Supabase con la URL y service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar que el usuario sea administrador
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que tenga rol de administrador
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'administrador');
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Consultar logs de autentificación
    const query = `
      select id, auth_logs.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg 
      from auth_logs
      cross join unnest(metadata) as metadata
      order by timestamp desc
      limit 100
    `;

    // Hacer la consulta a analytics
    const analyticsUrl = `${supabaseUrl}/rest/v1/rpc/analytics_query`;
    const analyticsResponse = await fetch(analyticsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ query_text: query }),
    });

    if (!analyticsResponse.ok) {
      // Si no hay acceso a analytics, devolver array vacío
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const logs = await analyticsResponse.json();

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
