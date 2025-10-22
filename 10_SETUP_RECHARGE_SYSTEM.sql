-- ============================================================================
-- CONFIGURACIÓN DE SISTEMA DE RECARGA
-- ============================================================================

-- 1. Insertar métodos de pago predeterminados del sistema
INSERT INTO public.payment_methods (id, user_id, method_type, provider, account_info, display_name, is_active, is_verified)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1), -- Usuario sistema (temporal)
  'bank_transfer',
  banco,
  jsonb_build_object(
    'bank_name', banco,
    'account_number', numero_cuenta,
    'account_holder', 'CDE Inversiones',
    'account_type', 'Ahorros'
  ),
  banco,
  true,
  true
FROM (VALUES 
  ('Banco Banreservas', '9876543210'),
  ('Banco Popular Dominicano', '1234567890'),
  ('Banco BHD', '5555666677')
) AS bancos(banco, numero_cuenta)
ON CONFLICT DO NOTHING;

-- 2. Insertar método USDT
INSERT INTO public.payment_methods (id, user_id, method_type, provider, account_info, display_name, is_active, is_verified)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'crypto',
  'USDT',
  jsonb_build_object(
    'network', 'TRC20',
    'wallet_address', 'TYourWalletAddressHere123456789',
    'currency', 'USDT'
  ),
  'USDT (TRC20)',
  true,
  true
ON CONFLICT DO NOTHING;

-- 3. Configurar montos predeterminados de recarga
CREATE TABLE IF NOT EXISTS public.recharge_amounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'DOP' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar montos predeterminados en pesos dominicanos
INSERT INTO public.recharge_amounts (amount, currency, display_order)
VALUES 
  (1000.00, 'DOP', 1),
  (2500.00, 'DOP', 2),
  (5000.00, 'DOP', 3),
  (10000.00, 'DOP', 4),
  (25000.00, 'DOP', 5),
  (50000.00, 'DOP', 6)
ON CONFLICT DO NOTHING;

-- 4. Habilitar RLS para recharge_amounts
ALTER TABLE public.recharge_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recharge amounts" 
ON public.recharge_amounts FOR SELECT 
USING (true);

-- ============================================================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- ============================================================================

-- Ver métodos de pago configurados
SELECT 
  display_name,
  method_type,
  account_info->>'bank_name' as banco,
  account_info->>'account_number' as cuenta,
  account_info->>'wallet_address' as wallet
FROM public.payment_methods
WHERE is_active = true;

-- Ver montos de recarga
SELECT amount, currency FROM public.recharge_amounts ORDER BY display_order;
