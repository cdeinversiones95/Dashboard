-- ============================================================================
-- FIX: Permitir que el dashboard lea todos los usuarios
-- ============================================================================

-- Política para que cualquier usuario autenticado pueda leer TODOS los usuarios
-- (Necesario para el dashboard admin)

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;

CREATE POLICY "Enable read access for authenticated users" 
ON public.users FOR SELECT 
USING (true);  -- Permitir a todos leer

-- También para wallets
DROP POLICY IF EXISTS "Service role can read all wallets" ON public.wallets;

CREATE POLICY "Service role can read all wallets" 
ON public.wallets FOR SELECT 
USING (true);  -- Permitir a todos leer

-- ============================================================================
-- ✅ LISTO - Ahora el dashboard podrá ver todos los usuarios
-- ============================================================================

SELECT 'Politicas actualizadas correctamente' as resultado;
