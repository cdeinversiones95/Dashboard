-- ============================================================================
-- FIX: Políticas para permitir lectura de wallets en JOIN
-- ============================================================================

-- Agregar política para permitir inserción en wallets desde el sistema
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.wallets;

CREATE POLICY "System can insert wallets" 
ON public.wallets FOR INSERT 
WITH CHECK (true);

-- Permitir que el servicio lea todas las wallets (para el dashboard admin)
CREATE POLICY "Service role can read all wallets" 
ON public.wallets FOR SELECT 
USING (true);

-- ============================================================================
-- ✅ LISTO - Ahora el dashboard podrá leer usuarios con sus wallets
-- ============================================================================
