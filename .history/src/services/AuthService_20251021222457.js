import { supabase } from '../config/supabase';

class AuthService {
  
  // Registrar nuevo usuario con número telefónico
  async signUp(phone, password, userData = {}) {
    try {
      // Validaciones iniciales
      if (!phone || !password) {
        throw new Error('Número telefónico y contraseña son requeridos');
      }

      // Validar formato del teléfono (debe tener al menos 10 dígitos)
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('El número telefónico debe tener al menos 10 dígitos');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar si ya existe una cuenta con este número telefónico
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        throw new Error('Ya existe una cuenta registrada con este número telefónico');
      }

      // Si el error no es "no rows returned", entonces hay un problema real
      if (checkError && checkError.code !== 'PGRST116') {
        console.log('Error verificando teléfono existente:', checkError);
        // Continuamos con el registro si es solo un error de tabla
      }

      // Crear email temporal usando el teléfono con dominio válido
      const tempEmail = `${phoneDigits}@cdeinversiones.app`;
      
      // Primero crear la cuenta de auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password,
        options: {
          data: {
            phone: phone,
            display_name: userData.display_name || phone,
            name: userData.display_name || phone,
          }
        }
      });

      if (authError) {
        // Si el error es por email duplicado, es porque el teléfono ya existe
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered') ||
            authError.message.includes('email already exists')) {
          throw new Error('Ya existe una cuenta registrada con este número telefónico');
        }
        throw authError;
      }

      // Verificar que el usuario fue creado
      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta');
      }

      // El trigger create_user_and_wallet_on_signup se encarga de:
      // 1. Crear el registro en public.users
      // 2. Crear la billetera en public.wallets
      // No necesitamos insertar manualmente

      return { data: authData, error: null };
      
    } catch (error) {
      return { 
        data: null, 
        error: error.message || 'Error durante el registro'
      };
    }
  }

  // Iniciar sesión con número telefónico
  async signIn(phone, password) {
    try {
      // Validaciones iniciales
      if (!phone || !password) {
        throw new Error('Número telefónico y contraseña son requeridos');
      }

      // Limpiar el teléfono y crear email temporal con dominio válido
      const phoneDigits = phone.replace(/\D/g, '');
      const tempEmail = `${phoneDigits}@cdeinversiones.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Número telefónico o contraseña incorrectos');
        } else {
          throw new Error('Error de autenticación');
        }
      }

      return { data, error: null };
      
    } catch (error) {
      return { 
        data: null, 
        error: error.message || 'Error durante el login'
      };
    }
  }

  // Obtener información completa del usuario
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return { data: null, error: error.message };
    }
  }

  // Verificar si un número telefónico ya existe
  async checkPhoneExists(phone) {
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 significa "no rows returned", que es lo que esperamos si no existe
        console.error('Error verificando teléfono:', error);
        return { exists: false, error: null }; // Asumimos que no existe si hay error de tabla
      }

      return { exists: !!data, error: null };
    } catch (error) {
      console.error('Error en checkPhoneExists:', error);
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
      console.error('Error en signOut:', error);
      return { error: error.message };
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  // Obtener sesión actual
  async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
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
        .from('users')
        .select('email')
        .eq('phone', phone)
        .single();

      if (userError || !userData) {
        throw new Error('Número telefónico no encontrado');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(userData.email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error en resetPassword:', error);
      return { error: error.message };
    }
  }

  // Actualizar perfil de usuario
  async updateProfile(updates) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Actualizar en tabla users
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // También actualizar metadatos de auth si es necesario
      const { data, error } = await supabase.auth.updateUser({
        data: {
          phone: updates.phone,
          display_name: updates.display_name,
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { data: null, error: error.message };
    }
  }
}

export default new AuthService();