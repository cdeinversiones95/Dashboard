import { supabase } from '../config/supabase';

/**
 * WalletService - Maneja todas las operaciones de billetera y transacciones
 * Conecta la app móvil con la base de datos para manejar montos reales
 */
class WalletService {
  
  // =========================================
  // MÉTODOS DE BILLETERA
  // =========================================

  /**
   * Obtener información completa de la billetera del usuario
   */
  async getUserWallet(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          transactions:transactions(
            id,
            transaction_type,
            amount,
            status,
            description,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo billetera:', error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en getUserWallet:', err);
      return { error: 'Error obteniendo información de billetera', data: null };
    }
  }

  /**
   * Obtener solo el balance actual del usuario
   */
  async getUserBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance, currency')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo balance:', error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en getUserBalance:', err);
      return { error: 'Error obteniendo balance', data: null };
    }
  }

  /**
   * Crear billetera para nuevo usuario (llamado automáticamente por trigger)
   */
  async createWallet(userId, currency = 'USD') {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{
          user_id: userId,
          balance: 0.00,
          currency: currency,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creando billetera:', error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en createWallet:', err);
      return { error: 'Error creando billetera', data: null };
    }
  }

  // =========================================
  // MÉTODOS DE TRANSACCIONES
  // =========================================

  /**
   * Obtener historial de transacciones del usuario
   */
  async getUserTransactions(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error obteniendo transacciones:', error);
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getUserTransactions:', err);
      return { error: 'Error obteniendo transacciones', data: null };
    }
  }

  /**
   * Crear nueva transacción
   * IMPORTANTE: Este método debe ser usado solo por el sistema/admin
   */
  async createTransaction(userId, walletId, transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          wallet_id: walletId,
          transaction_type: transactionData.type,
          amount: parseFloat(transactionData.amount),
          balance_after: parseFloat(transactionData.balanceAfter),
          currency: transactionData.currency || 'USD',
          status: transactionData.status || 'completed',
          description: transactionData.description,
          reference_id: transactionData.referenceId,
          metadata: transactionData.metadata || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creando transacción:', error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en createTransaction:', err);
      return { error: 'Error creando transacción', data: null };
    }
  }

  // =========================================
  // MÉTODOS DE DEPÓSITOS
  // =========================================

  /**
   * Solicitar depósito (pendiente de aprobación admin)
   */
  async requestDeposit(userId, amount, paymentMethodId = null, paymentReference = '') {
    try {
      const { data, error } = await supabase
        .from('pending_deposits')
        .insert([{
          user_id: userId,
          amount: parseFloat(amount),
          payment_method_id: paymentMethodId,
          payment_reference: paymentReference,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error solicitando depósito:', error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en requestDeposit:', err);
      return { error: 'Error solicitando depósito', data: null };
    }
  }

  /**
   * Obtener depósitos pendientes del usuario
   */
  async getUserPendingDeposits(userId) {
    try {
      const { data, error } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo depósitos pendientes:', error);
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getUserPendingDeposits:', err);
      return { error: 'Error obteniendo depósitos pendientes', data: null };
    }
  }

  // =========================================
  // MÉTODOS DE RETIROS
  // =========================================

  /**
   * Solicitar retiro
   */
  async requestWithdrawal(userId, walletId, amount, paymentMethodId = null, userNotes = '') {
    try {
      // Primero verificar balance suficiente
      const walletResult = await this.getUserWallet(userId);
      if (walletResult.error) {
        return { error: 'Error verificando balance', data: null };
      }

      const currentBalance = walletResult.data.balance;
      if (currentBalance < amount) {
        return { error: 'Balance insuficiente para retiro', data: null };
      }

      // Calcular fee (ejemplo: 2% del monto)
      const fee = amount * 0.02;
      const netAmount = amount - fee;

      const { data, error } = await supabase
        .from('withdrawals')
        .insert([{
          user_id: userId,
          wallet_id: walletId,
          amount: parseFloat(amount),
          fee: parseFloat(fee),
          net_amount: parseFloat(netAmount),
          payment_method_id: paymentMethodId,
          user_notes: userNotes,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error solicitando retiro:', error);
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en requestWithdrawal:', err);
      return { error: 'Error solicitando retiro', data: null };
    }
  }

  /**
   * Obtener retiros del usuario
   */
  async getUserWithdrawals(userId) {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo retiros:', error);
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getUserWithdrawals:', err);
      return { error: 'Error obteniendo retiros', data: null };
    }
  }

  // =========================================
  // MÉTODOS ADMINISTRATIVOS (Para Dashboard)
  // =========================================

  /**
   * Aprobar depósito pendiente (solo admin)
   */
  async approveDeposit(depositId, adminId, adminNotes = '') {
    try {
      // Obtener información del depósito
      const { data: deposit, error: depositError } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      if (depositError) {
        return { error: 'Depósito no encontrado', data: null };
      }

      // Obtener billetera del usuario
      const walletResult = await this.getUserWallet(deposit.user_id);
      if (walletResult.error) {
        return { error: 'Error obteniendo billetera', data: null };
      }

      const wallet = walletResult.data;
      const newBalance = wallet.balance + deposit.amount;

      // Actualizar balance en billetera
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          total_deposited: wallet.total_deposited + deposit.amount
        })
        .eq('id', wallet.id);

      if (walletUpdateError) {
        return { error: 'Error actualizando balance', data: null };
      }

      // Crear transacción
      await this.createTransaction(deposit.user_id, wallet.id, {
        type: 'deposit',
        amount: deposit.amount,
        balanceAfter: newBalance,
        description: `Depósito aprobado - ${adminNotes}`,
        referenceId: depositId
      });

      // Marcar depósito como aprobado
      const { data, error } = await supabase
        .from('pending_deposits')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', depositId)
        .select()
        .single();

      if (error) {
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en approveDeposit:', err);
      return { error: 'Error aprobando depósito', data: null };
    }
  }

  /**
   * Rechazar depósito pendiente (solo admin)
   */
  async rejectDeposit(depositId, adminId, adminNotes = '') {
    try {
      const { data, error } = await supabase
        .from('pending_deposits')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', depositId)
        .select()
        .single();

      if (error) {
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en rejectDeposit:', err);
      return { error: 'Error rechazando depósito', data: null };
    }
  }

  /**
   * Procesar retiro (solo admin)
   */
  async processWithdrawal(withdrawalId, adminId, status = 'completed', adminNotes = '') {
    try {
      // Obtener información del retiro
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError) {
        return { error: 'Retiro no encontrado', data: null };
      }

      // Si se está completando el retiro, actualizar balance
      if (status === 'completed') {
        const walletResult = await this.getUserWallet(withdrawal.user_id);
        if (walletResult.error) {
          return { error: 'Error obteniendo billetera', data: null };
        }

        const wallet = walletResult.data;
        const newBalance = wallet.balance - withdrawal.amount;

        // Actualizar balance
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({ 
            balance: newBalance,
            total_withdrawn: wallet.total_withdrawn + withdrawal.net_amount
          })
          .eq('id', wallet.id);

        if (walletUpdateError) {
          return { error: 'Error actualizando balance', data: null };
        }

        // Crear transacción
        await this.createTransaction(withdrawal.user_id, wallet.id, {
          type: 'withdrawal',
          amount: withdrawal.amount,
          balanceAfter: newBalance,
          description: `Retiro procesado - ${adminNotes}`,
          referenceId: withdrawalId
        });
      }

      // Actualizar estado del retiro
      const { data, error } = await supabase
        .from('withdrawals')
        .update({
          status: status,
          processed_by: adminId,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', withdrawalId)
        .select()
        .single();

      if (error) {
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en processWithdrawal:', err);
      return { error: 'Error procesando retiro', data: null };
    }
  }

  // =========================================
  // MÉTODOS DE ESTADÍSTICAS (Para Dashboard)
  // =========================================

  /**
   * Obtener estadísticas globales de billeteras
   */
  async getGlobalWalletStats() {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          balance,
          total_deposited,
          total_withdrawn,
          total_invested,
          total_earned
        `);

      if (error) {
        return { error: error.message, data: null };
      }

      // Calcular totales
      const stats = data.reduce((acc, wallet) => {
        acc.totalBalance += wallet.balance || 0;
        acc.totalDeposited += wallet.total_deposited || 0;
        acc.totalWithdrawn += wallet.total_withdrawn || 0;
        acc.totalInvested += wallet.total_invested || 0;
        acc.totalEarned += wallet.total_earned || 0;
        acc.totalUsers += 1;
        return acc;
      }, {
        totalBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalInvested: 0,
        totalEarned: 0,
        totalUsers: 0
      });

      return { data: stats, error: null };
    } catch (err) {
      console.error('Error en getGlobalWalletStats:', err);
      return { error: 'Error obteniendo estadísticas globales', data: null };
    }
  }

  /**
   * Obtener todos los depósitos pendientes (para admin dashboard)
   */
  async getAllPendingDeposits() {
    try {
      const { data, error } = await supabase
        .from('pending_deposits')
        .select(`
          *,
          users:user_id (
            phone,
            raw_user_meta_data
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getAllPendingDeposits:', err);
      return { error: 'Error obteniendo depósitos pendientes', data: null };
    }
  }

  /**
   * Obtener todos los retiros pendientes (para admin dashboard)
   */
  async getAllPendingWithdrawals() {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users:user_id (
            phone,
            raw_user_meta_data
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message, data: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getAllPendingWithdrawals:', err);
      return { error: 'Error obteniendo retiros pendientes', data: null };
    }
  }
}

export default new WalletService();