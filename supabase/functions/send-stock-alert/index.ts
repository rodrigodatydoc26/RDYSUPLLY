// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { alert_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch Alert Details
    const { data: alert, error: alertError } = await supabase
      .from('stock_alerts')
      .select(`
        *,
        contract:contracts(name),
        equipment:contract_equipment(serial_number, location)
      `)
      .eq('id', alert_id)
      .single();

    if (alertError || !alert) throw new Error('Alert not found');

    // 2. Fetch Technicians
    const { data: technicians } = await supabase
      .from('profiles')
      .select('email, name')
      .in('id', (await supabase.from('contract_technicians').select('technician_id').eq('contract_id', alert.contract_id)).data?.map(t => t.technician_id) || []);

    const recipients = technicians?.map(t => t.email) || [];
    recipients.push('admin@rdysupply.com'); // Global Admin

    console.log(`Sending alert for ${alert.alert_type} in contract ${alert.contract.name}...`);
    console.log(`Recipients: ${recipients.join(', ')}`);

    // 3. Email Simulation (In production, replace with Resend/SendGrid)
    // For now, we update the status in DB
    await supabase.from('stock_alerts').update({ notified_email: true }).eq('id', alert_id);

    return new Response(JSON.stringify({ 
      message: "Alert processed successfully", 
      recipients 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
