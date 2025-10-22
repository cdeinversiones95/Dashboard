-- ============================================================================
-- CREAR USUARIO DE PRUEBA DIRECTAMENTE
-- ============================================================================
-- Ejecuta este script en Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
BEGIN
    -- 1. Insertar en auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        '1234567890@phone.local',
        crypt('password123', gen_salt('bf')),
        NOW(),
        jsonb_build_object('phone', '1234567890', 'display_name', 'Usuario Prueba'),
        NOW(),
        NOW(),
        ''
    );

    -- 2. Insertar en public.users (el trigger debería hacerlo, pero lo hacemos manual por seguridad)
    INSERT INTO public.users (
        id,
        phone,
        email,
        display_name,
        phone_verified,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        '1234567890',
        '1234567890@phone.local',
        'Usuario Prueba',
        true,
        'active',
        NOW(),
        NOW()
    );

    -- 3. Crear wallet
    INSERT INTO public.wallets (
        user_id,
        balance,
        currency,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        1000.00,  -- Balance inicial de prueba
        'USD',
        'active',
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Usuario creado exitosamente con ID: %', v_user_id;
    RAISE NOTICE 'Telefono: 1234567890';
    RAISE NOTICE 'Password: password123';
    RAISE NOTICE 'Balance inicial: $1000.00';
END $$;

-- Verificar que se creó
SELECT 
    u.phone,
    u.display_name,
    u.status,
    w.balance
FROM public.users u
LEFT JOIN public.wallets w ON w.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 5;

-- ============================================================================
-- ✅ Usuario de prueba creado
-- Credenciales para login:
-- Teléfono: 1234567890
-- Password: password123
-- ============================================================================
