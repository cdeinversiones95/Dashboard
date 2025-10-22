# 📸 Sistema de Comprobantes de Pago - Configuración

## ✅ Cambios Implementados

### 📱 App Móvil
- ✅ Botón "Subir Comprobante" reemplaza "Compartir Información"
- ✅ Selector de imagen desde galería
- ✅ Preview de la imagen seleccionada
- ✅ Subida automática a Supabase Storage
- ✅ Funciona en ambas pantallas: Bancario y USDT

### 🔧 Configuración Requerida en Supabase

#### Paso 1: Ejecutar Script SQL

1. Ve a **SQL Editor** en Supabase
2. Ejecuta el script `12_CONFIGURAR_STORAGE_COMPROBANTES.sql`
3. Esto agregará la columna `proof_image_url` a la tabla `pending_deposits`

#### Paso 2: Crear Bucket de Storage

1. Ve a **Storage** en el panel de Supabase
2. Click en **"Create a new bucket"**
3. Configuración:
   - **Name**: `payment-receipts`
   - **Public bucket**: ✅ YES (marcado)
   - **File size limit**: 5MB
   - **Allowed MIME types**: image/jpeg, image/png
4. Click en **"Create bucket"**

#### Paso 3: Configurar Políticas del Bucket

1. Selecciona el bucket `payment-receipts`
2. Ve a la pestaña **"Policies"**
3. Click en **"New Policy"**

**Política 1: Subir archivos**
```sql
CREATE POLICY "Users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');
```

**Política 2: Ver archivos**
```sql
CREATE POLICY "Anyone can view payment receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-receipts');
```

## 📱 Flujo de Usuario

1. Usuario selecciona método de pago y monto
2. Ve instrucciones de pago con timer de 60 minutos
3. **Click en "📷 Subir Comprobante"**
4. Selecciona imagen desde galería
5. Ve preview de la imagen
6. Click en "Confirmar Pago"
7. La imagen se sube a Supabase Storage
8. URL se guarda en `pending_deposits.proof_image_url`

## 🎨 Características

- ✅ Botón cambia de morado a verde al subir imagen
- ✅ Preview de 200px de alto
- ✅ Opción de cambiar imagen
- ✅ No permite confirmar sin comprobante
- ✅ Indicador de carga mientras sube
- ✅ Mensajes de error si falla

## 📊 Ver Comprobantes en el Dashboard

En el dashboard, ahora puedes acceder a:
```javascript
pending_deposits.proof_image_url
```

Esta URL apunta directamente a la imagen del comprobante en Supabase Storage.

## 🔍 Verificar que Funciona

```sql
-- Ver solicitudes con comprobantes
SELECT 
  id,
  amount,
  status,
  payment_reference,
  proof_image_url,
  created_at
FROM pending_deposits
WHERE proof_image_url IS NOT NULL
ORDER BY created_at DESC;
```

## ⚠️ Importante

- Las imágenes se guardan como: `comprobantes/{depositId}_{timestamp}.jpg`
- El bucket debe ser PÚBLICO para que el dashboard pueda mostrar las imágenes
- El tamaño máximo recomendado es 5MB
- Formatos soportados: JPG, PNG
