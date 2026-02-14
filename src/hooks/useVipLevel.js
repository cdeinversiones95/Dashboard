import { useMemo } from "react";
import { useWallet } from "./useWallet";

/**
 * Niveles VIP basados en depósitos acumulativos
 * Los retiros NO afectan el nivel VIP
 */
const VIP_LEVELS = [
  {
    level: 0,
    name: "Básico",
    minDeposit: 0,
    minBalancePercent: 0.38,
    icon: "shield-outline",
    color: "#6b7280",
    gradientColors: ["#6b7280", "#4b5563"],
    benefits: ["Acceso básico a inversiones"],
    badge: "🥉",
  },
  {
    level: 1,
    name: "VIP 1",
    minDeposit: 15000,
    minBalancePercent: 0.32,
    icon: "star-outline",
    color: "#3b82f6",
    gradientColors: ["#3b82f6", "#2563eb"],
    benefits: ["Acceso básico a inversiones", "Soporte prioritario"],
    badge: "⭐",
  },
  {
    level: 2,
    name: "VIP 2",
    minDeposit: 35000,
    minBalancePercent: 0.26,
    icon: "star-half-outline",
    color: "#8b5cf6",
    gradientColors: ["#8b5cf6", "#7c3aed"],
    benefits: ["Todo de VIP 1", "Comisiones mejoradas", "Ofertas exclusivas"],
    badge: "🌟",
  },
  {
    level: 3,
    name: "VIP 3",
    minDeposit: 60000,
    minBalancePercent: 0.2,
    icon: "star",
    color: "#f59e0b",
    gradientColors: ["#f59e0b", "#d97706"],
    benefits: ["Todo de VIP 2", "Retiros prioritarios", "Asesor dedicado"],
    badge: "💫",
  },
  {
    level: 4,
    name: "VIP 4",
    minDeposit: 100000,
    minBalancePercent: 0.15,
    icon: "diamond",
    color: "#ef4444",
    gradientColors: ["#ef4444", "#dc2626"],
    benefits: [
      "Todo de VIP 3",
      "Beneficios máximos",
      "Acceso exclusivo a eventos",
    ],
    badge: "💎",
  },
];

/**
 * Hook para obtener el nivel VIP del usuario
 * Basado en depósitos acumulativos (independiente de retiros)
 */
export const useVipLevel = () => {
  const { getTotalDeposited, wallet, balance, loading } = useWallet();

  const vipData = useMemo(() => {
    // Usar total_deposited del wallet (campo en BD) o calcular desde transacciones
    const totalDeposited = wallet?.total_deposited || getTotalDeposited() || 0;

    // Determinar nivel actual
    let currentLevel = VIP_LEVELS[0];
    for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
      if (totalDeposited >= VIP_LEVELS[i].minDeposit) {
        currentLevel = VIP_LEVELS[i];
        break;
      }
    }

    // Determinar siguiente nivel
    const nextLevel =
      currentLevel.level < 4 ? VIP_LEVELS[currentLevel.level + 1] : null;

    // Calcular progreso hacia el siguiente nivel
    const progress = nextLevel
      ? Math.min(
          ((totalDeposited - currentLevel.minDeposit) /
            (nextLevel.minDeposit - currentLevel.minDeposit)) *
            100,
          100,
        )
      : 100;

    // Cuánto falta para el siguiente nivel
    const amountToNext = nextLevel
      ? Math.max(nextLevel.minDeposit - totalDeposited, 0)
      : 0;

    // REGLA: El % de balance mínimo depende del nivel VIP
    // A mayor nivel, menor % obligatorio → puede retirar más
    const minBalancePercent = currentLevel.minBalancePercent;
    const minBalanceByPercent = totalDeposited * minBalancePercent;
    const currentBalance = balance || 0;

    // PROTECCIÓN ABSOLUTA: La billetera NUNCA puede quedar en 0
    // Si no se puede calcular el depósito, usar el balance actual como base
    const effectiveDeposited =
      totalDeposited > 0 ? totalDeposited : currentBalance;
    const minByPercent = effectiveDeposited * minBalancePercent;
    // Mínimo absoluto: nunca menos de 1 peso si hay balance
    const minBalanceRequired =
      currentBalance > 0 ? Math.max(minByPercent, 1) : 0;

    // Máximo retirable = balance actual - mínimo obligatorio en cuenta
    // Si el balance ya está por debajo del mínimo, no puede retirar nada
    const maxWithdrawal = Math.max(currentBalance - minBalanceRequired, 0);

    return {
      currentLevel,
      nextLevel,
      totalDeposited,
      progress,
      amountToNext,
      isMaxLevel: currentLevel.level === 4,
      minBalancePercent,
      minBalanceRequired,
      maxWithdrawal,
    };
  }, [wallet?.total_deposited, getTotalDeposited, balance]);

  return {
    ...vipData,
    loading,
    allLevels: VIP_LEVELS,
  };
};

export { VIP_LEVELS };
export default useVipLevel;
