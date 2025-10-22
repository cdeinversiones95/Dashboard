-- ============================================================================
-- SETUP RÁPIDO Y LIMPIO - PROYECTO NUEVO SUPABASE
-- ============================================================================
-- Ejecuta este script completo de una sola vez en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CREAR TODAS LAS TABLAS
-- ============================================================================

-- Tabla de Usuarios
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(100),
  full_name VARCHAR(200),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de Billeteras
CREATE TABLE public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  total_deposited DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_withdrawn DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_invested DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_earned DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- Tabla de Transacciones
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (
    transaction_type IN ('deposit', 'withdrawal', 'investment', 'profit', 'bonus', 'refund', 'fee', 'transfer')
  ),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (
    status IN ('pending', 'completed', 'cancelled', 'failed')
  ),
  description TEXT,
  reference_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de Métodos de Pago
CREATE TABLE public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type VARCHAR(30) NOT NULL CHECK (
    method_type IN ('credit_card', 'bank_transfer', 'crypto', 'paypal', 'mobile_payment', 'cash')
  ),
  provider VARCHAR(50),
  account_info JSONB NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de Depósitos Pendientes
CREATE TABLE public.pending_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_reference VARCHAR(200),
  admin_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de Retiros
CREATE TABLE public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  net_amount DECIMAL(15,2) NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (
    status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')
  ),
  admin_notes TEXT,
  user_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de Inversiones
CREATE TABLE public.investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'standard',
  event_id UUID,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  returns DECIMAL(15,2) DEFAULT 0.00,
  roi_percentage DECIMAL(5,2) DEFAULT 0.00,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Eventos
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'football',
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  home_odds DECIMAL(5,2),
  away_odds DECIMAL(5,2),
  draw_odds DECIMAL(5,2),
  result VARCHAR(50),
  participants_count INTEGER DEFAULT 0,
  total_investment DECIMAL(15,2) DEFAULT 0.00,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Estadísticas
CREATE TABLE public.app_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_investments DECIMAL(15,2) DEFAULT 0.00,
  total_returns DECIMAL(15,2) DEFAULT 0.00,
  total_balance DECIMAL(15,2) DEFAULT 0.00,
  new_users_today INTEGER DEFAULT 0,
  transactions_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_status ON public.wallets(status);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);

CREATE INDEX idx_pending_deposits_user_id ON public.pending_deposits(user_id);
CREATE INDEX idx_pending_deposits_status ON public.pending_deposits(status);

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_wallet_id ON public.withdrawals(wallet_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);

CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_wallet_id ON public.investments(wallet_id);
CREATE INDEX idx_investments_event_id ON public.investments(event_id);

CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_status ON public.events(status);

-- ============================================================================
-- FUNCIÓN PARA ACTUALIZAR TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS AUTOMÁTICAMENTE
-- ============================================================================

CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON public.users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at 
BEFORE UPDATE ON public.wallets 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
BEFORE UPDATE ON public.transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
BEFORE UPDATE ON public.payment_methods 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_deposits_updated_at 
BEFORE UPDATE ON public.pending_deposits 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at 
BEFORE UPDATE ON public.withdrawals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at 
BEFORE UPDATE ON public.investments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCIÓN PARA AUTO-CREAR USUARIO Y BILLETERA AL REGISTRAR
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_and_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Primero crear el perfil en users
    INSERT INTO public.users (
        id, 
        phone, 
        email,
        display_name,
        phone_verified,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'phone', ''),
        true,
        NOW(),
        NOW()
    );
    
    -- Luego crear la billetera
    INSERT INTO public.wallets (user_id, balance, currency, status)
    VALUES (NEW.id, 0.00, 'USD', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear usuario y billetera automáticamente
CREATE TRIGGER create_user_and_wallet_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_and_wallet();

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD (RLS POLICIES)
-- ============================================================================

-- Políticas para users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Políticas para wallets
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (true);

-- Políticas para payment_methods
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para pending_deposits
CREATE POLICY "Users can view own deposits" ON public.pending_deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON public.pending_deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ✅ SCRIPT COMPLETADO
-- ============================================================================

-- Ver las tablas creadas
SELECT 
    'Tabla: ' || table_name as "Tablas Creadas"
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
