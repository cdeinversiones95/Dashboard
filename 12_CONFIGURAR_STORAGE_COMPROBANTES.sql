-- ============================================================================
-- CONFIGURAR ALMACENAMIENTO PARA COMPROBANTES DE PAGO
-- ============================================================================

-- 1. Crear bucket de almacenamiento para comprobantes de pago
-- (Esto debe hacerse en la interfaz de Supabase Storage, pero aquí está la configuración)

-- INSTRUCCIONES PARA CREAR EL BUCKET EN SUPABASE:
-- 1. Ve a Storage en el panel de Supabase
-- 2. Click en "Create a new bucket"
-- 3. Nombre: payment-receipts
-- 4. Public bucket: YES (para que se puedan ver las imágenes en el dashboard)
-- 5. Click en "Create bucket"

-- 2. Agregar columna para almacenar la URL del comprobante
ALTER TABLE public.pending_deposits 
ADD COLUMN IF NOT EXISTS proof_image_url TEXT;

-- 3. Crear política de almacenamiento (ejecutar después de crear el bucket)
-- Estas políticas permiten a usuarios autenticados subir sus comprobantes

-- Permitir subir archivos
CREATE POLICY "Users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');

-- Permitir leer archivos (público para que el dashboard pueda verlos)
CREATE POLICY "Anyone can view payment receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-receipts');

-- ============================================================================
-- ✅ VERIFICACIÓN
-- ============================================================================

-- Ver si la columna fue agregada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pending_deposits' 
AND column_name = 'proof_image_url';

-- Ver políticas de storage (ejecutar después de crear el bucket)
SELECT * FROM storage.buckets WHERE name = 'payment-receipts';
