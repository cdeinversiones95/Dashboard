import { supabase, TABLES } from "../config/supabase";

class StatsService {
  // Obtener estadísticas globales de la plataforma
  async getGlobalStats() {
    try {
      // Obtener datos de usuarios
      const { data: usersData, error: usersError } = await supabase
        .from(TABLES.USERS)
        .select("id, created_at, is_active");

      if (usersError) {
        console.error(
          "Error obteniendo usuarios para estadísticas:",
          usersError,
        );
        // Continue with empty data instead of throwing
      }

      // Obtener datos de inversiones (manejar si la tabla no existe)
      let investmentsData = [];
      try {
        const { data: invData, error: investmentsError } = await supabase
          .from(TABLES.INVESTMENTS)
          .select("amount, status, created_at, user_id");

        if (investmentsError) {
          console.error(
            "Error obteniendo inversiones para estadísticas:",
            investmentsError,
          );
          // Si es error de tabla no encontrada, usar datos vacíos
          if (investmentsError.code === "PGRST205") {
            investmentsData = [];
          } else {
            throw investmentsError;
          }
        } else {
          investmentsData = invData || [];
        }
      } catch (invError) {
        console.error("Error en consulta de inversiones:", invError);
        investmentsData = [];
      }

      // Calcular estadísticas
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const stats = {
        // Estadísticas de usuarios
        total_users: usersData?.length || 0,
        new_users_this_month:
          usersData?.filter((user) => new Date(user.created_at) > oneMonthAgo)
            .length || 0,
        active_users:
          usersData?.filter((user) => user.is_active === true).length || 0,

        // Estadísticas de inversiones
        total_investments: investmentsData?.length || 0,
        total_investment_amount:
          investmentsData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) ||
          0,
        active_investments:
          investmentsData?.filter((inv) => inv.status === "active").length || 0,
        completed_investments:
          investmentsData?.filter((inv) => inv.status === "completed").length ||
          0,

        // Estadísticas adicionales
        first_time_investors: 0, // Se puede calcular con lógica adicional
        users_with_withdrawals: 0, // Se puede calcular con tabla de transacciones
        number_of_traders:
          investmentsData?.length > 0
            ? [...new Set(investmentsData.map((inv) => inv.user_id))].length
            : 0,

        // Cantidades de recarga y retiro (requieren tabla de transacciones)
        total_deposits: 0,
        total_withdrawals: 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error obteniendo estadísticas globales:", error);

      // Return default stats if there's an error
      const defaultStats = {
        total_users: 0,
        new_users_this_month: 0,
        active_users: 0,
        total_investments: 0,
        total_investment_amount: 0,
        active_investments: 0,
        completed_investments: 0,
        first_time_investors: 0,
        users_with_withdrawals: 0,
        number_of_traders: 0,
        total_deposits: 0,
        total_withdrawals: 0,
      };

      return {
        data: defaultStats,
        error: `Error obteniendo estadísticas: ${error.message}`,
      };
    }
  }

  // Obtener estadísticas específicas del usuario
  async getUserStats(userId) {
    try {
      let betsData = [];
      let referralsCount = 0;
      let referralsTotalWithdrawals = 0;

      // Obtener ID público del usuario para buscar referidos
      try {
        const { data: userData } = await supabase
          .from(TABLES.USERS)
          .select("id")
          .eq("auth_id", userId)
          .single();

        if (userData?.id) {
          // Usar la función RPC segura para obtener estadísticas
          // Esto evita problemas de permisos (RLS) donde no puedes ver datos de otros usuarios
          const { data: rpcStats, error: rpcError } = await supabase.rpc(
            "get_referral_stats",
            { referrer_uuid: userData.id },
          );

          if (!rpcError && rpcStats && rpcStats.length > 0) {
            referralsCount = rpcStats[0].referral_count || 0;
            referralsTotalWithdrawals = rpcStats[0].total_withdrawals || 0;
          } else {
            // Fallback (solo funcionará si las políticas RLS son permisivas)
            const { count } = await supabase
              .from(TABLES.USERS)
              .select("*", { count: "exact", head: true })
              .eq("referred_by", userData.id);

            referralsCount = count || 0;
          }
        }
      } catch (refError) {
        console.error("Error obteniendo datos de referidos:", refError);
      }

      // Obtener apuestas del usuario
      try {
        const { data: bets, error } = await supabase
          .from(TABLES.USER_BETS)
          .select("*")
          .eq("user_id", userId);

        if (error) {
          if (error.code === "PGRST205") {
            betsData = [];
          } else {
            throw error;
          }
        } else {
          betsData = bets || [];
        }
      } catch (betError) {
        console.error("Error obteniendo apuestas del usuario:", betError);
        betsData = [];
      }

      const stats = {
        total_investments: betsData?.length || 0,
        total_invested:
          betsData?.reduce(
            (sum, bet) => sum + (parseFloat(bet.amount) || 0),
            0,
          ) || 0,
        active_investments:
          betsData?.filter((bet) => bet.status === "pending").length || 0,
        completed_investments:
          betsData?.filter(
            (bet) => bet.status === "won" || bet.status === "lost",
          ).length || 0,
        pending_investments:
          betsData?.filter((bet) => bet.status === "pending").length || 0,
        total_returns:
          betsData
            ?.filter((bet) => bet.status === "won")
            .reduce(
              (sum, bet) => sum + (parseFloat(bet.potential_profit) || 0),
              0,
            ) || 0,
        average_investment:
          betsData?.length > 0
            ? betsData.reduce(
                (sum, bet) => sum + (parseFloat(bet.amount) || 0),
                0,
              ) / betsData.length
            : 0,
        referrals_count: referralsCount,
        referrals_total_withdrawals: referralsTotalWithdrawals,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error obteniendo estadísticas del usuario:", error);

      // Return default user stats if there's an error
      const defaultUserStats = {
        total_investments: 0,
        total_invested: 0,
        active_investments: 0,
        completed_investments: 0,
        pending_investments: 0,
        total_returns: 0,
        average_investment: 0,
        referrals_count: 0,
        referrals_total_withdrawals: 0,
      };

      return {
        data: defaultUserStats,
        error: `Error obteniendo estadísticas: ${error.message}`,
      };
    }
  }
}

export default new StatsService();
