import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - PROYECTO ORIGINAL
const SUPABASE_URL = 'https://inontxioyantwtadqbnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlub250eGlveWFudHd0YWRxYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTQ1NDAsImV4cCI6MjA3NjM3MDU0MH0.FIwqp4rRxqYA91oOefN9JVPJ_Cafknb432li4PNWUv4';

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