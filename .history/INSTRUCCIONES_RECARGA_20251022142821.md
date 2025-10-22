# 💰 Sistema de Recarga - Instrucciones de Configuración

## 📋 Paso 1: Ejecutar el Script SQL

1. Ve a tu panel de Supabase: https://supabase.com/dashboard
2. Selecciona el proyecto: **qoysbxeqxngdqfgbljdm**
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**
5. Copia y pega el contenido del archivo `10_SETUP_RECHARGE_SYSTEM.sql`
6. Haz clic en **Run** o presiona `Ctrl + Enter`

## ✅ Verificar que se creó correctamente

Ejecuta esta consulta para verificar:

```sql
-- Ver los métodos de pago creados
SELECT * FROM payment_methods;

-- Ver los montos de recarga
SELECT * FROM recharge_amounts;
```

Deberías ver:
- 3 bancos (Banreservas, Popular, BHD)
- 1 método USDT
- 6 montos predefinidos (1000, 2500, 5000, 10000, 25000, 50000)

## 🏦 Paso 2: Actualizar Información Bancaria

Ejecuta esta consulta para actualizar con las cuentas bancarias reales:

```sql
-- Actualizar Banco Banreservas
UPDATE payment_methods 
SET account_info = jsonb_set(account_info, '{account_number}', '"TU-NUMERO-DE-CUENTA-BANRESERVAS"')
WHERE account_info->>'bank_name' = 'Banco Banreservas';

-- Actualizar Banco Popular
UPDATE payment_methods 
SET account_info = jsonb_set(account_info, '{account_number}', '"TU-NUMERO-DE-CUENTA-POPULAR"')
WHERE account_info->>'bank_name' = 'Banco Popular Dominicano';

-- Actualizar Banco BHD
UPDATE payment_methods 
SET account_info = jsonb_set(account_info, '{account_number}', '"TU-NUMERO-DE-CUENTA-BHD"')
WHERE account_info->>'bank_name' = 'Banco BHD';

-- Actualizar wallet USDT
UPDATE payment_methods 
SET account_info = jsonb_set(account_info, '{wallet_address}', '"TU-DIRECCION-WALLET-USDT-TRC20"')
WHERE method_type = 'crypto';
```

## 🔒 Paso 3: Verificar Permisos RLS

Ejecuta esto para asegurarte de que las políticas RLS están correctas:

```sql
-- Verificar políticas de pending_deposits
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'pending_deposits';
```

Si no existen, ejecuta:

```sql
-- Permitir crear solicitudes de depósito
CREATE POLICY "Users can create own deposit requests"
ON pending_deposits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir ver propias solicitudes
CREATE POLICY "Users can view own deposit requests"
ON pending_deposits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## 📱 Paso 4: Usar la App

1. Abre la app móvil
2. Ve a **Perfil**
3. Haz clic en el botón **"Recargar"**
4. Selecciona:
   - Método: **Bancario** o **USDT**
   - Si es bancario, selecciona el banco
   - Selecciona un monto o ingresa uno personalizado (mínimo RD$ 1,000)
5. Haz clic en **"Solicitar Recarga"**

## 🎯 Próximos Pasos

### Para el Dashboard (Administrador)
Necesitarás crear una interfaz en el dashboard para:
- Ver todas las solicitudes de recarga pendientes
- Aprobar o rechazar solicitudes
- Ver el comprobante de pago (cuando implementes subida de imágenes)

### Funciones Adicionales a Implementar
1. **Subir comprobante de pago** - Los usuarios deben poder adjuntar una foto del comprobante
2. **Notificaciones** - Notificar al usuario cuando su recarga sea aprobada/rechazada
3. **Historial de recargas** - Mostrar todas las recargas del usuario

## 🔍 Verificar Solicitudes

Para ver las solicitudes de depósito en Supabase:

```sql
SELECT 
  pd.id,
  pd.amount,
  pd.status,
  pd.created_at,
  u.name as user_name,
  pm.display_name as payment_method
FROM pending_deposits pd
JOIN users u ON pd.user_id = u.id
JOIN payment_methods pm ON pd.payment_method_id = pm.id
ORDER BY pd.created_at DESC;
```

## 💡 Notas Importantes

- El monto mínimo de recarga es **RD$ 1,000**
- Las recargas deben ser aprobadas por un administrador
- Los usuarios recibirán el dinero en su wallet solo después de la aprobación
- El sistema registra todas las transacciones en la tabla `transactions`
