/**
 * Helpers compartidos para estados de transacciones, apuestas, depósitos y retiros.
 * Evita duplicar getStatusInfo / getStatusColor en cada pantalla.
 */

/**
 * Info de estado para depósitos/recargas (ProfileScreen, PaymentInstructions)
 * @param {'pending'|'approved'|'rejected'} status
 * @returns {{ label: string, color: string, bgColor: string, icon: string }}
 */
export const getDepositStatusInfo = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Aprobada ✅",
        color: "#10b981",
        bgColor: "#d1fae5",
        icon: "checkmark-circle",
      };
    case "pending":
      return {
        label: "En Proceso ⏳",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        icon: "time",
      };
    case "rejected":
      return {
        label: "Rechazada ❌",
        color: "#ef4444",
        bgColor: "#fee2e2",
        icon: "close-circle",
      };
    default:
      return {
        label: "Desconocido ❓",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        icon: "help-circle",
      };
  }
};

/**
 * Info de estado para retiros (WithdrawalScreen)
 * @param {'pending'|'approved'|'paid'|'rejected'} status
 * @returns {{ label: string, color: string, bgColor: string, icon: string }}
 */
export const getWithdrawalStatusInfo = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Pendiente",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        icon: "time",
      };
    case "approved":
      return {
        label: "Aprobado",
        color: "#10b981",
        bgColor: "#d1fae5",
        icon: "checkmark-circle",
      };
    case "paid":
      return {
        label: "Pagado",
        color: "#8b5cf6",
        bgColor: "#ede9fe",
        icon: "card",
      };
    case "rejected":
      return {
        label: "Rechazado",
        color: "#ef4444",
        bgColor: "#fee2e2",
        icon: "close-circle",
      };
    default:
      return {
        label: "En Proceso",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        icon: "help-circle",
      };
  }
};

/**
 * Color de estado para apuestas (MyBetsScreen)
 * @param {'pending'|'won'|'lost'|'cancelled'} status
 * @returns {string} Color hex
 */
export const getBetStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "#FFA500";
    case "won":
      return "#00FF00";
    case "lost":
      return "#FF0000";
    case "cancelled":
      return "#808080";
    default:
      return "#FFA500";
  }
};

/**
 * Texto legible para estado de apuesta
 * @param {'pending'|'won'|'lost'|'cancelled'} status
 * @returns {string}
 */
export const getBetStatusText = (status) => {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "won":
      return "Ganada";
    case "lost":
      return "Perdida";
    case "cancelled":
      return "Cancelada";
    default:
      return "Pendiente";
  }
};

/**
 * Texto legible para método de pago
 * @param {string} paymentMethod
 * @returns {string}
 */
export const getPaymentMethodText = (paymentMethod) => {
  if (!paymentMethod) return "Método no especificado";

  switch (paymentMethod.toLowerCase()) {
    case "bank_transfer":
      return "🏦 Transferencia Bancaria";
    case "usdt":
      return "💎 USDT (Criptomoneda)";
    case "cash":
      return "💵 Efectivo";
    default:
      return `💳 ${paymentMethod}`;
  }
};
