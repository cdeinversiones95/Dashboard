import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { supabase } from '../config/supabase';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getHorizontalPadding,
  getVerticalPadding,
  getSpacing,
  getBorderRadius,
  getIconSize,
  isSmallScreen,
} from '../utils/responsive';

const ProfileScreen = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth();
  const { 
    balance, 
    getFormattedBalance, 
    requestDeposit, 
    requestWithdrawal,
    loading: walletLoading 
  } = useWallet();

  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchRechargeHistory();
  }, [user]);

  const fetchRechargeHistory = async () => {
    if (!user) return;

    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRechargeHistory(data || []);
    } catch (error) {
      console.error('Error fetching recharge history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Aprobada',
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: 'checkmark-circle',
        };
      case 'pending':
        return {
          label: 'En Proceso',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: 'time',
        };
      case 'rejected':
        return {
          label: 'Rechazada',
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: 'close-circle',
        };
      default:
        return {
          label: 'En Proceso',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: 'help-circle',
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = () => {
    Alert.alert(
      '⚽ Cerrar Sesión',
      '¿Estás seguro de que quieres salir del campo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('👋 ¡Hasta luego!', 'Has salido del campo exitosamente');
            } catch (error) {
              Alert.alert('❌ Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { 
      id: 1, 
      title: 'Página Principal', 
      icon: 'home-outline',
      onPress: () => navigation.navigate('Home')
    },
    { 
      id: 2, 
      title: 'VIP', 
      icon: 'star-outline',
      onPress: () => Alert.alert('🌟 VIP', 'Próximamente disponible')
    },
    { 
      id: 3, 
      title: 'Centro de Inversiones', 
      icon: 'trophy-outline', 
      hasArrow: true,
      onPress: () => Alert.alert('🏆 Inversiones', 'Próximamente disponible')
    },
    { 
      id: 4, 
      title: 'Centro de Agentes', 
      icon: 'people-outline',
      onPress: () => Alert.alert('👥 Agentes', 'Próximamente disponible')
    },
    { 
      id: 5, 
      title: 'Sala de Eventos', 
      icon: 'calendar-outline',
      onPress: () => navigation.navigate('Events')
    },
    { 
      id: 6, 
      title: 'Mi Cuenta', 
      icon: 'person-outline', 
      hasArrow: true,
      onPress: () => Alert.alert('👤 Mi Cuenta', 'Ya estás en tu perfil')
    },
    { 
      id: 7, 
      title: 'Centro de Ayuda', 
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('❓ Ayuda', 'Contacta con soporte: soporte@cde.com')
    },
    { 
      id: 8, 
      title: 'Acerca de CDE', 
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('ℹ️ CDE INVERSIONES', 'Versión 1.0.0\nPlataforma de inversiones deportivas')
    },
    { 
      id: 9, 
      title: 'Partner', 
      icon: 'people-circle-outline',
      onPress: () => Alert.alert('🤝 Partner', 'Programa de socios próximamente')
    },
    { 
      id: 10, 
      title: 'Limpiar Caché', 
      icon: 'refresh-outline',
      onPress: () => Alert.alert('🔄 Caché Limpiada', 'La caché se ha limpiado exitosamente')
    },
    { 
      id: 11, 
      title: 'Descargar App CDE', 
      icon: 'download-outline',
      onPress: () => Alert.alert('📱 Descargar App', 'Ya estás usando la aplicación')
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.profileHeader}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>
                {userProfile?.name || userProfile?.display_name || user?.user_metadata?.name || 'Usuario'}
              </Text>
              <View style={styles.vipBadge}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={12} 
                  color="#10b981" 
                />
                <Text style={styles.vipText}>MIEMBRO</Text>
                <Ionicons name="star" size={12} color="#fbbf24" />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Balance Card */}
        <LinearGradient
          colors={['#3b82f6', '#1e40af']}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceAmount}>
            {walletLoading ? '...' : getFormattedBalance().replace('$', '')}
          </Text>
          <Text style={styles.balanceLabel}>Balance Disponible</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('RechargeMethod')}
            >
              <Text style={styles.actionButtonText}>Recargar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => {
                Alert.alert(
                  '💸 Solicitar Retiro',
                  'Esta función está conectada con el dashboard de administración. Las solicitudes de retiro son procesadas por el administrador.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.actionButtonText}>Retirar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Recharge History */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>📋 Historial de Recargas</Text>
            <TouchableOpacity onPress={fetchRechargeHistory}>
              <Ionicons name="refresh" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Cargando historial...</Text>
            </View>
          ) : rechargeHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No tienes recargas registradas</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('RechargeMethod')}
              >
                <Text style={styles.emptyButtonText}>Hacer primera recarga</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historyList}>
              {rechargeHistory.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                return (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={styles.historyAmount}>
                        <Text style={styles.historyAmountText}>
                          RD${item.amount.toLocaleString('es-DO')}
                        </Text>
                        <Text style={styles.historyDate}>
                          {formatDate(item.created_at)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <Ionicons 
                          name={statusInfo.icon} 
                          size={14} 
                          color={statusInfo.color} 
                        />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyDetails}>
                      <View style={styles.historyDetailRow}>
                        <Ionicons name="card-outline" size={14} color="#6b7280" />
                        <Text style={styles.historyDetailText}>
                          {item.payment_method_type === 'bank_transfer' ? 'Transferencia Bancaria' : 'USDT'}
                        </Text>
                      </View>
                      {item.payment_reference && (
                        <View style={styles.historyDetailRow}>
                          <Ionicons name="barcode-outline" size={14} color="#6b7280" />
                          <Text style={styles.historyDetailText}>
                            Ref: {item.payment_reference}
                          </Text>
                        </View>
                      )}
                      {item.proof_image_url && (
                        <View style={styles.historyDetailRow}>
                          <Ionicons name="image" size={14} color="#10b981" />
                          <Text style={[styles.historyDetailText, { color: '#10b981' }]}>
                            Comprobante adjunto
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color="#374151" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.hasArrow && (
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Language and Support */}
        <View style={styles.bottomSection}>
          <View style={styles.languageSelector}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>��</Text>
              <Text style={styles.languageText}>ES</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </View>
          
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportText}>Atención al Cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 60, // Padding superior controlado manualmente
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: getSpacing(1.25),
    paddingTop: getSpacing(1), // Reducir padding superior ya que el container controla la posición
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  vipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  bottomSection: {
    padding: 20,
    paddingBottom: 40,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagEmoji: {
    fontSize: 18,
  },
  languageText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  supportButton: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  supportText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: getSpacing(),
    borderRadius: getBorderRadius(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  signOutText: {
    fontSize: scaleFont(16),
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: getSpacing(0.5),
  },
  // History Section
  historySection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 15,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  historyAmount: {
    flex: 1,
  },
  historyAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDetails: {
    gap: 6,
  },
  historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ProfileScreen;