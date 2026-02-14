/**
 * Funciones de formato compartidas para toda la app.
 * Centraliza formatDate, formatTime, formatCurrency para evitar duplicación.
 */

/**
 * Formatea una fecha en formato DD/MM/YYYY HH:mm
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea una fecha con hora incluida DD/MM/YYYY HH:mm
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formatea hora en formato HH:mm
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formatea un timer de countdown en MM:SS
 * @param {number} seconds - Segundos restantes
 * @returns {string}
 */
export const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Formatea un monto como moneda dominicana RD$X,XXX.XX
 * @param {number|string} amount - Monto a formatear
 * @param {object} options
 * @param {boolean} options.showPrefix - Mostrar prefijo RD$ (default: true)
 * @param {number} options.minDecimals - Mínimo de decimales (default: 0)
 * @param {number} options.maxDecimals - Máximo de decimales (default: 2)
 * @returns {string}
 */
export const formatCurrency = (amount, options = {}) => {
  const { showPrefix = true, minDecimals = 0, maxDecimals = 2 } = options;

  const parsedAmount = parseFloat(amount || 0);
  const formatted = parsedAmount.toLocaleString("es-DO", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  return showPrefix ? `RD$${formatted}` : formatted;
};

/**
 * Formatea un monto con 2 decimales fijos (para balances)
 * @param {number|string} amount
 * @returns {string}
 */
export const formatBalance = (amount) => {
  return formatCurrency(amount, { minDecimals: 2, maxDecimals: 2 });
};
