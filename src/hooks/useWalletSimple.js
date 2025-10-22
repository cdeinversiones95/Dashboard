import { useState, useEffect } from 'react';
import WalletServiceSimple from '../services/WalletServiceSimple';
import { supabase } from '../config/supabase';

/**
 * Hook simplificado para manejar la billetera
 */
export const useWalletSimple = () => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener usuario actual
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // Cargar datos de la billetera
  const loadWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await getCurrentUser();
      if (!user) return;

      // Obtener billetera
      const { wallet: walletData, error: walletError } = 
        await WalletServiceSimple.getUserWallet(user.id);
      
      if (walletError) throw new Error(walletError);
      
      setWallet(walletData);
      setBalance(walletData?.balance || 0);

      // Obtener transacciones recientes
      const { transactions: transData, error: transError } = 
        await WalletServiceSimple.getTransactionHistory(user.id, 5);
      
      if (transError) throw new Error(transError);
      
      setTransactions(transData);
    } catch (err) {
      console.error('Error cargando billetera:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Agregar dinero
  const addMoney = async (amount, description) => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const result = await WalletServiceSimple.addMoney(user.id, amount, description);
      
      if (result.error) throw new Error(result.error);
      
      // Recargar datos
      await loadWallet();
      
      return { success: true, newBalance: result.newBalance };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Retirar dinero
  const withdrawMoney = async (amount, description) => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const result = await WalletServiceSimple.withdrawMoney(user.id, amount, description);
      
      if (result.error) throw new Error(result.error);
      
      // Recargar datos
      await loadWallet();
      
      return { success: true, newBalance: result.newBalance };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Formatear balance
  const getFormattedBalance = () => {
    return WalletServiceSimple.formatBalance(balance);
  };

  // Cargar datos al montar
  useEffect(() => {
    loadWallet();
  }, []);

  return {
    // Estado
    wallet,
    balance,
    transactions,
    loading,
    error,
    
    // Acciones
    loadWallet,
    addMoney,
    withdrawMoney,
    
    // Utilidades
    getFormattedBalance,
    
    // Estado calculado
    hasBalance: balance > 0
  };
};