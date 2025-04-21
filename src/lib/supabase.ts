import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xtoqxoftxekpkjkehluw.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b3F4b2Z0eGVrcGtqa2VobHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDEwMTAsImV4cCI6MjA1OTk3NzAxMH0.G1qxkMeNu8gmvmXwq42qjwy2c7UK5kiL2ttd-RBpY5M';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type { Database }; 