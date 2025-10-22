import { supabase, TABLES } from '../config/supabase';

class InvestmentService {

  // Crear nueva inversión
  async createInvestment(investmentData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .insert([{
          user_id: investmentData.user_id,
          amount: investmentData.amount,
          type: investmentData.type || 'trade',
          status: investmentData.status || 'active',
          description: investmentData.description || '',
          expected_return: investmentData.expected_return || 0,
          risk_level: investmentData.risk_level || 'medium',
          created_at: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      console.error('Error creando inversión:', error);
      return { data: null, error: error.message };
    }
  }

  // Obtener inversiones del usuario
  async getUserInvestments(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo inversiones:', error);
      return { data: [], error: error.message };
    }
  }

  // Actualizar inversión
  async updateInvestment(investmentId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .update(updates)
        .eq('id', investmentId)
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      console.error('Error actualizando inversión:', error);
      return { data: null, error: error.message };
    }
  }

  // Obtener estadísticas de inversiones
  async getInvestmentStats(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .select('amount, status, expected_return, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      // Calcular estadísticas
      const stats = {
        total_investments: data.length,
        total_amount: data.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        active_investments: data.filter(inv => inv.status === 'active').length,
        completed_investments: data.filter(inv => inv.status === 'completed').length,
        total_expected_return: data.reduce((sum, inv) => sum + (inv.expected_return || 0), 0),
        recent_investments: data.filter(inv => {
          const investmentDate = new Date(inv.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return investmentDate > thirtyDaysAgo;
        }).length
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { data: null, error: error.message };
    }
  }

  // Eliminar inversión
  async deleteInvestment(investmentId) {
    try {
      const { error } = await supabase
        .from(TABLES.INVESTMENTS)
        .delete()
        .eq('id', investmentId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error eliminando inversión:', error);
      return { error: error.message };
    }
  }

  // Obtener inversiones por estado
  async getInvestmentsByStatus(userId, status) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo inversiones por estado:', error);
      return { data: [], error: error.message };
    }
  }

  // Suscribirse a cambios en tiempo real
  subscribeToInvestments(userId, callback) {
    return supabase
      .channel('investments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.INVESTMENTS,
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

export default new InvestmentService();