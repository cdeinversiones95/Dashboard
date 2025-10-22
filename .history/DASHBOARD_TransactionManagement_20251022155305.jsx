// ============================================================================
// COMPONENTE PARA DASHBOARD - GESTIÓN DE TRANSACCIONES
// Archivo: pages/transactions.jsx o components/TransactionManagement.jsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (usa tus credenciales)
const supabase = createClient(
  'https://qoysbxeqxngdqfgbljdm.supabase.co',
  'TU_SUPABASE_KEY_AQUI' // Reemplaza con tu clave
);

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState({
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    monto_aprobado: 0,
    monto_pendiente: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pending_deposits')
        .select(`
          *,
          user_profiles!user_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_stats');
      if (!error && data) {
        setStats(data[0] || stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (depositId) => {
    if (!confirm('¿Estás seguro de aprobar esta recarga?')) return;

    try {
      const { data, error } = await supabase.rpc('approve_deposit', {
        deposit_id: depositId,
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ Recarga aprobada! Nuevo balance: RD$${data.new_balance}`);
        fetchTransactions();
        fetchStats();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error al aprobar la recarga');
    }
  };

  const handleReject = async (depositId) => {
    const reason = prompt('¿Motivo del rechazo? (opcional)');
    if (reason === null) return; // Usuario canceló

    try {
      const { data, error } = await supabase.rpc('reject_deposit', {
        deposit_id: depositId,
        rejection_reason: reason || null,
      });

      if (error) throw error;

      if (data.success) {
        alert('❌ Recarga rechazada');
        fetchTransactions();
        fetchStats();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error al rechazar la recarga');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: '⏳ En Proceso',
      approved: '✅ Aprobada',
      rejected: '❌ Rechazada',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 Gestión de Transacciones
          </h1>
          <p className="text-gray-600">
            Administra las solicitudes de recarga de los usuarios
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Aprobadas Hoy</p>
            <p className="text-2xl font-bold text-green-600">{stats.aprobadas || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Rechazadas Hoy</p>
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Monto Pendiente</p>
            <p className="text-xl font-bold text-yellow-600">
              RD${(stats.monto_pendiente || 0).toLocaleString('es-DO')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Monto Aprobado</p>
            <p className="text-xl font-bold text-green-600">
              RD${(stats.monto_aprobado || 0).toLocaleString('es-DO')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Pendientes
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Aprobadas
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ❌ Rechazadas
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Todas
            </button>
            <button
              onClick={fetchTransactions}
              className="ml-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando transacciones...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No hay transacciones para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Comprobante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.user_profiles?.name || 'Usuario'}
                          </p>
                          <p className="text-sm text-gray-500">ID: {transaction.user_id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-lg font-bold text-gray-900">
                          RD${transaction.amount.toLocaleString('es-DO')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {transaction.payment_method_type === 'bank_transfer'
                            ? '🏦 Transferencia'
                            : '💰 USDT'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 font-mono">
                          {transaction.payment_reference || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.proof_image_url ? (
                          <button
                            onClick={() => setSelectedImage(transaction.proof_image_url)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            📸 Ver Imagen
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin comprobante</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(transaction.status)}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString('es-DO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(transaction.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
                            >
                              ✅ Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(transaction.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                            >
                              ❌ Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-gray-300"
            >
              ✕ Cerrar
            </button>
            <img
              src={selectedImage}
              alt="Comprobante de pago"
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
