-- ============================================================================
-- SCRIPT PARA AÑADIR DINERO A UNA BILLETERA (PARA PRUEBAS)
-- ============================================================================

-- PASO 1: Encuentra tu user_id
-- Ve a Table Editor > users y copia tu ID (es un UUID largo)

-- PASO 2: Reemplaza 'TU_USER_ID_AQUI' con tu ID real y ejecuta:

DO $$
DECLARE
    v_user_id UUID := 'TU_USER_ID_AQUI'; -- ⚠️ REEMPLAZAR CON TU ID
    v_amount DECIMAL := 1000.00; -- 💵 Cantidad a agregar
    v_wallet_id UUID;
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
BEGIN
    -- Obtener wallet_id y balance actual
    SELECT id, balance INTO v_wallet_id, v_current_balance
    FROM public.wallets
    WHERE user_id = v_user_id;
    
    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró billetera para este usuario';
    END IF;
    
    -- Calcular nuevo balance
    v_new_balance := v_current_balance + v_amount;
    
    -- Actualizar balance
    UPDATE public.wallets
    SET 
        balance = v_new_balance,
        total_deposited = total_deposited + v_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Crear transacción
    INSERT INTO public.transactions (
        user_id,
        wallet_id,
        transaction_type,
        amount,
        balance_after,
        currency,
        status,
        description,
        created_at
    ) VALUES (
        v_user_id,
        v_wallet_id,
        'deposit',
        v_amount,
        v_new_balance,
        'USD',
        'completed',
        'Depósito manual de prueba',
        NOW()
    );
    
    -- Mostrar resultado
    RAISE NOTICE 'Balance actualizado: $ % → $ %', v_current_balance, v_new_balance;
END $$;

-- ============================================================================
-- CONSULTAR TU BALANCE ACTUAL
-- ============================================================================

-- Reemplaza 'TU_USER_ID_AQUI' y ejecuta para ver tu balance:
SELECT 
    u.phone,
    u.display_name,
    w.balance,
    w.total_deposited,
    w.currency
FROM public.users u
JOIN public.wallets w ON w.user_id = u.id
WHERE u.id = 'TU_USER_ID_AQUI';

-- ============================================================================
-- VER TUS ÚLTIMAS TRANSACCIONES
-- ============================================================================

SELECT 
    transaction_type,
    amount,
    balance_after,
    description,
    created_at
FROM public.transactions
WHERE user_id = 'TU_USER_ID_AQUI'
ORDER BY created_at DESC
LIMIT 10;
