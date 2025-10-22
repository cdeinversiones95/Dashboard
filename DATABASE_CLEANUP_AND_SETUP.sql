-- ============================================================================
-- PASO 1: LIMPIAR TODAS LAS TABLAS EXISTENTES
-- ============================================================================
-- Ejecuta primero SOLO esta sección
-- ============================================================================

-- Eliminar tablas en orden correcto (de dependientes a independientes)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.pending_deposits CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.app_stats CASCADE;

-- Eliminar triggers si existen
DROP TRIGGER IF EXISTS create_wallet_on_user_creation ON auth.users CASCADE;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS create_user_wallet() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- ✅ PASO 1 COMPLETADO - Ahora ejecuta DATABASE_SETUP_SIMPLE.sql
-- ============================================================================

SELECT 'Limpieza completada. Ahora ejecuta DATABASE_SETUP_SIMPLE.sql completo.' as mensaje;
