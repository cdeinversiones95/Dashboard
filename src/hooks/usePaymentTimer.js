import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";

/**
 * Hook compartido para el countdown timer de pagos.
 * Usado en PaymentInstructionsScreen y USDTPaymentInstructionsScreen.
 *
 * @param {object} options
 * @param {number} options.duration - Duración en segundos (default: 3600 = 60min)
 * @param {function} options.onExpire - Callback al expirar el timer
 * @returns {{ timeRemaining: number, formatTime: function, getTimeColor: function }}
 */
export const usePaymentTimer = ({ duration = 3600, onExpire } = {}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const onExpireRef = useRef(onExpire);

  // Mantener ref actualizada sin causar re-suscripciones
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds = timeRemaining) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 1800) return "#10b981"; // Verde > 30 min
    if (timeRemaining > 600) return "#f59e0b"; // Amarillo > 10 min
    return "#ef4444"; // Rojo < 10 min
  };

  return {
    timeRemaining,
    formatTime,
    getTimeColor,
  };
};
