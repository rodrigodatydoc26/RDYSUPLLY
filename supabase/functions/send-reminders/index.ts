// @ts-nocheck
// Supabase Edge Function: Send Reminders
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get current time info
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (Sun-Sat)
    const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // We check for reminders within a 15-minute window
    // This function should be run by a cron every 15 minutes
    
    console.log(`Checking reminders for Day: ${currentDay}, Time: ${currentTime}`);

    // 2. Query users with scheduled reminders that match today
    const { data: configs, error } = await supabase
      .from('user_configs')
      .select('user_id, reminder_times, operation_days, push_subscription')
      .not('push_subscription', 'is', null);

    if (error) throw error;

    const toNotify = (configs || []).filter((config: any) => {
      const days: number[] = config.operation_days || [];
      const times: string[] = config.reminder_times || [];
      
      // Check if today is one of the scheduled days
      if (!days.includes(currentDay)) return false;
      
      // Check if any scheduled time matches the current hour/minute (window of 15 min)
      return times.some((t: string) => {
        const [h, m] = t.split(':').map(Number);
        const [nowH, nowM] = currentTime.split(':').map(Number);
        const diff = Math.abs((nowH * 60 + nowM) - (h * 60 + m));
        return diff < 15;
      });
    });

    console.log(`Found ${toNotify.length} users to notify`);

    // 3. Send notifications (Simulated via console or real Push if keys exist)
    // For a real implementation, we would use a Push service or web-push library
    // Here we focus on the logic and trigger
    for (const config of toNotify) {
      console.log(`Sending reminder to user ${config.user_id}`);
      
      // Real Web Push implementation would go here:
      /*
      await fetch('https://fcm.googleapis.com/fcm/send', { ... }) 
      or use web-push library
      */
    }

    return new Response(JSON.stringify({ triggered: toNotify.length }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
