// @ts-nocheck
// Supabase Edge Function: Send Stock Alert
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AlertWithDetails {
  id: string;
  contract_id: string;
  alert_type: string;
  contract: { name: string };
  equipment: { serial_number: string; location: string };
}

Deno.serve(async (req: Request) => {
  try {
    const { alert_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch Alert Details
    const { data: alertData, error: alertError } = await supabase
      .from('stock_alerts')
      .select(`
        id,
        contract_id,
        alert_type,
        contract:contracts(name),
        equipment:contract_equipment(serial_number, location)
      `)
      .eq('id', alert_id)
      .single();

    if (alertError || !alertData) throw new Error('Alert not found');
    const alert = alertData as unknown as AlertWithDetails;

    // 2. Fetch Technicians
    const { data: ctData } = await supabase
      .from('contract_technicians')
      .select('technician_id')
      .eq('contract_id', alert.contract_id);

    const technicianIds = ctData?.map((t: any) => t.technician_id) || [];

    const { data: technicians } = await supabase
      .from('profiles')
      .select('email, name')
      .in('id', technicianIds);

    const recipients = (technicians || []).map((t: { email: string }) => t.email);
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
