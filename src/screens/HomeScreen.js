import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StatsCard from '../components/StatsCard';
import TeamChart from '../components/TeamChart';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useWallet } from '../hooks/useWallet';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getHorizontalPadding,
  getVerticalPadding,
  getSpacing,
  getCardDimensions,
  getBorderRadius,
  isSmallScreen,
} from '../utils/responsive';

const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    globalStats, 
    userStats, 
    userInvestments, 
    loading, 
    error, 
    refreshData 
  } = useSupabaseData();
  
  // Hook para manejar billetera con balance real
  const {
    balance,
    getFormattedBalance,
    getTotalDeposited,
    getTotalWithdrawn,
    getTotalInvested,
    getTotalEarned,
    loading: walletLoading,
    refreshWallet
  } = useWallet();

  // Mostrar datos globales o del usuario según autenticación
  const stats = isAuthenticated ? userStats : globalStats;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || walletLoading}
            onRefresh={() => {
              refreshData();
              refreshWallet();
            }}
            colors={['#3b82f6']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="trending-up" size={24} color="#2563eb" />
            <Text style={styles.logoText}>CDE</Text>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount}>
              {isAuthenticated ? getFormattedBalance() : '$6.54'}
            </Text>
            <TouchableOpacity onPress={refreshWallet}>
              <Ionicons name="refresh" size={16} color="#10b981" />
            </TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={16} color="#2563eb" />
          </View>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards Grid */}
        {!loading && (
          <>
            <View style={styles.statsGrid}>
              <StatsCard
                title="Inversores primerizos"
                value={isAuthenticated ? 
                  (userStats?.total_investments || 0).toString() : 
                  (globalStats?.first_time_investors || 0).toString()
                }
                color="#10b981"
                icon="person-add"
              />
              <StatsCard
                title="Usuarios con retiros"
                value={isAuthenticated ? 
                  (userStats?.completed_investments || 0).toString() : 
                  (globalStats?.users_with_withdrawals || 0).toString()
                }
                color="#6366f1"
                icon="arrow-down"
              />
              <StatsCard
                title="Número de Traders"
                value={isAuthenticated ? 
                  (userStats?.active_investments || 0).toString() : 
                  (globalStats?.number_of_traders || 0).toString()
                }
                color="#f59e0b"
                icon="people"
              />
            </View>

            <View style={styles.statsRow}>
              <StatsCard
                title="Cantidad de Recarga"
                value={isAuthenticated ? 
                  `$${getTotalDeposited().toFixed(2)}` : 
                  `$${(globalStats?.total_deposits || 0).toFixed(2)}`
                }
                color="#10b981"
                icon="card"
              />
              <StatsCard
                title="Cantidad de Retiro"
                value={isAuthenticated ? 
                  `$${getTotalWithdrawn().toFixed(2)}` : 
                  `$${(globalStats?.total_withdrawals || 0).toFixed(2)}`
                }
                color="#dc2626"
                icon="cash"
              />
            </View>
          </>
        )}

        {/* Date Selector */}
        <TouchableOpacity style={styles.dateSelector}>
          <Text style={styles.dateSelectorText}>Seleccionar Fecha</Text>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
        </TouchableOpacity>

        {/* My Team Section */}
        <View style={styles.teamSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mi Equipo</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Ver Todo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.teamContainer}>
            <View style={styles.teamStats}>
              <View style={styles.teamLevel}>
                <View style={[styles.levelIndicator, { backgroundColor: '#06b6d4' }]} />
                <Text style={styles.levelText}>Nv.1 0 Personas</Text>
              </View>
              <View style={styles.teamLevel}>
                <View style={[styles.levelIndicator, { backgroundColor: '#ec4899' }]} />
                <Text style={styles.levelText}>Nv.2 0 Personas</Text>
              </View>
              <View style={styles.teamLevel}>
                <View style={[styles.levelIndicator, { backgroundColor: '#fbbf24' }]} />
                <Text style={styles.levelText}>Nv.3 0 Personas</Text>
              </View>
            </View>
            <TeamChart />
          </View>
        </View>

        {/* My Rebate Section */}
        <View style={styles.rebateSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Comisiones</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Ver Todo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rebateTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Usuario</Text>
              <Text style={styles.tableHeaderText}>Fecha</Text>
              <Text style={styles.tableHeaderText}>Cantidad</Text>
              <Text style={styles.tableHeaderText}>Estado</Text>
            </View>
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No Hay Más Datos</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Enlaces Patrocinados: https://cdeinversiones.com/...</Text>
          <Text style={styles.invitationText}>Código de Invitación: 21471622</Text>
          
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Copiar Enlace</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, styles.footerButtonSecondary]}>
              <Text style={styles.footerButtonText}>Copiar Código</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: 10, // Padding mínimo ya que el container controla la posición
    paddingBottom: 15, // Padding inferior moderado
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: scaleFont(isSmallScreen() ? 20 : 24),
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: getSpacing(0.5),
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: getBorderRadius(20),
    gap: getSpacing(0.5),
  },
  balanceAmount: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#2563eb',
  },
  loadingContainer: {
    padding: getSpacing(2),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: getSpacing(0.5),
    fontSize: scaleFont(14),
    color: '#6b7280',
  },
  errorContainer: {
    margin: getHorizontalPadding(),
    padding: getSpacing(),
    backgroundColor: '#fee2e2',
    borderRadius: getBorderRadius(8),
    alignItems: 'center',
  },
  errorText: {
    fontSize: scaleFont(14),
    color: '#dc2626',
    marginBottom: getSpacing(0.5),
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: getSpacing(),
    paddingVertical: getSpacing(0.5),
    borderRadius: getBorderRadius(6),
  },
  retryText: {
    color: '#ffffff',
    fontSize: scaleFont(12),
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#2563eb',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: getVerticalPadding(),
    gap: getSpacing(0.625),
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: getSpacing(0.625),
    gap: getSpacing(0.625),
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: getHorizontalPadding(),
    marginTop: getVerticalPadding(),
    padding: scaleWidth(15),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateSelectorText: {
    fontSize: scaleFont(16),
    color: '#6b7280',
  },
  teamSection: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: getVerticalPadding(),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563eb',
  },
  teamContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamStats: {
    flex: 1,
  },
  teamLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  levelText: {
    fontSize: 14,
    color: '#6b7280',
  },
  rebateSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  rebateTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  noDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  footer: {
    backgroundColor: '#1f2937',
    marginTop: 20,
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 5,
  },
  invitationText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 15,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonSecondary: {
    backgroundColor: '#6366f1',
  },
  footerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;