-- ============================================================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS DIARIAS
-- ============================================================================

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

-- ============================================================================
-- EJECUTAR ESTA FUNCIÓN EN SUPABASE SQL EDITOR
-- ============================================================================
