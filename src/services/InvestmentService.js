import { supabase, TABLES } from "../config/supabase";

class InvestmentService {
  // Crear nueva inversión
  async createInvestment(investmentData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .insert([
          {
            user_id: investmentData.user_id,
            amount: investmentData.amount,
            type: investmentData.type || "trade",
            status: investmentData.status || "active",
            description: investmentData.description || "",
            expected_return: investmentData.expected_return || 0,
            risk_level: investmentData.risk_level || "medium",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        if (error.code === "PGRST205") {
          console.error(
            "⚠️ Tabla investments no encontrada. Ejecute el script fix-database-errors.sql primero.",
          );
          return {
            data: null,
            error:
              "Sistema de inversiones no disponible. Contacte al administrador.",
          };
        }
        throw error;
      }
      return { data: data[0], error: null };
    } catch (error) {
      console.error("Error creando inversión:", error);
      return { data: null, error: error.message };
    }
  }

  // Obtener inversiones del usuario
  async getUserInvestments(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === "PGRST205") {
          return { data: [], error: null };
        }
        throw error;
      }
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error obteniendo inversiones:", error);
      return { data: [], error: error.message };
    }
  }

  // Actualizar inversión
  async updateInvestment(investmentId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.INVESTMENTS)
        .update(updates)
        .eq("id", investmentId)
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      console.error("Error actualizando inversión:", error);
      return { data: null, error: error.message };
    }
  }

  // Suscribirse a cambios en tiempo real
  subscribeToInvestments(userId, callback) {
    return supabase
      .channel("investments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLES.INVESTMENTS,
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  }
}

export default new InvestmentService();
