import { supabase } from "../config/supabase";

// Importar WalletService para manejar debitación de saldo
import WalletService from "./WalletService";

class EventsService {
  // Variable para almacenar la subscripción
  static eventsSubscription = null;

  // Función para suscribirse a cambios en eventos en tiempo real
  static subscribeToEvents(callback) {
    // Cancelar subscripción anterior si existe
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }

    // Nueva subscripción a cambios en events y betting_options
    this.eventsSubscription = supabase
      .channel("events-realtime-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "events",
        },
        (payload) => {
          callback("events", payload);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "betting_options",
        },
        (payload) => {
          callback("betting_options", payload);
        },
      )
      .subscribe((status) => {});

    return this.eventsSubscription;
  }

  // Función para cancelar subscripción
  static unsubscribeFromEvents() {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
      this.eventsSubscription = null;
    }
  }

  // Obtener eventos activos con sus opciones de apuesta (solo del día actual)
  async getActiveEvents() {
    try {
      // Obtener la fecha actual en la zona horaria local
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );

      const { data: events, error } = await supabase
        .from("events")
        .select(
          `
          *,
          betting_options (*)
        `,
        )
        .eq("status", "active")
        .gte("match_time", startOfDay.toISOString())
        .lt("match_time", endOfDay.toISOString())
        .order("match_time", { ascending: true });

      if (error) throw error;

      return { data: events, error: null };
    } catch (error) {
      console.error("Error obteniendo eventos:", error);
      return { data: null, error: error.message };
    }
  }

  // Obtener un evento específico con opciones de apuesta
  async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          betting_options (*)
        `,
        )
        .eq("id", eventId)
        .eq("status", "active")
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error obteniendo evento:", error);
      return { data: null, error: error.message };
    }
  }

  // Verificar si se puede agregar un evento en una fecha específica
  async canAddEventOnDate(date) {
    try {
      const { data, error } = await supabase.rpc("can_add_event_on_date", {
        event_date: date,
      });

      if (error) throw error;
      return { canAdd: data, error: null };
    } catch (error) {
      console.error("Error verificando fecha:", error);
      return { canAdd: false, error: error.message };
    }
  }

  // Obtener evento activo para una fecha específica
  async getActiveEventForDate(date) {
    try {
      const { data, error } = await supabase.rpc("get_active_event_for_date", {
        event_date: date,
      });

      if (error) throw error;
      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error("Error obteniendo evento de la fecha:", error);
      return { data: null, error: error.message };
    }
  }

  // Realizar apuesta de usuario (ATÓMICO — validación y débito server-side)
  async placeBet(userId, eventId, bettingOptionId, amount) {
    try {
      // Validación client-side básica (la real está en el server)
      if (!userId || !eventId || !bettingOptionId) {
        throw new Error("Datos de apuesta incompletos");
      }
      if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        throw new Error("El monto de apuesta debe ser un número positivo");
      }

      // Intentar usar la función RPC atómica (transacción server-side)
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "place_bet_atomic",
        {
          p_user_id: userId,
          p_event_id: eventId,
          p_betting_option_id: bettingOptionId,
          p_amount: amount,
        },
      );

      // Si el RPC existe y funcionó, usamos su resultado
      if (!rpcError && rpcResult) {
        // rpcResult puede ser el bet_id o un objeto JSON según la función
        const betId =
          typeof rpcResult === "object" ? rpcResult.bet_id : rpcResult;

        // Obtener datos completos de la apuesta creada
        const { data: betData, error: fetchError } = await supabase
          .from("user_bets")
          .select("*")
          .eq("id", betId)
          .single();

        if (fetchError) {
          // La apuesta se creó exitosamente en el server, solo falló el fetch
          return { data: { id: betId }, error: null };
        }

        return { data: betData, error: null };
      }

      // Si el RPC no existe (42883) o no está disponible, usar fallback con validación
      if (rpcError && rpcError.code !== "42883") {
        // Error real del RPC (ej: saldo insuficiente, evento inactivo)
        console.error("❌ Error del RPC place_bet_atomic:", rpcError.message);
        throw new Error(rpcError.message);
      }

      return await this._placeBetFallback(
        userId,
        eventId,
        bettingOptionId,
        amount,
      );
    } catch (error) {
      console.error("❌ Error realizando apuesta:", error);
      return { data: null, error: error.message };
    }
  }

  // Fallback: apuesta con doble validación (cuando el RPC no está disponible)
  async _placeBetFallback(userId, eventId, bettingOptionId, amount) {
    // 1. Obtener opción de apuesta
    const { data: bettingOption, error: optionError } = await supabase
      .from("betting_options")
      .select("*")
      .eq("id", bettingOptionId)
      .single();

    if (optionError) throw new Error("Opción de apuesta no encontrada");

    // 2. Verificar que el evento esté activo
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, status")
      .eq("id", eventId)
      .eq("status", "active")
      .single();

    if (eventError || !event) {
      throw new Error("Este evento ya no está disponible para apuestas");
    }

    // 3. Leer balance JUSTO antes de debitar (ventana de race condition mínima)
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance, total_invested")
      .eq("user_id", userId)
      .single();

    if (walletError)
      throw new Error("No se pudo obtener información de la billetera");
    if (wallet.balance < amount)
      throw new Error("Saldo insuficiente para realizar la apuesta");

    const estimatedProfit = (amount * bettingOption.profit_percentage) / 100;

    // 4. Debitar saldo con validación optimista (CHECK balance >= amount)
    //    Usamos .gte('balance', amount) para que Supabase solo actualice SI el balance
    //    sigue siendo suficiente al momento exacto del UPDATE (evita race conditions)
    const newBalance = wallet.balance - amount;
    const { data: updatedWallet, error: updateError } = await supabase
      .from("wallets")
      .update({
        balance: newBalance,
        total_invested: (wallet.total_invested || 0) + amount,
      })
      .eq("user_id", userId)
      .gte("balance", amount) // ← VALIDACIÓN SERVER-SIDE: solo actualiza si balance >= amount
      .select("id")
      .single();

    if (updateError || !updatedWallet) {
      throw new Error(
        "Saldo insuficiente para realizar la apuesta (verificado en servidor)",
      );
    }

    // 5. Insertar apuesta (el saldo ya fue debitado)
    const { data: betData, error: betError } = await supabase
      .from("user_bets")
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          betting_option_id: bettingOptionId,
          amount: amount,
          potential_profit: estimatedProfit,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (betError) {
      // ROLLBACK: si falla la inserción de la apuesta, devolver el saldo
      console.error(
        "❌ Error insertando apuesta, devolviendo saldo...",
        betError,
      );
      await supabase
        .from("wallets")
        .update({
          balance: wallet.balance, // Restaurar balance original
          total_invested: wallet.total_invested, // Restaurar total_invested original
        })
        .eq("user_id", userId);

      throw new Error(
        "Error al registrar la apuesta. Tu saldo ha sido restaurado.",
      );
    }

    return { data: betData, error: null };
  }

  // Obtener apuestas de usuario
  async getUserBets(userId, dateFilter = null) {
    try {
      let query = supabase
        .from("user_bets")
        .select(
          `
          *,
          events (*),
          betting_options (*)
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        const endDate = new Date(dateFilter);
        endDate.setDate(endDate.getDate() + 1);

        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error obteniendo apuestas del usuario:", error);
      return { data: null, error: error.message };
    }
  }

  // Cancelar apuesta (solo si está pendiente)
  async cancelBet(betId, userId) {
    try {
      // Verificar que la apuesta pertenece al usuario y está pendiente
      const { data: bet, error: checkError } = await supabase
        .from("user_bets")
        .select("*")
        .eq("id", betId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .single();

      if (checkError) throw checkError;
      if (!bet) throw new Error("Apuesta no encontrada o ya procesada");

      // Actualizar estado a cancelada
      const { data, error } = await supabase
        .from("user_bets")
        .update({ status: "cancelled" })
        .eq("id", betId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error cancelando apuesta:", error);
      return { data: null, error: error.message };
    }
  }

  // Obtener estadísticas de apuestas del usuario
  async getUserBetStats(userId) {
    try {
      const { data, error } = await supabase
        .from("user_bets")
        .select("amount, potential_profit, status")
        .eq("user_id", userId);

      if (error) throw error;

      const stats = {
        totalBets: data.length,
        totalAmount: data.reduce(
          (sum, bet) => sum + parseFloat(bet.amount || 0),
          0,
        ),
        estimatedProfit: data.reduce(
          (sum, bet) => sum + parseFloat(bet.potential_profit || 0),
          0,
        ),
        pendingBets: data.filter((bet) => bet.status === "pending").length,
        wonBets: data.filter((bet) => bet.status === "won").length,
        lostBets: data.filter((bet) => bet.status === "lost").length,
        cancelledBets: data.filter((bet) => bet.status === "cancelled").length,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return { data: null, error: error.message };
    }
  }

  // Suscribirse a cambios en eventos en tiempo real
  subscribeToEvents(callback) {
    return supabase
      .channel("events-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        callback,
      )
      .subscribe();
  }

  // Suscribirse a cambios en apuestas del usuario
  subscribeToUserBets(userId, callback) {
    return supabase
      .channel(`user-bets-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_bets",
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  }
}

export default new EventsService();
