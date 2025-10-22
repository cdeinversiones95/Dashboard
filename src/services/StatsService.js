import { supabase, TABLES } from '../config/supabase';

class StatsService {

  // Obtener estadísticas globales de la plataforma
  async getGlobalStats() {
    try {
      // Obtener datos de usuarios
      const { data: usersData, error: usersError } = await supabase
        .from(TABLES.USERS)
        .select('id, created_at, status');

      if (usersError) throw usersError;

      // Obtener datos de inversiones
      const { data: investmentsData, error: investmentsError } = await supabase
        .from(TABLES.INVESTMENTS)
        .select('amount, status, created_at');

      if (investmentsError) throw investmentsError;

      // Calcular estadísticas
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const stats = {
        // Estadísticas de usuarios
        total_users: usersData?.length || 0,
        new_users_this_month: usersData?.filter(user => 
          new Date(user.created_at) > oneMonthAgo
        ).length || 0,
        active_users: usersData?.filter(user => 
          user.status === 'active'
        ).length || 0,

        // Estadísticas de inversiones
        total_investments: investmentsData?.length || 0,
        total_investment_amount: investmentsData?.reduce((sum, inv) => 
          sum + (inv.amount || 0), 0
        ) || 0,
        active_investments: investmentsData?.filter(inv => 
          inv.status === 'active'
        ).length || 0,
        completed_investments: investmentsData?.filter(inv => 
          inv.status === 'completed'
        ).length || 0,

        // Estadísticas adicionales
        first_time_investors: 0, // Se puede calcular con lógica adicional
        users_with_withdrawals: 0, // Se puede calcular con tabla de transacciones
        number_of_traders: investmentsData?.length > 0 ? 
          [...new Set(investmentsData.map(inv => inv.user_id))].length : 0,

        // Cantidades de recarga y retiro (requieren tabla de transacciones)
        total_deposits: 0,
        total_withdrawals: 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error obteniendo estadísticas globales:', error);
      return { data: null, error: error.message };
    }
  }

  // Obtener estadísticas específicas del usuario
  async getUserStats(userId) {
    try {
      const { data: investmentsData, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total_investments: investmentsData?.length || 0,
        total_invested: investmentsData?.reduce((sum, inv) => 
          sum + (inv.amount || 0), 0
        ) || 0,
        active_investments: investmentsData?.filter(inv => 
          inv.status === 'active'
        ).length || 0,
        completed_investments: investmentsData?.filter(inv => 
          inv.status === 'completed'
        ).length || 0,
        pending_investments: investmentsData?.filter(inv => 
          inv.status === 'pending'
        ).length || 0,
        total_returns: investmentsData?.reduce((sum, inv) => 
          sum + (inv.expected_return || 0), 0
        ) || 0,
        average_investment: investmentsData?.length > 0 ? 
          (investmentsData.reduce((sum, inv) => sum + (inv.amount || 0), 0) / investmentsData.length) : 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error obteniendo estadísticas del usuario:', error);
      return { data: null, error: error.message };
    }
  }

  // Obtener datos para gráficos
  async getChartData(userId = null, period = '30d') {
    try {
      let query = supabase
        .from(TABLES.INVESTMENTS)
        .select('amount, created_at, status');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Filtrar por período
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const { data, error } = await query.gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Procesar datos para gráficos
      const chartData = this.processChartData(data, period);

      return { data: chartData, error: null };
    } catch (error) {
      console.error('Error obteniendo datos de gráfico:', error);
      return { data: null, error: error.message };
    }
  }

  // Procesar datos para gráficos
  processChartData(data, period) {
    if (!data || data.length === 0) return [];

    // Agrupar por fecha
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          amount: 0,
          count: 0,
        };
      }
      acc[date].amount += item.amount || 0;
      acc[date].count += 1;
      return acc;
    }, {});

    // Convertir a array y ordenar
    return Object.values(grouped).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  // Suscribirse a cambios en estadísticas en tiempo real
  subscribeToStatsChanges(callback) {
    return supabase
      .channel('stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.INVESTMENTS
        },
        callback
      )
      .subscribe();
  }
}

export default new StatsService();