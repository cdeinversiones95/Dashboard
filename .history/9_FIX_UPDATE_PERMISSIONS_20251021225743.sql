-- ============================================================================
-- FIX: Permitir actualizar wallets y crear transacciones desde el dashboard
-- ============================================================================

-- Política para permitir actualizar wallets
DROP POLICY IF EXISTS "Allow update wallets for all" ON public.wallets;

CREATE POLICY "Allow update wallets for all" 
ON public.wallets FOR UPDATE 
USING (true)  -- Cualquiera puede actualizar
WITH CHECK (true);

-- Política para permitir insertar transacciones
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

CREATE POLICY "System can insert transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (true);

-- Política para leer transacciones
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

CREATE POLICY "Allow read all transactions" 
ON public.transactions FOR SELECT 
USING (true);

-- ============================================================================
-- ✅ LISTO - Ahora se puede actualizar balance desde el dashboard
-- ============================================================================

SELECT 'Politicas de actualizacion configuradas' as resultado;
