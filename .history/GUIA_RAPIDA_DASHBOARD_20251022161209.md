# 🚀 GUÍA RÁPIDA: Configurar Dashboard de Transacciones

## ⚠️ IMPORTANTE: Ejecuta estos comandos EN ORDEN

---

## 📋 PASO 1: Agregar columna payment_method_type

Ve a **Supabase > SQL Editor** y ejecuta **SOLO** este comando:

```sql
ALTER TABLE public.pending_deposits 
ADD COLUMN payment_method_type VARCHAR(50);
```

Luego ejecuta:

```sql
UPDATE public.pending_deposits
SET payment_method_type = 'bank_transfer'
WHERE payment_method_type IS NULL;
```

✅ **Verifica** que se creó:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pending_deposits' 
AND column_name = 'payment_method_type';
```

Deberías ver: `payment_method_type | character varying`

---

## 📋 PASO 2: Crear función para APROBAR depósitos

Ejecuta esto en SQL Editor:

```sql
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
```

---

## 📋 PASO 3: Crear función para RECHAZAR depósitos

```sql
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
```

---

## 📋 PASO 4: Crear función para ESTADÍSTICAS

```sql
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
```

---

## 📋 PASO 5: PROBAR que todo funciona

```sql
-- Ver transacciones pendientes
SELECT 
  pd.id,
  pd.user_id,
  pd.amount,
  pd.payment_method_type,
  pd.payment_reference,
  pd.status,
  pd.created_at
FROM pending_deposits pd
WHERE pd.status = 'pending'
ORDER BY pd.created_at DESC;
```

Si NO hay errores, ¡todo está listo! ✅

---

## 📋 PASO 6: Copiar componente al Dashboard

1. Abre tu proyecto dashboard: `C:\Users\Gabriel\Desktop\JORGE 3\cde-dashboard`
2. Crea el archivo: `pages/transactions.jsx`
3. Copia el contenido de: `DASHBOARD_TransactionManagement.jsx`
4. Actualiza la clave de Supabase en el archivo
5. Agrega la ruta al menú de navegación

---

## 🎉 ¡LISTO!

Ahora puedes:
- ✅ Ver todas las solicitudes de recarga
- ✅ Ver el comprobante de pago
- ✅ Aprobar recargas (actualiza balance automáticamente)
- ✅ Rechazar recargas
- ✅ Ver estadísticas en tiempo real
