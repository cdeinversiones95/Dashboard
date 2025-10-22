import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - PROYECTO LIMPIO
const SUPABASE_URL = 'https://qoysbxeqxngdqfgbljdm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveXNieGVxeG5nZHFmZ2JsamRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODc5MzksImV4cCI6MjA3NjY2MzkzOX0.cyiYEm4AHtAQgVRqavT26-fVFxCRZH3tkVj03F1JIUY';

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Configuración de tablas
export const TABLES = {
  USERS: 'users',
  INVESTMENTS: 'investments', 
  TRANSACTIONS: 'transactions',
  STATS: 'stats',
  TEAMS: 'teams',
  MATCHES: 'matches',
};

export default supabase;