import { supabase } from '../config/supabase';

/**
 * WalletService Simplificado - Solo lo esencial para billetera
 */
class WalletServiceSimple {
  
  // =========================================
  // MÉTODOS ESENCIALES DE BILLETERA
  // =========================================

  /**
   * Obtener billetera del usuario
   */
  async getUserWallet(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { wallet: data, error: null };
    } catch (error) {
      console.error('Error obteniendo billetera:', error);
      return { wallet: null, error: error.message };
    }
  }

  /**
   * Obtener balance del usuario
   */
  async getUserBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { balance: data.balance, error: null };
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      return { balance: 0, error: error.message };
    }
  }

  /**
   * Crear transacción simple
   */
  async createTransaction(userId, walletId, type, amount, description = '') {
    try {
      // Obtener balance actual
      const { balance: currentBalance } = await this.getUserBalance(userId);
      
      let newBalance;
      if (type === 'deposit' || type === 'bonus') {
        newBalance = parseFloat(currentBalance) + parseFloat(amount);
      } else if (type === 'withdrawal') {
        if (parseFloat(currentBalance) < parseFloat(amount)) {
          throw new Error('Saldo insuficiente');
        }
        newBalance = parseFloat(currentBalance) - parseFloat(amount);
      }

      // Crear transacción
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          transaction_type: type,
          amount: parseFloat(amount),
          balance_after: newBalance,
          description,
          status: 'completed'
        })
        .select()
        .single();

      if (transError) throw transError;

      // Actualizar balance en billetera
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          total_deposited: type === 'deposit' ? supabase.sql`total_deposited + ${amount}` : undefined,
          total_withdrawn: type === 'withdrawal' ? supabase.sql`total_withdrawn + ${amount}` : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { 
        transaction, 
        newBalance: newBalance, 
        error: null 
      };
    } catch (error) {
      console.error('Error creando transacción:', error);
      return { transaction: null, newBalance: null, error: error.message };
    }
  }

  /**
   * Agregar dinero a la billetera
   */
  async addMoney(userId, amount, description = 'Depósito manual') {
    const { wallet } = await this.getUserWallet(userId);
    if (!wallet) throw new Error('Billetera no encontrada');
    
    return await this.createTransaction(userId, wallet.id, 'deposit', amount, description);
  }

  /**
   * Retirar dinero de la billetera
   */
  async withdrawMoney(userId, amount, description = 'Retiro manual') {
    const { wallet } = await this.getUserWallet(userId);
    if (!wallet) throw new Error('Billetera no encontrada');
    
    return await this.createTransaction(userId, wallet.id, 'withdrawal', amount, description);
  }

  /**
   * Obtener historial de transacciones
   */
  async getTransactionHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { transactions: data, error: null };
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      return { transactions: [], error: error.message };
    }
  }

  /**
   * Formatear balance para mostrar
   */
  formatBalance(balance) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(balance || 0);
  }
}

export default new WalletServiceSimple();