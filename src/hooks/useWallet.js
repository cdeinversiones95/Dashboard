import { useState, useEffect, useCallback } from 'react';
import WalletService from '../services/WalletService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para manejar la billetera del usuario
 * Proporciona balance en tiempo real y métodos para transacciones
 */
export const useWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();

  // =========================================
  // CARGAR DATOS DE BILLETERA
  // =========================================

  const loadWallet = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await WalletService.getUserWallet(user.id);
      
      if (result.error) {
        setError(result.error);
        console.error('Error cargando billetera:', result.error);
      } else {
        setWallet(result.data);
        setBalance(result.data?.balance || 0);
        setTransactions(result.data?.transactions || []);
      }
    } catch (err) {
      setError('Error cargando información de billetera');
      console.error('Error en loadWallet:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadBalance = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await WalletService.getUserBalance(user.id);
      
      if (result.error) {
        console.error('Error cargando balance:', result.error);
      } else {
        setBalance(result.data?.balance || 0);
      }
    } catch (err) {
      console.error('Error en loadBalance:', err);
    }
  }, [user?.id]);

  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await WalletService.getUserTransactions(user.id, 50);
      
      if (result.error) {
        console.error('Error cargando transacciones:', result.error);
      } else {
        setTransactions(result.data || []);
      }
    } catch (err) {
      console.error('Error en loadTransactions:', err);
    }
  }, [user?.id]);

  const loadPendingDeposits = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await WalletService.getUserPendingDeposits(user.id);
      
      if (result.error) {
        console.error('Error cargando depósitos pendientes:', result.error);
      } else {
        setPendingDeposits(result.data || []);
      }
    } catch (err) {
      console.error('Error en loadPendingDeposits:', err);
    }
  }, [user?.id]);

  const loadWithdrawals = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await WalletService.getUserWithdrawals(user.id);
      
      if (result.error) {
        console.error('Error cargando retiros:', result.error);
      } else {
        setWithdrawals(result.data || []);
      }
    } catch (err) {
      console.error('Error en loadWithdrawals:', err);
    }
  }, [user?.id]);

  // =========================================
  // MÉTODOS DE TRANSACCIONES
  // =========================================

  const requestDeposit = async (amount, paymentReference = '', paymentMethodType = 'bank_transfer') => {
    if (!user?.id) {
      return { error: 'Usuario no autenticado', data: null };
    }

    try {
      const result = await WalletService.requestDeposit(
        user.id, 
        amount, 
        null, 
        paymentReference,
        paymentMethodType
      );

      if (result.error) {
        setError(result.error);
        return { error: result.error, data: null };
      }

      // Recargar depósitos pendientes
      await loadPendingDeposits();
      
      return { error: null, data: result.data };
    } catch (err) {
      const errorMsg = 'Error solicitando depósito';
      setError(errorMsg);
      console.error('Error en requestDeposit:', err);
      return { error: errorMsg, data: null };
    }
  };

  const requestWithdrawal = async (amount, paymentDetails, paymentMethodType = 'bank_transfer') => {
    if (!user?.id) {
      return { error: 'Usuario no autenticado', data: null };
    }

    try {
      const result = await WalletService.requestWithdrawal(
        user.id,
        amount,
        paymentDetails,
        paymentMethodType
      );

      if (result.error) {
        setError(result.error);
        return { error: result.error, data: null };
      }

      // Recargar datos
      await loadWithdrawals();
      await loadBalance();
      
      return { error: null, data: result.data };
    } catch (err) {
      const errorMsg = 'Error solicitando retiro';
      setError(errorMsg);
      console.error('Error en requestWithdrawal:', err);
      return { error: errorMsg, data: null };
    }
  };

  // =========================================
  // MÉTODOS DE ACTUALIZACIÓN
  // =========================================

  const refreshWallet = useCallback(async () => {
    await loadWallet();
    await loadPendingDeposits();
    await loadWithdrawals();
  }, [loadWallet, loadPendingDeposits, loadWithdrawals]);

  const refreshBalance = useCallback(async () => {
    await loadBalance();
  }, [loadBalance]);

  // =========================================
  // EFECTOS
  // =========================================

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      loadWallet();
      loadPendingDeposits();
      loadWithdrawals();
    }
  }, [user?.id]);

  // Auto-refresh del balance cada 30 segundos
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      if (user?.id) {
        loadBalance();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user?.id]); // Removido loadBalance para evitar ciclos infinitos

  // =========================================
  // HELPERS Y GETTERS
  // =========================================

  // ✅ Formatear balance como pesos dominicanos
  const getFormattedBalance = (amount = balance) => {
    const parsedAmount = parseFloat(amount || 0);
    return `RD$${parsedAmount.toLocaleString('es-DO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getTransactionsByType = (type) => {
    return transactions.filter(transaction => transaction.transaction_type === type);
  };

  const getTotalDeposited = () => {
    // Calcular total de depósitos basado en transacciones
    const depositTransactions = transactions.filter(transaction => {
      const type = transaction.transaction_type;
      return type === 'deposit' || 
             type === 'bank_transfer' ||
             type === 'usdt_transfer' ||
             type === 'recharge' ||
             type === 'top_up';
    });
    
    const total = depositTransactions.reduce((total, transaction) => {
      return total + parseFloat(transaction.amount || 0);
    }, 0);
    
    return total;
  };

  const getTotalWithdrawn = () => {
    // Calcular total de retiros basado en transacciones
    const withdrawalTransactions = transactions.filter(transaction => {
      const type = transaction.transaction_type;
      return type === 'withdrawal' || 
             type === 'withdraw' ||
             type === 'cash_out' ||
             type === 'payout';
    });
    
    const total = withdrawalTransactions.reduce((total, transaction) => {
      return total + parseFloat(transaction.amount || 0);
    }, 0);
    
    return total;
  };

  const getTotalInvested = () => {
    return wallet?.total_invested || 0;
  };

  const getTotalEarned = () => {
    return wallet?.total_earned || 0;
  };

  const getPendingDepositsTotal = () => {
    return pendingDeposits
      .filter(deposit => deposit.status === 'pending')
      .reduce((total, deposit) => total + (deposit.amount || 0), 0);
  };

  const getPendingWithdrawalsTotal = () => {
    return withdrawals
      .filter(withdrawal => withdrawal.status === 'pending')
      .reduce((total, withdrawal) => total + (withdrawal.amount || 0), 0);
  };

  // =========================================
  // RETURN
  // =========================================

  return {
    // Estado
    wallet,
    balance,
    transactions,
    pendingDeposits,
    withdrawals,
    loading,
    error,

    // Métodos de carga
    refreshWallet,
    refreshBalance,
    loadTransactions,

    // Métodos de transacciones
    requestDeposit,
    requestWithdrawal,

    // Helpers
    getFormattedBalance,
    getTransactionsByType,
    getTotalDeposited,
    getTotalWithdrawn,
    getTotalInvested,
    getTotalEarned,
    getPendingDepositsTotal,
    getPendingWithdrawalsTotal,

    // Estados calculados
    hasBalance: balance > 0,
    hasPendingDeposits: pendingDeposits.some(d => d.status === 'pending'),
    hasPendingWithdrawals: withdrawals.some(w => w.status === 'pending'),
    isWalletActive: wallet?.status === 'active'
  };
};