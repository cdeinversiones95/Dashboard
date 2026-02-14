import { supabase } from "../config/supabase";

/**
 * WalletService - Maneja todas las operaciones de billetera y transacciones
 * Conecta la app móvil con la base de datos para manejar montos reales
 */
class WalletService {
  // =========================================
  // VERIFICACIÓN DE AUTENTICACIÓN
  // =========================================

  /**
   * Verifica si hay un usuario autenticado y retorna información del usuario
   */
  static async verifyAuthentication() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("❌ Error de autenticación:", authError.message);
        return {
          authenticated: false,
          user: null,
          error: `Error de autenticación: ${authError.message}`,
        };
      }

      if (!user) {
        return {
          authenticated: false,
          user: null,
          error: "No hay usuario autenticado. Por favor, inicia sesión.",
        };
      }

      return {
        authenticated: true,
        user,
        error: null,
      };
    } catch (error) {
      console.error("❌ Error verificando autenticación:", error);
      return {
        authenticated: false,
        user: null,
        error: `Error verificando autenticación: ${error.message}`,
      };
    }
  }

  // =========================================
  // MÉTODOS DE BILLETERA
  // =========================================

  /**
   * Obtener información completa de la billetera del usuario (crear si no existe)
   * Ahora maneja automáticamente la creación del usuario si no existe
   */
  async getUserWallet(userId = null) {
    try {
      // Verificar autenticación
      const authResult = await WalletService.verifyAuthentication();
      if (!authResult.authenticated) {
        console.error("❌ Error obteniendo billetera:", authResult.error);
        return {
          error: `Error cargando balance: ${authResult.error}`,
          data: null,
        };
      }

      const currentAuthUser = authResult.user;

      // ACTUALIZADO: Buscar usuario en nueva estructura
      let userRecord = null;
      const { data: existingUser, error: userFindError } = await supabase
        .from("users")
        .select("id, auth_id, username, phone, full_name")
        .eq("auth_id", currentAuthUser.id)
        .single();

      if (userFindError && userFindError.code === "PGRST116") {
        // Usuario no existe, usar función create_complete_user
        try {
          const { data: newUserId, error: createUserError } =
            await supabase.rpc("create_user_simple", {
              p_auth_id: currentAuthUser.id,
              p_phone: currentAuthUser.phone,
              p_username:
                currentAuthUser.phone ||
                `user_${currentAuthUser.id.substring(0, 8)}`,
              p_full_name:
                currentAuthUser.user_metadata?.display_name || "Usuario",
            });

          if (createUserError) {
            console.error(
              "❌ Error creando usuario completo:",
              createUserError,
            );
            return {
              error: `Error creando usuario: ${createUserError.message}`,
              data: null,
            };
          }

          // Obtener el usuario recién creado
          const { data: createdUser } = await supabase
            .from("users")
            .select("id, auth_id, username, phone, full_name")
            .eq("id", newUserId)
            .single();

          userRecord = createdUser;
        } catch (funcError) {
          // Si la función RPC no existe, crear manualmente
          const { data: newUser, error: createUserError } = await supabase
            .from("users")
            .insert([
              {
                auth_id: currentAuthUser.id,
                username:
                  currentAuthUser.phone ||
                  `user_${currentAuthUser.id.substring(0, 8)}`,
                full_name:
                  currentAuthUser.user_metadata?.display_name || "Usuario",
                phone: currentAuthUser.phone,
                is_active: true,
              },
            ])
            .select()
            .single();

          if (createUserError) {
            console.error(
              "❌ Error creando usuario manualmente:",
              createUserError,
            );
            return {
              error: `Error creando usuario: ${createUserError.message}`,
              data: null,
            };
          }

          userRecord = newUser;
        }
      } else if (userFindError) {
        console.error("❌ Error buscando usuario:", userFindError);
        return {
          error: `Error buscando usuario: ${userFindError.message}`,
          data: null,
        };
      } else {
        userRecord = existingUser;
      }

      // Ahora buscar la billetera usando el user_id correcto
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userRecord.id)
        .single();

      // Si encontramos la billetera, agregar transacciones por separado
      if (data && !error) {
        // ACTUALIZADO: Obtener transacciones con nueva estructura
        try {
          const { data: transactionsData, error: transError } = await supabase
            .from("transactions")
            .select(
              "id, transaction_type, amount, balance_before, balance_after, status, description, created_at",
            )
            .eq("user_id", userRecord.id)
            .order("created_at", { ascending: false })
            .limit(10);

          // Agregar transacciones al resultado
          data.transactions = transError ? [] : transactionsData || [];

          if (transError) {
          }
        } catch (transErr) {
          data.transactions = [];
        }

        return { data, error: null };
      }

      // Si el error es que no existe (PGRST116), crear billetera
      if (error && error.code === "PGRST116") {
        const createResult = await this.createWallet(userRecord.id);

        if (createResult.error) {
          console.error("Error creando billetera:", createResult.error);
          return { error: createResult.error, data: null };
        }

        // Retornar la billetera recién creada con transacciones vacías
        const walletWithTransactions = {
          ...createResult.data,
          transactions: [],
        };

        return { data: walletWithTransactions, error: null };
      }

      // Si es otro tipo de error, manejarlo
      if (error) {
        console.error("Error obteniendo billetera:", error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error en getUserWallet:", err);
      return { error: "Error obteniendo información de billetera", data: null };
    }
  }

  /**
   * Obtener solo el balance actual del usuario (crear billetera si no existe)
   */
  async getUserBalance(authId) {
    try {
      // Buscar el user_id usando auth_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authId)
        .single();

      if (userError) {
        console.error("Error buscando usuario por auth_id:", userError);
        return { error: "Usuario no encontrado", data: null };
      }

      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      // Si existe la billetera, retornar balance
      if (data && !error) {
        return { data, error: null };
      }

      // Si el error es que no existe (PGRST116), crear billetera
      if (error && error.code === "PGRST116") {
        const createResult = await this.createWallet(user.id);

        if (createResult.error) {
          console.error("Error creando billetera:", createResult.error);
          return { error: createResult.error, data: null };
        }

        return { data: { balance: 0.0 }, error: null };
      }

      // Si es otro tipo de error, manejarlo
      if (error) {
        console.error("Error obteniendo balance:", error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error en getUserBalance:", err);
      return { error: "Error obteniendo balance", data: null };
    }
  }

  /**
   * Crear billetera para usuario (crea usuario si no existe)
   */
  async createWallet(userId) {
    try {
      // Verificar que tenemos un userId válido
      if (!userId) {
        console.error("❌ Error: userId es requerido para crear billetera");
        return { error: "ID de usuario requerido", data: null };
      }

      // Verificar autenticación
      const authResult = await WalletService.verifyAuthentication();
      if (!authResult.authenticated) {
        console.error("❌ Error creando billetera:", authResult.error);
        return {
          error: `Error creando billetera: ${authResult.error}`,
          data: null,
        };
      }

      const currentAuthUser = authResult.user;

      // Verificar/crear usuario en tabla users antes de crear billetera
      const { data: existingUser, error: userFindError } = await supabase
        .from("users")
        .select("id, auth_id")
        .eq("auth_id", currentAuthUser.id)
        .single();

      let finalUserId = userId;

      if (userFindError && userFindError.code === "PGRST116") {
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .insert([
            {
              auth_id: currentAuthUser.id,
              username:
                currentAuthUser.user_metadata?.username ||
                currentAuthUser.phone ||
                `user_${currentAuthUser.id.substring(0, 8)}`,
              full_name:
                currentAuthUser.user_metadata?.display_name || "Usuario",
              phone: currentAuthUser.phone,
            },
          ])
          .select()
          .single();

        if (createUserError) {
          console.error("❌ Error creando usuario:", createUserError);
          return {
            error: `Error creando usuario: ${createUserError.message}`,
            data: null,
          };
        }

        finalUserId = newUser.id;
      } else if (userFindError) {
        console.error("❌ Error buscando usuario:", userFindError);
        return {
          error: `Error buscando usuario: ${userFindError.message}`,
          data: null,
        };
      } else {
        finalUserId = existingUser.id;
      }

      // Verificar si ya existe una billetera para este usuario
      const { data: existingWallet, error: checkError } = await supabase
        .from("wallets")
        .select("id, user_id, balance")
        .eq("user_id", finalUserId)
        .single();

      // Si ya existe una billetera, retornarla
      if (existingWallet && !checkError) {
        return { data: existingWallet, error: null };
      }

      // Si no existe (error PGRST116), crear nueva billetera
      if (checkError && checkError.code === "PGRST116") {
        const { data, error } = await supabase
          .from("wallets")
          .insert([
            {
              user_id: finalUserId, // Usar el ID correcto del usuario
              balance: 0.0,
              total_deposited: 0.0,
              total_withdrawn: 0.0,
              total_invested: 0.0,
              total_profits: 0.0,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("❌ Error creando billetera:", error);
          console.error("   Error code:", error.code);
          console.error("   Error details:", error.details);
          console.error("   Error hint:", error.hint);
          return { error: error.message, data: null };
        }

        return { data, error: null };
      }

      // Si hay otro tipo de error en la verificación
      if (checkError) {
        console.error("❌ Error verificando billetera existente:", checkError);
        return { error: checkError.message, data: null };
      }

      // Este punto no debería alcanzarse normalmente
      console.error("❌ Estado inesperado en createWallet");
      return { error: "Estado inesperado creando billetera", data: null };
    } catch (err) {
      console.error("❌ Error en createWallet:", err);
      return { error: "Error creando billetera", data: null };
    }
  }

  // =========================================
  // MÉTODOS DE TRANSACCIONES
  // =========================================

  /**
   * Obtener historial de transacciones del usuario
   */
  async getUserTransactions(authId, limit = 50, offset = 0) {
    try {
      // Buscar el user_id usando auth_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authId)
        .single();

      if (userError) {
        console.error("Error buscando usuario por auth_id:", userError);
        return { error: "Usuario no encontrado", data: [] };
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error obteniendo transacciones:", error);
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error en getUserTransactions:", err);
      return { error: "Error obteniendo transacciones", data: null };
    }
  }

  /**
   * Crear nueva transacción
   * IMPORTANTE: Este método debe ser usado solo por el sistema/admin
   */
  async createTransaction(userId, walletId, transactionData) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: userId,
            wallet_id: walletId,
            transaction_type: transactionData.type,
            amount: parseFloat(transactionData.amount),
            balance_after: parseFloat(transactionData.balanceAfter),
            currency: transactionData.currency || "DOP",
            status: transactionData.status || "completed",
            description: transactionData.description,
            reference_id: transactionData.referenceId,
            metadata: transactionData.metadata || {},
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creando transacción:", error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error en createTransaction:", err);
      return { error: "Error creando transacción", data: null };
    }
  }

  // =========================================
  // MÉTODOS DE DEPÓSITOS
  // =========================================

  /**
   * Solicitar depósito (pendiente de aprobación admin)
   */
  async requestDeposit(
    userId,
    amount,
    paymentMethodId = null,
    paymentReference = "",
    paymentMethodType = "bank_transfer",
  ) {
    try {
      // Obtener el usuario autenticado actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("❌ Error: Usuario no autenticado");
        return { error: "Usuario no autenticado", data: null };
      }

      // Buscar el user_id en la tabla users usando auth_id
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id, auth_id")
        .eq("auth_id", user.id)
        .single();

      let finalUserId;

      if (userError || !userRecord) {
        console.error("Error detalles:", userError);

        // Intentar crear el usuario si no existe
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              auth_id: user.id,
              username:
                user.user_metadata?.username ||
                user.phone ||
                `user_${user.id.substring(0, 8)}`,
              full_name: user.user_metadata?.display_name || "Usuario",
              phone: user.phone,
            },
          ])
          .select("id")
          .single();

        if (createError) {
          console.error("❌ Error creando usuario:", createError);
          console.error("   Error code:", createError.code);
          console.error("   Error details:", createError.details);
          return { error: "Error creando registro de usuario", data: null };
        }

        finalUserId = newUser.id;
      } else {
        finalUserId = userRecord.id;
      }

      // Verificar que tenemos un finalUserId válido
      if (!finalUserId) {
        console.error("❌ Error: No se pudo obtener ID de usuario válido");
        return { error: "Error obteniendo ID de usuario", data: null };
      }

      // Debug específico para pending_deposits
      try {
        const { data: testResult } = await supabase.rpc(
          "test_pending_deposits_access",
        );
      } catch (debugError) {}

      // Preparar datos del depósito con manejo inteligente de columnas
      const baseDepositData = {
        user_id: finalUserId,
        amount: parseFloat(amount),
        reference_number: paymentReference || "",
        status: "pending",
        payment_method: paymentMethodType, // Campo requerido - usa el tipo recibido
      };

      // Solo agregar payment_method_id si existe
      if (paymentMethodId) {
        baseDepositData.payment_method_id = paymentMethodId;
      }

      // Intentar inserción con manejo de errores de columnas faltantes
      let insertResult;

      try {
        // Primer intento: insertar solo los campos básicos
        insertResult = await supabase
          .from("pending_deposits")
          .insert([baseDepositData])
          .select()
          .single();

        if (insertResult.error) {
          throw insertResult.error;
        }
      } catch (insertError) {
        console.error("❌ Error en inserción básica:", insertError);

        // Si falla, intentar con un conjunto mínimo de campos
        const minimalData = {
          user_id: finalUserId,
          amount: parseFloat(amount),
          status: "pending",
        };

        try {
          insertResult = await supabase
            .from("pending_deposits")
            .insert([minimalData])
            .select()
            .single();

          if (insertResult.error) {
            throw insertResult.error;
          }
        } catch (minimalError) {
          console.error("❌ Error en inserción mínima:", minimalError);

          // Proporcionar error detallado
          const errorMessage =
            minimalError.code === "42703"
              ? `Campo no válido en la tabla: ${minimalError.message}`
              : minimalError.code === "23503"
                ? "Error de clave foránea: Verifique la configuración de la base de datos"
                : minimalError.code === "42501"
                  ? "Sin permisos para insertar: Verifique las políticas RLS"
                  : `Error de base de datos: ${minimalError.message}`;

          return {
            error: errorMessage,
            data: null,
            code: minimalError.code,
            details: minimalError.details,
          };
        }
      }

      const data = insertResult.data;

      return { data, error: null };
    } catch (err) {
      console.error("Error en requestDeposit:", err);
      return { error: "Error solicitando depósito", data: null };
    }
  }

  /**
   * Obtener depósitos pendientes del usuario
   */
  async getUserPendingDeposits(authId) {
    try {
      // Buscar el user_id usando auth_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authId)
        .single();

      if (userError) {
        console.error("Error buscando usuario por auth_id:", userError);
        return { error: "Usuario no encontrado", data: [] };
      }

      const { data, error } = await supabase
        .from("pending_deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error obteniendo depósitos pendientes:", error);
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error en getUserPendingDeposits:", err);
      return { error: "Error obteniendo depósitos pendientes", data: null };
    }
  }

  // =========================================
  // MÉTODOS DE RETIROS
  // =========================================

  /**
   * Solicitar retiro
   * Realiza la validación de balance, crea la solicitud y debita el monto
   */
  async requestWithdrawal(
    userId,
    amount,
    paymentDetails,
    paymentMethodType = "bank_transfer",
  ) {
    try {
      // 1. Verificar autenticación y obtener usuario real
      const authResult = await WalletService.verifyAuthentication();
      if (!authResult.authenticated) {
        return { error: authResult.error, data: null };
      }

      // Buscar el usuario en la tabla users
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authResult.user.id)
        .single();

      if (userError || !userRecord) {
        console.error("❌ Error buscando usuario:", userError);
        return { error: "Usuario no encontrado en el sistema", data: null };
      }

      const realUserId = userRecord.id;

      // 2. Obtener billetera y verificar balance
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", realUserId)
        .single();

      if (walletError || !wallet) {
        console.error("❌ Error obteniendo billetera:", walletError);
        return { error: "No se encontró la billetera del usuario", data: null };
      }

      if (wallet.balance < amount) {
        return {
          error: `Balance insuficiente. Disponible: ${wallet.balance}`,
          data: null,
        };
      }

      // ── Calcular total depositado (desde BD o desde depósitos reales) ──
      let totalDeposited = parseFloat(wallet.total_deposited || 0);

      // Si wallet.total_deposited es 0 o null, calcular desde la tabla de deposits/transactions
      if (totalDeposited <= 0) {
        try {
          const { data: depositRecords } = await supabase
            .from("deposits")
            .select("amount, status")
            .eq("user_id", realUserId)
            .in("status", ["approved", "completed", "confirmed"]);

          if (depositRecords && depositRecords.length > 0) {
            totalDeposited = depositRecords.reduce(
              (sum, d) => sum + parseFloat(d.amount || 0),
              0,
            );
          }
        } catch (e) {
          console.warn(
            "No se pudo calcular depósitos desde tabla deposits:",
            e,
          );
        }

        // Si aún es 0, intentar desde transactions
        if (totalDeposited <= 0) {
          try {
            const { data: txDeposits } = await supabase
              .from("transactions")
              .select("amount, transaction_type")
              .eq("user_id", realUserId)
              .in("transaction_type", [
                "deposit",
                "bank_transfer",
                "usdt_transfer",
                "recharge",
                "top_up",
              ]);

            if (txDeposits && txDeposits.length > 0) {
              totalDeposited = txDeposits.reduce(
                (sum, t) => sum + parseFloat(t.amount || 0),
                0,
              );
            }
          } catch (e) {
            console.warn(
              "No se pudo calcular depósitos desde transactions:",
              e,
            );
          }
        }
      }

      // ── Protección: Balance mínimo obligatorio según nivel VIP ──
      // Básico=38%, VIP1=32%, VIP2=26%, VIP3=20%, VIP4=15%
      const VIP_MIN_BALANCE = [
        { minDeposit: 100000, percent: 0.15 },
        { minDeposit: 60000, percent: 0.2 },
        { minDeposit: 35000, percent: 0.26 },
        { minDeposit: 15000, percent: 0.32 },
        { minDeposit: 0, percent: 0.38 },
      ];

      // Si no se pudo determinar totalDeposited, usar el balance actual como base
      const effectiveDeposited =
        totalDeposited > 0 ? totalDeposited : wallet.balance;
      const minBalancePercent =
        VIP_MIN_BALANCE.find((v) => effectiveDeposited >= v.minDeposit)
          ?.percent || 0.38;
      const minByPercent = effectiveDeposited * minBalancePercent;
      // PROTECCIÓN ABSOLUTA: mínimo 1 peso en cuenta, la billetera NUNCA puede quedar en 0
      const minBalanceRequired = Math.max(minByPercent, 1);
      const balanceAfterWithdrawal = wallet.balance - amount;
      const maxAllowedWithdrawal = Math.max(
        wallet.balance - minBalanceRequired,
        0,
      );

      if (balanceAfterWithdrawal < minBalanceRequired) {
        return {
          error: `No puedes dejar tu cuenta por debajo del ${Math.round(minBalancePercent * 100)}% de tus depósitos (RD$${minBalanceRequired.toFixed(2)}). Máximo retirable ahora: RD$${maxAllowedWithdrawal.toFixed(2)}`,
          data: null,
        };
      }

      // 3. Calcular fee (si aplica) - Por ahora 0 o lo que estaba antes
      const fee = 0; // Se puede ajustar según reglas de negocio
      const netAmount = amount - fee;

      // 4. Crear registro de retiro
      // Preparamos los datos según la estructura de la tabla withdrawals
      // NOTA: La columna payment_method no existe en la tabla, guardamos todo en user_notes
      const withdrawalData = {
        user_id: realUserId,
        wallet_id: wallet.id,
        amount: parseFloat(amount),
        fee: parseFloat(fee),
        net_amount: parseFloat(netAmount),
        status: "pending",
        // Guardamos el método y los detalles en user_notes
        user_notes: JSON.stringify({
          method: paymentMethodType,
          details: paymentDetails,
        }),
        created_at: new Date().toISOString(),
      };

      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert([withdrawalData])
        .select()
        .single();

      if (withdrawalError) {
        console.error("❌ Error creando registro de retiro:", withdrawalError);
        return {
          error: `Error al registrar retiro: ${withdrawalError.message}`,
          data: null,
        };
      }

      // 5. Debitar balance de la billetera
      const newBalance = wallet.balance - amount;
      const { error: updateError } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (updateError) {
        console.error("❌ Error actualizando balance:", updateError);
        // NOTA: Aquí idealmente deberíamos hacer rollback del retiro,
        // pero por ahora retornamos éxito con advertencia o manejamos el error.
        // En un sistema real, esto debería ser una transacción atómica.
        return {
          error:
            "Retiro registrado pero hubo un error actualizando el balance. Contacte soporte.",
          data: withdrawal,
        };
      }

      return { data: withdrawal, error: null };
    } catch (err) {
      console.error("❌ Error en requestWithdrawal:", err);
      return { error: "Error inesperado procesando el retiro", data: null };
    }
  }

  /**
   * Obtener retiros del usuario
   */
  async getUserWithdrawals(authId) {
    try {
      // Buscar el user_id usando auth_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authId)
        .single();

      if (userError) {
        console.error("Error buscando usuario por auth_id:", userError);
        return { error: "Usuario no encontrado", data: [] };
      }

      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error obteniendo retiros:", error);
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error en getUserWithdrawals:", err);
      return { error: "Error obteniendo retiros", data: null };
    }
  }

  // =========================================
  // MÉTODOS DE CONFIGURACIÓN (antes en screens)
  // =========================================

  /**
   * Obtener montos de recarga disponibles.
   * Antes estaba como query directa en BankTransferScreen.
   */
  async getRechargeAmounts() {
    try {
      const { data, error } = await supabase
        .from("recharge_amounts")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) {
        console.error("Error obteniendo montos de recarga:", error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error en getRechargeAmounts:", err);
      return { data: [], error: "Error obteniendo montos de recarga" };
    }
  }

  /**
   * Obtener métodos de pago activos, opcionalmente filtrados por tipo.
   * Antes estaba como query directa en BankTransferScreen.
   */
  async getPaymentMethods(methodType = null) {
    try {
      let query = supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true);

      if (methodType) {
        query = query.eq("method_type", methodType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error obteniendo métodos de pago:", error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error en getPaymentMethods:", err);
      return { data: [], error: "Error obteniendo métodos de pago" };
    }
  }

  /**
   * Obtener historial de depósitos del usuario (por auth_id).
   * Antes estaba como query directa en ProfileScreen.
   */
  async getDepositHistory(authId, limit = 10) {
    try {
      // Buscar el user_id usando auth_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authId)
        .single();

      if (userError) {
        console.error("Error buscando usuario por auth_id:", userError);
        return { data: [], error: "Usuario no encontrado" };
      }

      const { data, error } = await supabase
        .from("pending_deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error obteniendo historial de depósitos:", error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error en getDepositHistory:", err);
      return { data: [], error: "Error obteniendo historial de depósitos" };
    }
  }
}

export default new WalletService();
