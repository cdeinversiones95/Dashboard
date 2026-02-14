import { supabase } from "../config/supabase";
import ReferralService from "./ReferralService";

class AuthService {
  // Generar código de invitación simple (síncrono, fallback)
  generateInvitationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Registrar nuevo usuario con número telefónico
  async signUp(phone, password, userData = {}) {
    try {
      // Validaciones iniciales
      if (!phone || !password) {
        throw new Error("Número telefónico y contraseña son requeridos");
      }

      // Validar formato del teléfono (debe tener al menos 10 dígitos)
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        throw new Error("El número telefónico debe tener al menos 10 dígitos");
      }

      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      // Validar código de invitación si existe
      let referrerId = null;
      if (userData.invitationCode) {
        const { valid, referrerId: refId } =
          await ReferralService.validateInvitationCode(userData.invitationCode);

        if (valid && refId) {
          referrerId = refId;
        } else {
          throw new Error(
            "El código de invitación no es válido. Verifica e intenta de nuevo, o regístrate sin código.",
          );
        }
      }

      // Crear email usando formato simple: numero@phone.local
      const tempEmail = `${phoneDigits}@phone.local`;

      const startTime1 = Date.now();

      // PASO 1: Crear la cuenta de auth SIN metadata para evitar errores
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password,
        // Removimos options y data para evitar conflictos con triggers
      });

      if (authError) {
        // Error de usuario duplicado
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("User already registered") ||
          authError.message.includes("email already exists")
        ) {
          throw new Error(
            "Ya existe una cuenta registrada con este número telefónico",
          );
        }

        throw authError;
      }

      if (!authData || !authData.user) {
        throw new Error("No se pudo crear la cuenta de autenticación");
      }

      const userId = authData.user.id;

      // PASO 2: Crear manualmente el perfil y billetera (sin triggers problemáticos)

      const startTime2 = Date.now();

      // Generar nuevo código de invitación único
      let newInvitationCode;
      try {
        newInvitationCode = await ReferralService.generateUniqueCode();
      } catch (codeErr) {
        newInvitationCode = this.generateInvitationCode();
      }

      // Crear el perfil de usuario manualmente
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          auth_id: userId,
          phone: phone,
          username: userData.display_name || phone,
          full_name: userData.display_name || phone,
          is_active: true,
          phone_verified: true,
          invitation_code: newInvitationCode,
          referred_by: referrerId,
        })
        .select()
        .single();

      if (userError) {
        // Si es error de duplicado, intentar obtener el usuario existente
        if (userError.code === "23505") {
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", userId)
            .single();

          if (fetchError) {
            throw new Error(
              `Error obteniendo usuario existente: ${fetchError.message}`,
            );
          }
          // Usar el usuario existente en lugar del que falló al insertarse
          newUser = existingUser;
        } else {
          throw new Error(`Error creando perfil: ${userError.message}`);
        }
      }

      const userIdForWallet = newUser?.id;
      if (!userIdForWallet) {
        throw new Error(
          "No se pudo obtener el ID del usuario para crear la billetera",
        );
      }

      // Crear la billetera manualmente
      const { error: walletError } = await supabase.from("wallets").insert({
        user_id: userIdForWallet,
        balance: 0.0,
        total_deposited: 0.0,
        total_withdrawn: 0.0,
        total_invested: 0.0,
        total_profits: 0.0,
        is_active: true,
      });

      if (walletError) {
        if (walletError.code !== "23505") {
          // No es error de duplicado
          throw new Error(`Error creando billetera: ${walletError.message}`);
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.message || "Error durante el registro",
      };
    }
  }

  // Iniciar sesión con número telefónico
  async signIn(phone, password) {
    try {
      // Validaciones iniciales
      if (!phone || !password) {
        throw new Error("Número telefónico y contraseña son requeridos");
      }

      // Limpiar el teléfono y crear email usando formato: numero@phone.local
      const phoneDigits = phone.replace(/\D/g, "");
      const tempEmail = `${phoneDigits}@phone.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Número telefónico o contraseña incorrectos");
        } else {
          throw new Error("Error de autenticación");
        }
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.message || "Error durante el login",
      };
    }
  }

  // Obtener información completa del usuario
  async getUserProfile(authId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();

      if (error) {
        // Si el usuario no existe aún (race condition en registro), no es un error crítico
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      return { data: null, error: error.message };
    }
  }

  // Asegurar que el usuario tenga un código de invitación
  async ensureInvitationCode(userId) {
    try {
      // 1. Verificar si ya tiene código
      const { data: user, error } = await supabase
        .from("users")
        .select("invitation_code")
        .eq("auth_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      if (user && user.invitation_code) {
        return user.invitation_code;
      }

      // 2. Si no tiene, generar uno nuevo y único
      let newCode;
      try {
        newCode = await ReferralService.generateUniqueCode();
      } catch (codeErr) {
        newCode = this.generateInvitationCode();
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ invitation_code: newCode })
        .eq("auth_id", userId);

      if (updateError) throw updateError;

      return newCode;
    } catch (error) {
      console.error("Error ensuring invitation code:", error);
      return null;
    }
  }

  // Verificar si un número telefónico ya existe
  async checkPhoneExists(phone) {
    try {
      const phoneDigits = phone.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("users")
        .select("phone")
        .eq("phone", phone)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 significa "no rows returned", que es lo que esperamos si no existe
        console.error("Error verificando teléfono:", error);
        return { exists: false, error: null }; // Asumimos que no existe si hay error de tabla
      }

      return { exists: !!data, error: null };
    } catch (error) {
      console.error("Error en checkPhoneExists:", error);
      return { exists: false, error: error.message };
    }
  }

  // Cerrar sesión
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error en signOut:", error);
      return { error: error.message };
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    }
  }

  // Obtener sesión actual
  async getCurrentSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error("Error obteniendo sesión:", error);
      return null;
    }
  }

  // Escuchar cambios de autenticación
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // Restablecer contraseña (usando teléfono)
  async resetPassword(phone) {
    try {
      // Buscar el email asociado al teléfono
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("phone", phone)
        .single();

      if (userError || !userData) {
        throw new Error("Número telefónico no encontrado");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        userData.email,
      );
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error en resetPassword:", error);
      return { error: error.message };
    }
  }

  // Actualizar perfil de usuario
  async updateProfile(updates) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Actualizar en tabla users usando auth_id
      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("auth_id", user.id);

      if (updateError) throw updateError;

      // También actualizar metadatos de auth si es necesario
      const { data, error } = await supabase.auth.updateUser({
        data: {
          phone: updates.phone,
          display_name: updates.display_name,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      return { data: null, error: error.message };
    }
  }
}

export default new AuthService();
