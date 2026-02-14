import { useState, useEffect, useCallback } from "react";
import AuthService from "../services/AuthService";

/**
 * Hook compartido que resuelve auth user → user profile.
 * Evita repetir la cadena getCurrentUser() → getUserProfile() en cada pantalla.
 *
 * @returns {{ userId, userProfile, authUser, loading, refresh }}
 */
export const useCurrentUser = () => {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        setAuthUser(null);
        setUserProfile(null);
        return;
      }

      setAuthUser(currentUser);

      const { data: profile } = await AuthService.getUserProfile(
        currentUser.id,
      );
      setUserProfile(profile);
    } catch (error) {
      console.error("Error in useCurrentUser:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    /** user_id de la tabla users (para queries de negocio) */
    userId: userProfile?.id || null,
    /** Perfil completo de la tabla users */
    userProfile,
    /** Auth user de Supabase (auth_id, email, etc.) */
    authUser,
    loading,
    refresh: loadUser,
  };
};
