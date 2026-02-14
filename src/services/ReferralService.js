import { supabase, TABLES } from "../config/supabase";

// Definición de niveles basados en cantidad de referidos directos
const AGENT_LEVELS = [
  {
    level: 1,
    minReferrals: 10,
    commissionRate: 0.02,
    name: "Nivel 1",
    color: "#06b6d4",
  },
  {
    level: 2,
    minReferrals: 20,
    commissionRate: 0.03,
    name: "Nivel 2",
    color: "#ec4899",
  },
  {
    level: 3,
    minReferrals: 30,
    commissionRate: 0.05,
    name: "Nivel 3",
    color: "#fbbf24",
  },
];

class ReferralService {
  /**
   * Determinar el nivel del agente basado en la cantidad de referidos directos
   * Nivel 1 = 10 referidos → 2% comisión
   * Nivel 2 = 20 referidos → 3% comisión
   * Nivel 3 = 30 referidos → 5% comisión
   * Sin nivel (< 10) → 0% comisión
   */
  getReferralLevel(directReferralCount) {
    const count = directReferralCount || 0;

    // Buscar el nivel más alto alcanzado
    for (let i = AGENT_LEVELS.length - 1; i >= 0; i--) {
      if (count >= AGENT_LEVELS[i].minReferrals) {
        const current = AGENT_LEVELS[i];
        const next = AGENT_LEVELS[i + 1] || null;
        return {
          level: current.level,
          name: current.name,
          commissionRate: current.commissionRate,
          commissionPercent: `${current.commissionRate * 100}%`,
          color: current.color,
          nextLevel: next
            ? {
                level: next.level,
                name: next.name,
                minReferrals: next.minReferrals,
                commissionRate: next.commissionRate,
                remaining: next.minReferrals - count,
              }
            : null,
          progress: next
            ? (count - current.minReferrals) /
              (next.minReferrals - current.minReferrals)
            : 1,
        };
      }
    }

    // Sin nivel aún
    const first = AGENT_LEVELS[0];
    return {
      level: 0,
      name: "Sin Nivel",
      commissionRate: 0,
      commissionPercent: "0%",
      color: "#9ca3af",
      nextLevel: {
        level: first.level,
        name: first.name,
        minReferrals: first.minReferrals,
        commissionRate: first.commissionRate,
        remaining: first.minReferrals - count,
      },
      progress: count / first.minReferrals,
    };
  }

