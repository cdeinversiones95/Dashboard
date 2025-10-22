-- ============================================================================
-- CREAR TABLA USER_PROFILES
-- ============================================================================

-- Esta tabla almacena información adicional de los usuarios
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  display_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Índice para búsquedas por teléfono
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================================================

-- Función que crea un perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, phone, name, display_name)
  VALUES (
    NEW.id,
    REPLACE(REPLACE(NEW.email, '@phone.local', ''), '@user.temp', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario')
  );
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MIGRAR USUARIOS EXISTENTES
-- ============================================================================

-- Crear perfiles para usuarios que ya existen
INSERT INTO public.user_profiles (user_id, phone, name, display_name)
SELECT 
  u.id,
  REPLACE(REPLACE(u.email, '@phone.local', ''), '@user.temp', '') as phone,
  COALESCE(u.raw_user_meta_data->>'name', 'Usuario') as name,
  COALESCE(u.raw_user_meta_data->>'display_name', 'Usuario') as display_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up 
  WHERE up.user_id = u.id
);

-- ============================================================================
-- ✅ VERIFICACIÓN
-- ============================================================================

-- Ver todos los perfiles creados
SELECT 
  up.id,
  up.user_id,
  up.name,
  up.display_name,
  up.phone,
  up.role,
  up.created_at
FROM public.user_profiles up
ORDER BY up.created_at DESC;

-- Contar perfiles
SELECT COUNT(*) as total_perfiles FROM public.user_profiles;
