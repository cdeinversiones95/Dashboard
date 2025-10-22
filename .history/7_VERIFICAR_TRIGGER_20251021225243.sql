-- ============================================================================
-- VERIFICAR Y REPARAR TRIGGER DE CREACIÓN DE USUARIO Y WALLET
-- ============================================================================

-- 1. Verificar si el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_table = 'users'
ORDER BY event_object_table;

-- 2. Verificar si la función existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%user%wallet%'
ORDER BY routine_name;

-- 3. Ver usuarios en auth.users (tabla de autenticación)
SELECT 
    id,
    email,
    raw_user_meta_data->>'phone' as phone,
    raw_user_meta_data->>'display_name' as display_name,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. Ver usuarios en public.users (tabla de perfiles)
SELECT 
    id,
    phone,
    display_name,
    status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Ver wallets creadas
SELECT 
    id,
    user_id,
    balance,
    status,
    created_at
FROM public.wallets
ORDER BY created_at DESC
LIMIT 5;