  /**
   * Obtener el ID público del usuario desde su auth_id
   */
  async getPublicUserId(authId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select("id")
        .eq("auth_id", authId)
        .single();

      if (error) {
        console.error("Error obteniendo ID público:", error);
        return null;
      }
      return data?.id || null;
    } catch (err) {
      console.error("Error en getPublicUserId:", err);
      return null;
    }
  }

  /**
   * Obtener el equipo de referidos en 3 niveles
   * Usa la función RPC get_referral_team (SECURITY DEFINER) para saltar RLS
   * Nivel 1: Referidos directos (usuarios que usaron mi código)
   * Nivel 2: Referidos de mis referidos directos
   * Nivel 3: Referidos de nivel 2
   */
  async getReferralTeam(authId) {
    try {
      // Intentar con la función RPC que salta RLS
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "get_referral_team",
        { p_auth_id: authId },
      );

      if (!rpcError && rpcResult) {
        const result =
          typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;
        return {
          level1: result.level1_count || 0,
          level2: result.level2_count || 0,
          level3: result.level3_count || 0,
          total: result.total || 0,
          level1Users: result.level1 || [],
          level2Users: result.level2 || [],
          level3Users: result.level3 || [],
        };
      }

      // Fallback: consulta directa (funciona solo si RLS lo permite)
      return await this._getReferralTeamDirect(authId);
    } catch (error) {
      console.error("Error obteniendo equipo de referidos:", error);
      return this._emptyTeam();
    }
  }

  /**
   * Fallback: obtener equipo con consultas directas (requiere RLS permisivo)
   */
  async _getReferralTeamDirect(authId) {
    try {
      const publicId = await this.getPublicUserId(authId);
      if (!publicId) {
        return this._emptyTeam();
      }

      // Nivel 1: Referidos directos
      const { data: level1Users, error: l1Error } = await supabase
        .from(TABLES.USERS)
        .select("id, username, full_name, created_at, is_active")
        .eq("referred_by", publicId)
        .order("created_at", { ascending: false });

      if (l1Error) {
        console.error("Error obteniendo referidos nivel 1:", l1Error);
        return this._emptyTeam();
      }

      const level1 = level1Users || [];

      // Nivel 2: Referidos de mis referidos directos
      let level2 = [];
      if (level1.length > 0) {
        const level1Ids = level1.map((u) => u.id);
        const { data: level2Users, error: l2Error } = await supabase
          .from(TABLES.USERS)
          .select("id, username, full_name, created_at, is_active")
          .in("referred_by", level1Ids)
          .order("created_at", { ascending: false });

        if (!l2Error) {
          level2 = level2Users || [];
        }
      }

      // Nivel 3: Referidos de nivel 2
      let level3 = [];
      if (level2.length > 0) {
        const level2Ids = level2.map((u) => u.id);
        const { data: level3Users, error: l3Error } = await supabase
          .from(TABLES.USERS)
          .select("id, username, full_name, created_at, is_active")
          .in("referred_by", level2Ids)
          .order("created_at", { ascending: false });

        if (!l3Error) {
          level3 = level3Users || [];
        }
      }

      return {
        level1: level1.length,
        level2: level2.length,
        level3: level3.length,
        total: level1.length + level2.length + level3.length,
        level1Users: level1,
        level2Users: level2,
        level3Users: level3,
      };
    } catch (error) {
      console.error("Error en fallback getReferralTeam:", error);
      return this._emptyTeam();
    }
  }

  /**
   * Obtener actividad reciente de referidos para la sección "Mis Referidos"
   * Usa la función RPC para saltar RLS
   */
  async getReferralActivity(authId, limit = 10) {
    try {
      // Intentar obtener del RPC (que ya nos da los usuarios)
      const team = await this.getReferralTeam(authId);
      const directReferrals = team.level1Users || [];

      if (directReferrals.length === 0) return [];

      return directReferrals.slice(0, limit).map((user) => ({
        username: user.username || user.full_name || "Usuario",
        date: new Date(user.created_at).toLocaleDateString("es-DO", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
        isActive: user.is_active !== false,
        rawDate: user.created_at,
      }));
    } catch (error) {
      console.error("Error en getReferralActivity:", error);
      return [];
    }
  }

  /**
   * Verificar si un código de invitación es válido
   * Retorna el ID del referente o null si es inválido
   */
  async validateInvitationCode(code) {
    if (!code || code.trim() === "") return { valid: false, referrerId: null };

    try {
      // Intentar RPC primero
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_referrer_id",
        { code: code.trim() },
      );

      if (!rpcError && rpcData) {
        return { valid: true, referrerId: rpcData };
      }

      // Fallback: consulta directa
      const { data: referrer, error: referrerError } = await supabase
        .from(TABLES.USERS)
        .select("id")
        .eq("invitation_code", code.trim())
        .single();

      if (referrer && !referrerError) {
        return { valid: true, referrerId: referrer.id };
      }

      return { valid: false, referrerId: null };
    } catch (error) {
      console.error("Error validando código de invitación:", error);
      return { valid: false, referrerId: null };
    }
  }

  /**
   * Generar un código de invitación único verificando que no exista
   */
  async generateUniqueCode() {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Verificar que no exista
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select("id")
        .eq("invitation_code", code)
        .single();

      // PGRST116 = no rows found = código es único
      if (error?.code === "PGRST116" || !data) {
        return code;
      }

      attempts++;
    }

    // Fallback: código más largo para mayor unicidad
    const fallback = (
      Math.random().toString(36).substring(2, 6) +
      Date.now().toString(36).slice(-4)
    )
      .toUpperCase()
      .substring(0, 8);
    return fallback;
  }

  /**
   * Obtener comisiones ganadas por referidos
   * Busca transacciones de tipo 'referral_commission' del usuario
   */
  async getCommissions(authId, limit = 20) {
    try {
      const publicId = await this.getPublicUserId(authId);
      if (!publicId) return { commissions: [], totalEarned: 0 };

      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, description, created_at, status")
        .eq("user_id", publicId)
        .eq("transaction_type", "referral_commission")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error obteniendo comisiones:", error);
        return { commissions: [], totalEarned: 0 };
      }

      const commissions = (data || []).map((tx) => ({
        id: tx.id,
        amount: parseFloat(tx.amount) || 0,
        description: tx.description || "",
        date: new Date(tx.created_at).toLocaleDateString("es-DO", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
        status: tx.status,
        rawDate: tx.created_at,
      }));

      const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);

      return { commissions, totalEarned };
    } catch (error) {
      console.error("Error en getCommissions:", error);
      return { commissions: [], totalEarned: 0 };
    }
  }

  _emptyTeam() {
    return {
      level1: 0,
      level2: 0,
      level3: 0,
      total: 0,
      level1Users: [],
      level2Users: [],
      level3Users: [],
    };
  }
}

export default new ReferralService();
