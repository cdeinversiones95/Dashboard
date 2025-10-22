-- ============================================================================
-- PASO 1: AGREGAR COLUMNA PAYMENT_METHOD_TYPE
-- ============================================================================

-- Agregar la columna si no existe
ALTER TABLE public.pending_deposits 
ADD COLUMN payment_method_type VARCHAR(50);

-- Actualizar registros existentes con valor por defecto
UPDATE public.pending_deposits
SET payment_method_type = 'bank_transfer'
WHERE payment_method_type IS NULL;

-- ============================================================================
-- PASO 2: VERIFICAR QUE SE AGREGÓ CORRECTAMENTE
-- ============================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pending_deposits' 
AND column_name = 'payment_method_type';

-- Si ves el resultado, la columna existe. Continúa con el siguiente paso.

-- ============================================================================
-- PASO 3: FUNCIONES PARA APROBAR Y RECHAZAR DEPÓSITOS
-- ============================================================================

-- Función para APROBAR depósitos
CREATE OR REPLACE FUNCTION approve_deposit(deposit_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM pending_deposits
  WHERE id = deposit_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Depósito no encontrado o ya procesado');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM wallets
  WHERE user_id = v_user_id;

  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet no encontrada');
  END IF;

  v_new_balance := v_current_balance + v_amount;

  UPDATE wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO transactions (wallet_id, type, amount, balance_after, description, status)
  VALUES (
    v_wallet_id, 'deposit', v_amount, v_new_balance,
    'Recarga aprobada - Ref: ' || (SELECT payment_reference FROM pending_deposits WHERE id = deposit_id),
    'completed'
  ) RETURNING id INTO v_transaction_id;

  UPDATE pending_deposits
  SET status = 'approved', updated_at = NOW()
  WHERE id = deposit_id;

  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id, 'new_balance', v_new_balance);
END;
$$;

-- Función para RECHAZAR depósitos
CREATE OR REPLACE FUNCTION reject_deposit(deposit_id UUID, rejection_reason TEXT DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM pending_deposits
  WHERE id = deposit_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Depósito no encontrado o ya procesado');
  END IF;

  UPDATE pending_deposits
  SET status = 'rejected', updated_at = NOW()
  WHERE id = deposit_id;

  RETURN json_build_object('success', true, 'message', 'Depósito rechazado');
END;
$$;

-- Función para ESTADÍSTICAS
CREATE OR REPLACE FUNCTION get_daily_stats()
RETURNS TABLE (
  pendientes BIGINT,
  aprobadas BIGINT,
  rechazadas BIGINT,
  monto_aprobado NUMERIC,
  monto_pendiente NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
    COUNT(*) FILTER (WHERE status = 'approved' AND DATE(updated_at) = CURRENT_DATE) as aprobadas,
    COUNT(*) FILTER (WHERE status = 'rejected' AND DATE(updated_at) = CURRENT_DATE) as rechazadas,
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND DATE(updated_at) = CURRENT_DATE), 0) as monto_aprobado,
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as monto_pendiente
  FROM pending_deposits;
$$;

-- ============================================================================
-- PASO 4: PROBAR QUE TODO FUNCIONA
-- ============================================================================

-- Ver todas las transacciones pendientes
SELECT 
  pd.id,
  pd.user_id,
  pd.amount,
  pd.payment_method_type,
  pd.payment_reference,
  pd.proof_image_url,
  pd.status,
  pd.created_at,
  REPLACE(REPLACE(u.email, '@phone.local', ''), '@user.temp', '') as phone,
  COALESCE(u.raw_user_meta_data->>'name', 'Usuario') as user_name
FROM pending_deposits pd
LEFT JOIN auth.users u ON pd.user_id = u.id
WHERE pd.status = 'pending'
ORDER BY pd.created_at DESC;

-- Ver estadísticas
SELECT * FROM get_daily_stats();

-- ============================================================================
-- ✅ ÉXITO - TODO LISTO PARA EL DASHBOARD
-- ============================================================================
