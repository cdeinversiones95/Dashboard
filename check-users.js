const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qoysbxeqxngdqfgbljdm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveXNieGVxeG5nZHFmZ2JsamRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA4NzkzOSwiZXhwIjoyMDc2NjYzOTM5fQ.-uU2Aw0eClPRCdEWRyiPFkKabBYc4qojF74T3IGNEaE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUsers() {
  console.log('🔍 Verificando usuarios en la base de datos...\n');

  // Verificar auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  console.log('📊 Usuarios en auth.users (autenticación):');
  if (authError) {
    console.log('❌ Error:', authError.message);
  } else {
    console.log(`✅ Total: ${authUsers?.users?.length || 0} usuarios`);
    authUsers?.users?.forEach((user, i) => {
      console.log(`   ${i + 1}. Email: ${user.email}, Phone: ${user.user_metadata?.phone || 'N/A'}`);
    });
  }

  console.log('\n📊 Usuarios en public.users (perfiles):');
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('*');

  if (publicError) {
    console.log('❌ Error:', publicError.message);
  } else {
    console.log(`✅ Total: ${publicUsers?.length || 0} usuarios`);
    publicUsers?.forEach((user, i) => {
      console.log(`   ${i + 1}. Phone: ${user.phone}, Name: ${user.display_name}`);
    });
  }

  console.log('\n📊 Wallets en public.wallets:');
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('*');

  if (walletsError) {
    console.log('❌ Error:', walletsError.message);
  } else {
    console.log(`✅ Total: ${wallets?.length || 0} wallets`);
    wallets?.forEach((wallet, i) => {
      console.log(`   ${i + 1}. User ID: ${wallet.user_id.substring(0, 8)}..., Balance: $${wallet.balance}`);
    });
  }

  console.log('\n📋 Diagnóstico:');
  const authCount = authUsers?.users?.length || 0;
  const publicCount = publicUsers?.length || 0;
  const walletCount = wallets?.length || 0;

  if (authCount > publicCount) {
    console.log('⚠️  HAY USUARIOS EN AUTH.USERS QUE NO ESTÁN EN PUBLIC.USERS');
    console.log('    El trigger NO está funcionando correctamente.');
  } else if (authCount === 0) {
    console.log('ℹ️  No hay usuarios registrados. Registra uno desde la app móvil.');
  } else if (authCount === publicCount && publicCount === walletCount) {
    console.log('✅ Todo está sincronizado correctamente!');
  } else {
    console.log('⚠️  Hay inconsistencia en los datos.');
  }
}

checkUsers();
