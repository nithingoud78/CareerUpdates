import { supabaseAdmin } from './src/integrations/supabase/client.server';

async function main() {
  const { data, error } = await supabaseAdmin.from('scheduler_settings').select('*');
  console.log('scheduler_settings:', error ? error.message : 'exists');
  const { data: d2, error: e2 } = await supabaseAdmin.from('scheduler_logs').select('*');
  console.log('scheduler_logs:', e2 ? e2.message : 'exists');
}
main();
