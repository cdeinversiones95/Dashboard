-- ============================================================================
-- PASO 1: EJECUTA ESTO PRIMERO PARA LIMPIAR TODO
-- ============================================================================

DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.pending_deposits CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.app_stats CASCADE;

DROP TRIGGER IF EXISTS create_wallet_on_user_creation ON auth.users CASCADE;

DROP FUNCTION IF EXISTS create_user_wallet() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- ✅ LISTO - Ahora ejecuta DATABASE_SETUP_SIMPLE.sql
-- ============================================================================
