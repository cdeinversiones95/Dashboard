-- ============================================================================
-- CREAR TABLA DE MONTOS DE RECARGA
-- Script seguro que no causará conflictos con datos existentes
-- ============================================================================

-- 1. Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS public.recharge_amounts CASCADE;

-- 2. Crear tabla de montos predeterminados de recarga
CREATE TABLE public.recharge_amounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'DOP' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insertar montos predeterminados en pesos dominicanos
INSERT INTO public.recharge_amounts (amount, currency, display_order)
VALUES 
  (1000.00, 'DOP', 1),
  (2500.00, 'DOP', 2),
  (5000.00, 'DOP', 3),
  (10000.00, 'DOP', 4),
  (25000.00, 'DOP', 5),
  (50000.00, 'DOP', 6);

-- 4. Habilitar RLS para recharge_amounts
ALTER TABLE public.recharge_amounts ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar política si existe
DROP POLICY IF EXISTS "Anyone can read recharge amounts" ON public.recharge_amounts;

-- 6. Crear política de lectura pública
CREATE POLICY "Anyone can read recharge amounts" 
ON public.recharge_amounts FOR SELECT 
USING (true);

-- 7. Verificar que pending_deposits tenga la columna payment_reference
-- (Si no existe, la creamos)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pending_deposits' 
    AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.pending_deposits 
    ADD COLUMN payment_reference VARCHAR(100);
  END IF;
END $$;

-- 8. Asegurar que existen las políticas para pending_deposits
DROP POLICY IF EXISTS "Users can create own deposit requests" ON public.pending_deposits;
DROP POLICY IF EXISTS "Users can view own deposit requests" ON public.pending_deposits;

CREATE POLICY "Users can create own deposit requests"
ON public.pending_deposits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deposit requests"
ON public.pending_deposits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- ✅ VERIFICACIÓN
-- ============================================================================

-- Ver montos de recarga creados
SELECT 
  id,
  amount,
  currency,
  is_active,
  display_order
FROM public.recharge_amounts 
ORDER BY display_order;

-- Contar registros
SELECT COUNT(*) as total_montos FROM public.recharge_amounts;

-- Ver políticas activas en recharge_amounts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'recharge_amounts';

-- Ver políticas activas en pending_deposits
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'pending_deposits';
