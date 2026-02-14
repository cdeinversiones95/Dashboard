import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import StatsCard from "../components/StatsCard";
import { HomeStatsSkeleton } from "../components/SkeletonLoader";
import TeamChart from "../components/TeamChart";
import { useAuth } from "../contexts/AuthContext";
import { useSupabaseData } from "../hooks/useSupabaseData";
import { useWallet } from "../hooks/useWallet";
import { useVipLevel } from "../hooks/useVipLevel";
import AuthService from "../services/AuthService";
import ReferralService from "../services/ReferralService";
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
  useSafeArea,
  getSafeBottomPadding,
  getSafeContainerStyle,
} from "../utils/responsive";

const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [invitationCode, setInvitationCode] = useState("Cargando...");
  const [referralTeam, setReferralTeam] = useState({
    level1: 0,
    level2: 0,
    level3: 0,
    total: 0,
  });
  const [agentLevel, setAgentLevel] = useState(
    ReferralService.getReferralLevel(0),
  );
  const [referralActivity, setReferralActivity] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const {
    globalStats,
    userStats,
    userInvestments,
    loading,
    error,
    refreshData,
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
    refreshWallet,
  } = useWallet();

  // Hook para VIP
  const {
    currentLevel: vipLevel,
    progress: vipProgress,
    nextLevel,
    amountToNext,
    isMaxLevel,
  } = useVipLevel();

  // Hook para SafeArea
  const insets = useSafeArea();

  const stats = isAuthenticated ? userStats : globalStats;

  useEffect(() => {
    const fetchInvitationCode = async () => {
      if (user?.id) {
        // Usar el nuevo método que asegura que exista un código (lo genera si no existe)
        const code = await AuthService.ensureInvitationCode(user.id);
        if (code) {
          setInvitationCode(code);
        } else {
          setInvitationCode("No disponible");
        }
      } else if (!isAuthenticated) {
        setInvitationCode("Inicia Sesión");
      }
    };
    fetchInvitationCode();
  }, [user, isAuthenticated]);

  // Cargar datos reales de referidos
  useEffect(() => {
    const loadReferralData = async () => {
      if (user?.id && isAuthenticated) {
        try {
          const [team, activity, commData] = await Promise.all([
            ReferralService.getReferralTeam(user.id),
            ReferralService.getReferralActivity(user.id, 10),
            ReferralService.getCommissions(user.id, 20),
          ]);
          setReferralTeam(team);
          setAgentLevel(ReferralService.getReferralLevel(team.level1));
          setReferralActivity(activity);
          setCommissions(commData.commissions);
          setTotalCommissions(commData.totalEarned);
        } catch (err) {
          console.error("Error cargando datos de referidos:", err);
        }
      }
    };
    loadReferralData();
  }, [user, isAuthenticated]);

  const shareInvitationCode = async () => {
    if (
      !invitationCode ||
      invitationCode === "Cargando..." ||
      invitationCode === "No disponible"
    ) {
      Alert.alert("Aviso", "El código no está disponible aún");
      return;
    }

    try {
      await Share.share({
        message: `¡Únete a mi equipo en CDE Inversiones! Mi código de invitación es: ${invitationCode}`,
        title: "Código de Invitación CDE",
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el código");
    }
  };

  const shareApp = async () => {
    const url =
      "https://drive.google.com/file/d/11m0FJRQtWHoi3qSEy2_BpJcgMCqeIBTK/view?usp=sharing";
    try {
      await Share.share({
        message: `¡Únete a CDE Inversiones! Descarga la app aquí: ${url}`,
        url: url, // iOS only
        title: "Descargar CDE App", // Android only
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el enlace");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || walletLoading}
            onRefresh={async () => {
              refreshData();
              refreshWallet();
              if (user?.id && isAuthenticated) {
                try {
                  const [team, activity, commData] = await Promise.all([
                    ReferralService.getReferralTeam(user.id),
                    ReferralService.getReferralActivity(user.id, 10),
                    ReferralService.getCommissions(user.id, 20),
                  ]);
                  setReferralTeam(team);
                  setAgentLevel(ReferralService.getReferralLevel(team.level1));
                  setReferralActivity(activity);
                  setCommissions(commData.commissions);
                  setTotalCommissions(commData.totalEarned);
                } catch (err) {
                  console.error("Error recargando referidos:", err);
                }
              }
            }}
            colors={["#3b82f6"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="trending-up" size={24} color="#2563eb" />
            <Text style={styles.logoText}>CDE</Text>
          </View>
          <View style={styles.headerRight}>
            {isAuthenticated && (
              <View
                style={[
                  styles.vipHeaderBadge,
                  { backgroundColor: vipLevel.color + "20" },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{vipLevel.badge}</Text>
                <Text style={[styles.vipHeaderText, { color: vipLevel.color }]}>
                  {vipLevel.name}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.balanceContainer}
              onPress={() => navigation.navigate("Perfil")}
              activeOpacity={0.7}
            >
              <Text style={styles.balanceAmount}>
                {isAuthenticated ? getFormattedBalance() : "RD$0.00"}
              </Text>
              <Ionicons name="wallet-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* VIP Progress Bar */}
        {isAuthenticated && !isMaxLevel && (
          <View style={styles.vipProgressContainer}>
            <View style={styles.vipProgressHeader}>
              <Text style={styles.vipProgressLabel}>
                {vipLevel.badge} {vipLevel.name}
              </Text>
              <Text style={styles.vipProgressNext}>
                Siguiente: {nextLevel?.name} {nextLevel?.badge}
              </Text>
            </View>
            <View style={styles.vipProgressBarBg}>
              <View
                style={[
                  styles.vipProgressBarFill,
                  { width: `${vipProgress}%`, backgroundColor: vipLevel.color },
                ]}
              />
            </View>
            <Text style={styles.vipProgressText}>
              Faltan RD$
              {amountToNext.toLocaleString("es-DO", {
                minimumFractionDigits: 2,
              })}{" "}
              en recargas
            </Text>
          </View>
        )}
        {isAuthenticated && isMaxLevel && (
          <View
            style={[
              styles.vipProgressContainer,
              { backgroundColor: "#fef2f2" },
            ]}
          >
            <Text style={styles.vipMaxText}>
              {vipLevel.badge} {vipLevel.name} - Nivel Máximo Alcanzado
            </Text>
          </View>
        )}

        {/* Loading skeleton */}
        {loading && <HomeStatsSkeleton />}

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
                title="Inversores"
                value={
                  isAuthenticated
                    ? (userStats?.referrals_count || 0).toString()
                    : (globalStats?.first_time_investors || 0).toString()
                }
                color="#10b981"
                icon="person-add"
              />
              <StatsCard
                title="Retiros de Equipo"
                value={
                  isAuthenticated
                    ? `RD$${(userStats?.referrals_total_withdrawals || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : (globalStats?.users_with_withdrawals || 0).toString()
                }
                color="#6366f1"
                icon="arrow-down"
              />
              <StatsCard
                title="Número de Traders"
                value={
                  isAuthenticated
                    ? (userStats?.active_investments || 0).toString()
                    : (globalStats?.number_of_traders || 0).toString()
                }
                color="#f59e0b"
                icon="people"
              />
            </View>

            <View style={styles.statsRow}>
              <StatsCard
                title="Cantidad de Recarga"
                value={
                  isAuthenticated
                    ? `RD$${getTotalDeposited().toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `RD$${(globalStats?.total_deposits || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
                color="#10b981"
                icon="card"
              />
              <StatsCard
                title="Cantidad de Retiro"
                value={
                  isAuthenticated
                    ? `RD$${getTotalWithdrawn().toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `RD$${(globalStats?.total_withdrawals || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
                color="#ef4444"
                icon="cash"
              />
            </View>
          </>
        )}

        {/* Date Selector - REMOVED as it was non-functional */}
        {/* <TouchableOpacity style={styles.dateSelector}>
          <Text style={styles.dateSelectorText}>Seleccionar Fecha</Text>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
        </TouchableOpacity> */}

        {/* My Team Section */}
        <View style={styles.teamSection}>
          <View style={styles.sectionHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Mi Equipo</Text>
            </View>
            <View
              style={{
                backgroundColor: "#dbeafe",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{ color: "#2563eb", fontSize: 12, fontWeight: "700" }}
              >
                {referralTeam.level1}{" "}
                {referralTeam.level1 === 1 ? "Referido" : "Referidos"}
              </Text>
            </View>
          </View>

          <View style={styles.teamContainer}>
            <View style={styles.teamStats}>
              {/* Level 1 */}
              <View
                style={[
                  styles.teamLevel,
                  {
                    backgroundColor:
                      referralTeam.level1 >= 10 ? "#ecfeff" : "transparent",
                    borderRadius: 8,
                    padding: 6,
                    marginBottom: 6,
                  },
                ]}
              >
                <View
                  style={[
                    styles.levelIndicator,
                    {
                      backgroundColor:
                        referralTeam.level1 >= 10 ? "#06b6d4" : "#4b5563",
                      shadowColor:
                        referralTeam.level1 >= 10 ? "#06b6d4" : "transparent",
                      shadowRadius: 4,
                      shadowOpacity: 0.6,
                      elevation: referralTeam.level1 >= 10 ? 3 : 0,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: referralTeam.level1 >= 10 ? "#0891b2" : "#6b7280",
                      fontWeight: referralTeam.level1 >= 10 ? "700" : "400",
                    },
                  ]}
                >
                  Nv.1 · 10 ref · 2%
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: referralTeam.level1 >= 10 ? "#06b6d4" : "#9ca3af",
                    marginLeft: "auto",
                  }}
                >
                  {referralTeam.level1 >= 10
                    ? "✅"
                    : `${referralTeam.level1}/10`}
                </Text>
              </View>
              {/* Level 2 */}
              <View
                style={[
                  styles.teamLevel,
                  {
                    backgroundColor:
                      referralTeam.level1 >= 20 ? "#fdf2f8" : "transparent",
                    borderRadius: 8,
                    padding: 6,
                    marginBottom: 6,
                  },
                ]}
              >
                <View
                  style={[
                    styles.levelIndicator,
                    {
                      backgroundColor:
                        referralTeam.level1 >= 20 ? "#ec4899" : "#4b5563",
                      shadowColor:
                        referralTeam.level1 >= 20 ? "#ec4899" : "transparent",
                      shadowRadius: 4,
                      shadowOpacity: 0.6,
                      elevation: referralTeam.level1 >= 20 ? 3 : 0,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: referralTeam.level1 >= 20 ? "#db2777" : "#6b7280",
                      fontWeight: referralTeam.level1 >= 20 ? "700" : "400",
                    },
                  ]}
                >
                  Nv.2 · 20 ref · 3%
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: referralTeam.level1 >= 20 ? "#ec4899" : "#9ca3af",
                    marginLeft: "auto",
                  }}
                >
                  {referralTeam.level1 >= 20
                    ? "✅"
                    : `${referralTeam.level1}/20`}
                </Text>
              </View>
              {/* Level 3 */}
              <View
                style={[
                  styles.teamLevel,
                  {
                    backgroundColor:
                      referralTeam.level1 >= 30 ? "#fffbeb" : "transparent",
                    borderRadius: 8,
                    padding: 6,
                    marginBottom: 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.levelIndicator,
                    {
                      backgroundColor:
                        referralTeam.level1 >= 30 ? "#f59e0b" : "#4b5563",
                      shadowColor:
                        referralTeam.level1 >= 30 ? "#f59e0b" : "transparent",
                      shadowRadius: 4,
                      shadowOpacity: 0.6,
                      elevation: referralTeam.level1 >= 30 ? 3 : 0,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: referralTeam.level1 >= 30 ? "#d97706" : "#6b7280",
                      fontWeight: referralTeam.level1 >= 30 ? "700" : "400",
                    },
                  ]}
                >
                  Nv.3 · 30 ref · 5%
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: referralTeam.level1 >= 30 ? "#f59e0b" : "#9ca3af",
                    marginLeft: "auto",
                  }}
                >
                  {referralTeam.level1 >= 30
                    ? "✅"
                    : `${referralTeam.level1}/30`}
                </Text>
              </View>
            </View>
            <TeamChart
              level1={Math.min(referralTeam.level1, 10)}
              level2={
                referralTeam.level1 >= 10
                  ? Math.min(referralTeam.level1 - 10, 10)
                  : 0
              }
              level3={referralTeam.level1 >= 20 ? referralTeam.level1 - 20 : 0}
            />
          </View>

          {/* Current Level Badge */}
          <View style={{ marginTop: 8, borderRadius: 10, overflow: "hidden" }}>
            <LinearGradient
              colors={
                agentLevel.level > 0
                  ? [agentLevel.color + "20", agentLevel.color + "08"]
                  : ["#f3f4f6", "#f9fafb"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor:
                  agentLevel.level > 0 ? agentLevel.color + "30" : "#e5e7eb",
              }}
            >
              <Ionicons
                name={agentLevel.level > 0 ? "trophy" : "rocket-outline"}
                size={16}
                color={agentLevel.level > 0 ? agentLevel.color : "#9ca3af"}
              />
              {agentLevel.nextLevel ? (
                <Text
                  style={{
                    color: agentLevel.level > 0 ? agentLevel.color : "#6b7280",
                    fontSize: scaleFont(12),
                    marginLeft: 8,
                    fontWeight: "600",
                  }}
                >
                  {agentLevel.level > 0
                    ? `${agentLevel.name} (${agentLevel.commissionPercent}) — Faltan ${agentLevel.nextLevel.remaining} para ${agentLevel.nextLevel.name}`
                    : `Faltan ${agentLevel.nextLevel.remaining} referidos para ${agentLevel.nextLevel.name} (${agentLevel.nextLevel.commissionRate * 100}%)`}
                </Text>
              ) : (
                <Text
                  style={{
                    color: "#059669",
                    fontSize: scaleFont(12),
                    marginLeft: 8,
                    fontWeight: "700",
                  }}
                >
                  🏆 ¡Nivel máximo! Comisión del {agentLevel.commissionPercent}
                </Text>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* My Rebate Section */}
        <View style={styles.rebateSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Referidos</Text>
            <Text style={styles.viewAllText}>
              {referralActivity.length > 0
                ? `${referralActivity.length} registros`
                : ""}
            </Text>
          </View>

          <View style={styles.rebateTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Usuario</Text>
              <Text style={styles.tableHeaderText}>Fecha</Text>
              <Text style={styles.tableHeaderText}>Nivel</Text>
              <Text style={styles.tableHeaderText}>Estado</Text>
            </View>
            {referralActivity.length > 0 ? (
              referralActivity.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowAlt,
                  ]}
                >
                  <Text style={styles.tableCell} numberOfLines={1}>
                    {item.username}
                  </Text>
                  <Text style={styles.tableCell}>{item.date}</Text>
                  <Text style={styles.tableCell}>Nv.1</Text>
                  <View style={styles.tableCellStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: item.isActive
                            ? "#10b981"
                            : "#ef4444",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.isActive ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {item.isActive ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="people-outline" size={32} color="#d1d5db" />
                <Text style={styles.noDataText}>Aún no tienes referidos</Text>
                <Text style={styles.noDataSubtext}>
                  Comparte tu código para invitar personas
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Mis Comisiones Section */}
        <View style={styles.rebateSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Mis Comisiones
              {agentLevel.level > 0 ? ` (${agentLevel.commissionPercent})` : ""}
            </Text>
            <Text
              style={[
                styles.viewAllText,
                { color: "#10b981", fontWeight: "700" },
              ]}
            >
              RD$
              {totalCommissions.toLocaleString("es-DO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={styles.rebateTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                Descripción
              </Text>
              <Text style={styles.tableHeaderText}>Fecha</Text>
              <Text style={styles.tableHeaderText}>Monto</Text>
            </View>
            {commissions.length > 0 ? (
              commissions.map((item, index) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowAlt,
                  ]}
                >
                  <Text
                    style={[styles.tableCell, { flex: 2 }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                  <Text style={styles.tableCell}>{item.date}</Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { color: "#10b981", fontWeight: "600" },
                    ]}
                  >
                    +RD$
                    {item.amount.toLocaleString("es-DO", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="cash-outline" size={32} color="#d1d5db" />
                <Text style={styles.noDataText}>Sin comisiones aún</Text>
                <Text style={styles.noDataSubtext}>
                  Alcanza 10 referidos para desbloquear comisiones (2%)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Enlaces Patrocinados: https://cdeinversiones.com/...
          </Text>
          <Text style={styles.invitationText}>
            Código de Invitación: {invitationCode}
          </Text>

          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.footerButton} onPress={shareApp}>
              <Text style={styles.footerButtonText}>Compartir App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.footerButtonSecondary]}
              onPress={shareInvitationCode}
            >
              <Text style={styles.footerButtonText}>Compartir Código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: scaleFont(isSmallScreen() ? 20 : 24),
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: getSpacing(0.5),
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: getBorderRadius(20),
    gap: getSpacing(0.5),
  },
  balanceAmount: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    color: "#2563eb",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vipHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vipHeaderText: {
    fontSize: 11,
    fontWeight: "700",
  },
  vipProgressContainer: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
  },
  vipProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vipProgressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  vipProgressNext: {
    fontSize: 12,
    color: "#6b7280",
  },
  vipProgressBarBg: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  vipProgressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  vipProgressText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "right",
  },
  vipMaxText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
    textAlign: "center",
  },
  loadingContainer: {
    padding: getSpacing(2),
    alignItems: "center",
  },
  loadingText: {
    marginTop: getSpacing(0.5),
    fontSize: scaleFont(14),
    color: "#6b7280",
  },
  errorContainer: {
    margin: getHorizontalPadding(),
    padding: getSpacing(),
    backgroundColor: "#fee2e2",
    borderRadius: getBorderRadius(8),
    alignItems: "center",
  },
  errorText: {
    fontSize: scaleFont(14),
    color: "#dc2626",
    marginBottom: getSpacing(0.5),
  },
  retryButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: getSpacing(),
    paddingVertical: getSpacing(0.5),
    borderRadius: getBorderRadius(6),
  },
  retryText: {
    color: "#ffffff",
    fontSize: scaleFont(12),
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: getVerticalPadding(),
    gap: getSpacing(0.625),
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: getSpacing(0.625),
    gap: getSpacing(0.625),
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: getHorizontalPadding(),
    marginTop: getVerticalPadding(),
    padding: scaleWidth(15),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateSelectorText: {
    fontSize: scaleFont(16),
    color: "#6b7280",
  },
  teamSection: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: getVerticalPadding(),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  viewAllText: {
    fontSize: 14,
    color: "#2563eb",
  },
  teamContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  teamStats: {
    flex: 1,
  },
  teamLevel: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#6b7280",
  },
  rebateSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  rebateTable: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  noDataContainer: {
    paddingVertical: 30,
    alignItems: "center",
    gap: 6,
  },
  noDataText: {
    fontSize: 15,
    color: "#9ca3af",
    fontWeight: "500",
    marginTop: 4,
  },
  noDataSubtext: {
    fontSize: 13,
    color: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
  },
  tableCellStatus: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  footer: {
    backgroundColor: "#1f2937",
    marginTop: 20,
    padding: 20,
    paddingBottom: 30, // Padding adicional para evitar conflictos con botones del sistema
  },
  footerText: {
    fontSize: 12,
    color: "#d1d5db",
    marginBottom: 5,
  },
  invitationText: {
    fontSize: 12,
    color: "#d1d5db",
    marginBottom: 15,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  footerButtonSecondary: {
    backgroundColor: "#6366f1",
  },
  footerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default HomeScreen;
