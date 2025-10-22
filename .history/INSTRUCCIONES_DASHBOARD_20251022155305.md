# 📊 Instrucciones para Integrar Gestión de Transacciones en el Dashboard

## 🎯 Objetivo
Crear una sección en el dashboard donde puedas:
- ✅ Ver todas las solicitudes de recarga (pendientes, aprobadas, rechazadas)
- ✅ Ver el comprobante de pago adjunto por el usuario
- ✅ Aprobar recargas (actualiza el balance automáticamente)
- ✅ Rechazar recargas
- ✅ Ver estadísticas del día

---

## 📝 PASO 1: Ejecutar SQL en Supabase

### 1.1 - Crear Función para Aprobar Depósitos
Ve a **SQL Editor** en Supabase y ejecuta:

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
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = v_wallet_id;

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
```

### 1.2 - Crear Función para Rechazar Depósitos
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
  SET status = 'rejected',
      updated_at = NOW()
  WHERE id = deposit_id;

  RETURN json_build_object('success', true, 'message', 'Depósito rechazado');
END;
$$;
```

### 1.3 - Crear Función para Estadísticas
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

## 💻 PASO 2: Integrar en el Dashboard Next.js

### 2.1 - Copiar el Componente
1. Ve a tu proyecto dashboard: `C:\Users\Gabriel\Desktop\JORGE 3\cde-dashboard`
2. Crea el archivo: `pages/transactions.jsx` o `components/TransactionManagement.jsx`
3. Copia el contenido del archivo `DASHBOARD_TransactionManagement.jsx` que creé

### 2.2 - Actualizar Credenciales
En el archivo, reemplaza `TU_SUPABASE_KEY_AQUI` con tu clave de Supabase:
```javascript
const supabase = createClient(
  'https://qoysbxeqxngdqfgbljdm.supabase.co',
  'TU_ANON_KEY_AQUI' // Consíguela en Supabase > Settings > API
);
```

### 2.3 - Agregar al Menú de Navegación
En tu archivo de navegación (ej. `components/Sidebar.jsx`), agrega:
```jsx
<Link href="/transactions">
  <a className="nav-item">
    💰 Gestión de Transacciones
  </a>
</Link>
```

---

## 🎨 PASO 3: Instalar Tailwind CSS (si no lo tienes)

Si tu dashboard no tiene Tailwind CSS instalado:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Luego en `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

En `styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🚀 PASO 4: Probar la Integración

1. **Inicia el dashboard**: `npm run dev`
2. **Ve a** `http://localhost:3000/transactions`
3. **Deberías ver:**
   - Estadísticas del día (pendientes, aprobadas, rechazadas, montos)
   - Filtros (Pendientes, Aprobadas, Rechazadas, Todas)
   - Tabla con todas las transacciones
   - Botones Aprobar/Rechazar en transacciones pendientes
   - Botón "Ver Imagen" para ver comprobantes

---

## ✅ Funcionalidades Implementadas

### 📊 Tarjetas de Estadísticas
- **Pendientes**: Número de recargas esperando aprobación
- **Aprobadas Hoy**: Recargas aprobadas en el día actual
- **Rechazadas Hoy**: Recargas rechazadas en el día actual
- **Monto Pendiente**: Suma total de dinero pendiente
- **Monto Aprobado**: Suma total aprobada hoy

### 🔍 Filtros
- **⏳ Pendientes**: Solo transacciones en espera
- **✅ Aprobadas**: Solo transacciones aprobadas
- **❌ Rechazadas**: Solo transacciones rechazadas
- **📋 Todas**: Ver todas las transacciones

### 📋 Tabla de Transacciones
Cada fila muestra:
- **Usuario**: Nombre y ID del usuario
- **Monto**: Cantidad solicitada (RD$)
- **Método**: Transferencia bancaria o USDT
- **Referencia**: Código de referencia generado
- **Comprobante**: Botón para ver imagen adjunta
- **Estado**: Badge con color (verde/amarillo/rojo)
- **Fecha**: Cuándo se creó la solicitud
- **Acciones**: Botones Aprobar/Rechazar (solo para pendientes)

### 🖼️ Modal de Imagen
- Click en "📸 Ver Imagen" abre el comprobante en pantalla completa
- Click fuera de la imagen para cerrar
- Botón "✕ Cerrar" en la esquina

### ⚡ Acciones
- **Aprobar**: 
  - Actualiza automáticamente el balance del usuario
  - Crea registro en tabla `transactions`
  - Cambia estado a `approved`
  - Muestra mensaje con el nuevo balance
  
- **Rechazar**:
  - Pide motivo del rechazo (opcional)
  - Cambia estado a `rejected`
  - No afecta el balance

---

## 🔒 Seguridad y Políticas RLS

Las funciones creadas usan `SECURITY DEFINER` para ejecutarse con privilegios elevados.
Asegúrate de configurar políticas RLS en tu dashboard:

```sql
-- Solo administradores pueden llamar estas funciones
CREATE POLICY "Admin can manage deposits"
ON pending_deposits
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## 📱 Flujo Completo

1. **Usuario en App Móvil:**
   - Selecciona monto de recarga
   - Elige método de pago (Bancario/USDT)
   - Ve instrucciones de pago
   - Sube captura del comprobante
   - Confirma el pago
   - Queda en estado "En Proceso"

2. **Admin en Dashboard:**
   - Ve la solicitud en "Pendientes"
   - Click en "Ver Imagen" para verificar comprobante
   - Si es válido: Click "Aprobar" → Balance se actualiza automáticamente
   - Si es inválido: Click "Rechazar" → Usuario queda informado

3. **Usuario ve en App:**
   - En "Perfil" > "Ver Historial de Recargas"
   - Estado actualizado (Aprobada ✅ / Rechazada ❌)
   - Balance actualizado en tiempo real

---

## 🐛 Solución de Problemas

### Error: "Failed to fetch"
- Verifica que las funciones SQL estén creadas en Supabase
- Revisa que la clave de Supabase sea correcta

### Error: "RLS policy violation"
- Asegúrate de estar autenticado como admin en el dashboard
- Verifica las políticas RLS en Supabase

### Imágenes no se ven
- Verifica que el bucket `payment-receipts` sea público
- Revisa que las políticas de Storage estén configuradas

### Balance no se actualiza
- Verifica que la función `approve_deposit` se ejecutó correctamente
- Revisa los logs en Supabase SQL Editor

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard
2. Verifica que todas las funciones SQL se ejecutaron sin errores
3. Comprueba que el bucket de Storage esté configurado correctamente
4. Asegúrate de que las credenciales de Supabase sean correctas

---

¡Listo! Ahora tienes un sistema completo de gestión de transacciones. 🎉
