-- ============================================================================
-- QUERIES PARA DASHBOARD - GESTIÓN DE TRANSACCIONES
-- ============================================================================

-- 1. VER TODAS LAS SOLICITUDES DE RECARGA PENDIENTES
SELECT 
  pd.id,
  pd.user_id,
  pd.amount,
  pd.payment_method_type,
  pd.payment_reference,
  pd.proof_image_url,
  pd.status,
  pd.created_at,
  u.phone,
  up.name as user_name
FROM pending_deposits pd
LEFT JOIN auth.users u ON pd.user_id = u.id
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
WHERE pd.status = 'pending'
ORDER BY pd.created_at DESC;

-- 2. VER TODAS LAS TRANSACCIONES (PENDIENTES, APROBADAS, RECHAZADAS)
SELECT 
  pd.id,
  pd.user_id,
  pd.amount,
  pd.payment_method_type,
  pd.payment_reference,
  pd.proof_image_url,
  pd.status,
  pd.created_at,
  pd.updated_at,
  u.phone,
  up.name as user_name,
  pm.details as payment_details
FROM pending_deposits pd
LEFT JOIN auth.users u ON pd.user_id = u.id
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN payment_methods pm ON pd.payment_method_id = pm.id
ORDER BY pd.created_at DESC
LIMIT 100;

-- 3. APROBAR UNA RECARGA
-- Esta función aprueba la recarga y actualiza el balance del usuario
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
  -- Obtener información del depósito
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM pending_deposits
  WHERE id = deposit_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Depósito no encontrado o ya procesado');
  END IF;

  -- Obtener wallet del usuario
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM wallets
  WHERE user_id = v_user_id;

  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet no encontrada');
  END IF;

  -- Calcular nuevo balance
  v_new_balance := v_current_balance + v_amount;

  -- Actualizar balance del wallet
  UPDATE wallets
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Crear registro en transactions
  INSERT INTO transactions (
    wallet_id,
    type,
    amount,
    balance_after,
    description,
    status
  ) VALUES (
    v_wallet_id,
    'deposit',
    v_amount,
    v_new_balance,
    'Recarga aprobada - Ref: ' || (SELECT payment_reference FROM pending_deposits WHERE id = deposit_id),
    'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Actualizar estado del pending_deposit
  UPDATE pending_deposits
  SET status = 'approved',
      updated_at = NOW()
  WHERE id = deposit_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
END;
$$;

-- 4. RECHAZAR UNA RECARGA
CREATE OR REPLACE FUNCTION reject_deposit(deposit_id UUID, rejection_reason TEXT DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar que el depósito existe y está pendiente
  SELECT user_id INTO v_user_id
  FROM pending_deposits
  WHERE id = deposit_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Depósito no encontrado o ya procesado');
  END IF;

  -- Actualizar estado del pending_deposit
  UPDATE pending_deposits
  SET status = 'rejected',
      updated_at = NOW()
  WHERE id = deposit_id;

  RETURN json_build_object('success', true, 'message', 'Depósito rechazado');
END;
$$;

-- 5. VER ESTADÍSTICAS DEL DÍA
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
  COUNT(*) FILTER (WHERE status = 'approved') as aprobadas,
  COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas,
  SUM(amount) FILTER (WHERE status = 'approved') as monto_aprobado,
  SUM(amount) FILTER (WHERE status = 'pending') as monto_pendiente
FROM pending_deposits
WHERE DATE(created_at) = CURRENT_DATE;

-- 6. VER HISTORIAL DE UN USUARIO ESPECÍFICO
SELECT 
  pd.id,
  pd.amount,
  pd.payment_method_type,
  pd.payment_reference,
  pd.proof_image_url,
  pd.status,
  pd.created_at,
  pd.updated_at
FROM pending_deposits pd
WHERE pd.user_id = 'USER_ID_AQUI'
ORDER BY pd.created_at DESC;

-- ============================================================================
-- ✅ EJECUTAR ESTAS FUNCIONES
-- ============================================================================

-- Crear las funciones en tu base de datos ejecutando los CREATE OR REPLACE FUNCTION de arriba

-- ============================================================================
-- EJEMPLOS DE USO DESDE EL DASHBOARD
-- ============================================================================

-- Para aprobar un depósito:
-- SELECT approve_deposit('id-del-deposito-aqui');

-- Para rechazar un depósito:
-- SELECT reject_deposit('id-del-deposito-aqui', 'Comprobante inválido');

-- Para ver todas las transacciones pendientes:
-- SELECT * FROM pending_deposits WHERE status = 'pending' ORDER BY created_at DESC;
