import React, { createContext, useContext, useEffect, useState } from "react";
import AuthService from "../services/AuthService";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout de seguridad para asegurar que loading se ponga en false
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000); // 5 segundos máximo

    const initAuth = async () => {
      try {
        // Obtener sesión inicial con timeout
        const session = await AuthService.getCurrentSession();

        if (mounted) {
          setSession(session);
          setUser(session?.user || null);
          setUserProfile(
            session?.user
              ? {
                  username: session.user.user_metadata?.username || "Usuario",
                  display_name:
                    session.user.user_metadata?.display_name || "Usuario",
                }
              : null,
          );
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error obteniendo sesión inicial:", error);
        console.error("Tipo de error:", error.name);
        console.error("Mensaje:", error.message);

        if (mounted) {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    };

    // Ejecutar inicialización
    initAuth();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user || null);

        // Obtener perfil completo desde la base de datos
        if (session?.user) {
          try {
            const { data: dbUserProfile } = await AuthService.getUserProfile(
              session.user.id,
            );
            setUserProfile(
              dbUserProfile || {
                username: session.user.user_metadata?.username || "Usuario",
                display_name:
                  session.user.user_metadata?.display_name || "Usuario",
                full_name:
                  session.user.user_metadata?.display_name || "Usuario",
              },
            );
          } catch (error) {
            console.error("Error obteniendo perfil de BD:", error);
            setUserProfile({
              username: session.user.user_metadata?.username || "Usuario",
              display_name:
                session.user.user_metadata?.display_name || "Usuario",
              full_name: session.user.user_metadata?.display_name || "Usuario",
            });
          }
        } else {
          setUserProfile(null);
        }
        // No poner loading false aquí para evitar conflictos
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (username, password) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(username, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username, password, userData) => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(username, password, userData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signOut();
      setUser(null);
      setUserProfile(null);
      setSession(null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const result = await AuthService.updateProfile(updates);
      if (result.data && !result.error) {
        // Actualizar perfil local usando auth_id
        const { data: updatedProfile } = await AuthService.getUserProfile(
          user.id,
        );
        setUserProfile(updatedProfile);
      }
      return result;
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      return { data: null, error: error.message };
    }
  };

  const resetPassword = async (username) => {
    return await AuthService.resetPassword(username);
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
