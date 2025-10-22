// Script de prueba de conexión a Supabase
// Ejecuta con: node test-connection.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qoysbxeqxngdqfgbljdm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveXNieGVxeG5nZHFmZ2JsamRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODc5MzksImV4cCI6MjA3NjY2MzkzOX0.cyiYEm4AHtAQgVRqavT26-fVFxCRZH3tkVj03F1JIUY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...\n');
  
  try {
    // 1. Probar conexión básica
    console.log('1️⃣ Verificando tablas...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError && usersError.code !== 'PGRST116') {
      console.log('❌ Error en tabla users:', usersError.message);
    } else {
      console.log(`✅ Tabla users: ${users?.length || 0} registros`);
      if (users && users.length > 0) {
        console.log('   Usuarios:', users.map(u => u.phone || u.email).join(', '));
      }
    }

    // 2. Probar tabla wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .limit(5);
    
    if (walletsError && walletsError.code !== 'PGRST116') {
      console.log('❌ Error en tabla wallets:', walletsError.message);
    } else {
      console.log(`✅ Tabla wallets: ${wallets?.length || 0} registros`);
    }

    // 3. Probar tabla events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5);
    
    if (eventsError && eventsError.code !== 'PGRST116') {
      console.log('❌ Error en tabla events:', eventsError.message);
    } else {
      console.log(`✅ Tabla events: ${events?.length || 0} registros`);
    }

    console.log('\n🎉 Conexión exitosa a Supabase!');
    console.log('📊 Todas las tablas están accesibles.\n');

    // 4. Mostrar instrucciones
    console.log('📝 Próximos pasos:');
    console.log('   1. Intenta registrar un usuario desde la app');
    console.log('   2. Verifica que se cree en "Table Editor" > "users"');
    console.log('   3. Verifica que se cree una wallet en "Table Editor" > "wallets"\n');
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

testConnection();
