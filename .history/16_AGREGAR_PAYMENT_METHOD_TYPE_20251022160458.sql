-- ============================================================================
-- AGREGAR COLUMNAS FALTANTES A PENDING_DEPOSITS
-- ============================================================================

-- Agregar columna para el tipo de método de pago (bank_transfer o usdt)
ALTER TABLE public.pending_deposits 
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50);

-- Agregar comentario
COMMENT ON COLUMN public.pending_deposits.payment_method_type IS 'Tipo de método de pago: bank_transfer o usdt';

-- ============================================================================
-- MIGRAR DATOS EXISTENTES
-- ============================================================================

-- Actualizar registros existentes basándose en payment_method_id
UPDATE public.pending_deposits pd
SET payment_method_type = 
  CASE 
    WHEN pm.type = 'bank_transfer' THEN 'bank_transfer'
    WHEN pm.type = 'crypto' THEN 'usdt'
    ELSE 'bank_transfer'
  END
FROM public.payment_methods pm
WHERE pd.payment_method_id = pm.id
AND pd.payment_method_type IS NULL;

-- Si no hay payment_method_id, asumir bank_transfer
UPDATE public.pending_deposits
SET payment_method_type = 'bank_transfer'
WHERE payment_method_type IS NULL;

-- ============================================================================
-- ✅ VERIFICACIÓN
-- ============================================================================

-- Ver columnas de pending_deposits
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pending_deposits'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver datos migrados
SELECT 
  id,
  amount,
  payment_method_type,
  payment_reference,
  status,
  created_at
FROM public.pending_deposits
ORDER BY created_at DESC
LIMIT 10;
