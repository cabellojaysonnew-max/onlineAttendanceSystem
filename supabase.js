import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabase = createClient(
  "https://ytfpiyfapvybihlngxks.supabase.co",
  "PASTE_YOUR_sb_publishable_KEY_HERE"
);
