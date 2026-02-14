import { useState, useEffect } from "react";
import StatsService from "../services/StatsService";
import InvestmentService from "../services/InvestmentService";
import { useAuth } from "../contexts/AuthContext";

export const useSupabaseData = () => {
  const [globalStats, setGlobalStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userInvestments, setUserInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Cargar estadísticas globales
  const loadGlobalStats = async () => {
    try {
      const result = await StatsService.getGlobalStats();
      if (result.error) {
        setError(result.error);
      } else {
        setGlobalStats(result.data);
      }
    } catch (err) {
      setError("Error cargando estadísticas globales");
      console.error("Error:", err);
    }
  };

  // Cargar estadísticas del usuario
  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      const result = await StatsService.getUserStats(user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setUserStats(result.data);
      }
    } catch (err) {
      setError("Error cargando estadísticas del usuario");
      console.error("Error:", err);
    }
  };

  // Cargar inversiones del usuario
  const loadUserInvestments = async () => {
    if (!user?.id) return;

    try {
      const result = await InvestmentService.getUserInvestments(user.id, 10);
      if (result.error) {
        setError(result.error);
      } else {
        setUserInvestments(result.data);
      }
    } catch (err) {
      setError("Error cargando inversiones del usuario");
      console.error("Error:", err);
    }
  };

  // Crear nueva inversión
  const createInvestment = async (investmentData) => {
    if (!user?.id) {
      return { data: null, error: "Usuario no autenticado" };
    }

    try {
      const result = await InvestmentService.createInvestment({
        ...investmentData,
        user_id: user.id,
      });

      if (result.data && !result.error) {
        // Recargar datos después de crear la inversión
        await loadUserStats();
        await loadUserInvestments();
        await loadGlobalStats();
      }

      return result;
    } catch (err) {
      console.error("Error creando inversión:", err);
      return { data: null, error: "Error creando inversión" };
    }
  };

  // Actualizar inversión
  const updateInvestment = async (investmentId, updates) => {
    try {
      const result = await InvestmentService.updateInvestment(
        investmentId,
        updates,
      );

      if (result.data && !result.error) {
        // Recargar datos después de actualizar
        await loadUserInvestments();
        await loadUserStats();
      }

      return result;
    } catch (err) {
      console.error("Error actualizando inversión:", err);
      return { data: null, error: "Error actualizando inversión" };
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadGlobalStats(),
        user?.id ? loadUserStats() : Promise.resolve(),
        user?.id ? loadUserInvestments() : Promise.resolve(),
      ]);
    } catch (err) {
      setError("Error cargando datos");
      console.error("Error loading all data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // loadAllData se omite intencionalmente para evitar ciclos infinitos

  // Efecto para suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    // Suscribirse a cambios en inversiones
    const subscription = InvestmentService.subscribeToInvestments(
      user.id,
      (payload) => {
        // Recargar datos cuando hay cambios
        loadUserInvestments();
        loadUserStats();
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user?.id]);

  // Refrescar datos manualmente
  const refreshData = async () => {
    await loadAllData();
  };

  return {
    // Estados
    globalStats,
    userStats,
    userInvestments,
    loading,
    error,

    // Acciones
    createInvestment,
    updateInvestment,
    refreshData,

    // Funciones de carga
    loadGlobalStats,
    loadUserStats,
    loadUserInvestments,
  };
};

export default useSupabaseData;
