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
    { id: 1, title: 'Página Principal', icon: 'home-outline' },
    { id: 2, title: 'VIP', icon: 'star-outline' },
    { id: 3, title: 'Centro de Inversiones', icon: 'trophy-outline', hasArrow: true },
    { id: 4, title: 'Centro de Agentes', icon: 'people-outline' },
    { id: 5, title: 'Sala de Eventos', icon: 'calendar-outline' },
    { id: 6, title: 'Mi Cuenta', icon: 'person-outline', hasArrow: true },
    { id: 7, title: 'Centro de Ayuda', icon: 'help-circle-outline' },
    { id: 8, title: 'Acerca de CDE', icon: 'information-circle-outline' },
        { id: 9, title: 'Partner', icon: 'people-circle-outline' },
    { id: 10, title: 'Limpiar Caché', icon: 'refresh-outline' },
    { id: 11, title: 'Descargar App CDE', icon: 'download-outline' },
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

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color="#374151" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.hasArrow && (
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
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
});

export default ProfileScreen;