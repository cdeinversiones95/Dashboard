import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../contexts/AuthContext";
import ReferralService from "../services/ReferralService";
import AuthService from "../services/AuthService";
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
  isSmallScreen,
  useSafeArea,
  getSafeBottomPadding,
  getSafeContainerStyle,
} from "../utils/responsive";

const AgentCenterScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeArea();

  const [loading, setLoading] = useState(true);
  const [invitationCode, setInvitationCode] = useState("");
  const [referralTeam, setReferralTeam] = useState({
    level1: 0,
    level2: 0,
    level3: 0,
    total: 0,
    level1Users: [],
    level2Users: [],
    level3Users: [],
  });
  const [agentLevel, setAgentLevel] = useState(
    ReferralService.getReferralLevel(0),
  );
  const [commissions, setCommissions] = useState([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [activeTab, setActiveTab] = useState("team"); // 'team' | 'commissions'

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [team, commData, code] = await Promise.all([
        ReferralService.getReferralTeam(user.id),
        ReferralService.getCommissions(user.id, 50),
        AuthService.ensureInvitationCode(user.id),
      ]);
      setReferralTeam(team);
      setAgentLevel(ReferralService.getReferralLevel(team.level1));
      setCommissions(commData.commissions);
      setTotalCommissions(commData.totalEarned);
      if (code) setInvitationCode(code);
    } catch (err) {
      console.error("Error cargando datos de agentes:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyCode = async () => {
    if (invitationCode) {
      await Clipboard.setStringAsync(invitationCode);
      Alert.alert("✅ Copiado", "Código copiado al portapapeles");
    }
  };

  const shareCode = async () => {
    if (!invitationCode) return;
    try {
      await Share.share({
        message: `¡Únete a mi equipo en CDE Inversiones! Usa mi código de invitación: ${invitationCode}`,
        title: "Código de Invitación CDE",
      });
    } catch (error) {
      console.error("Error compartiendo:", error);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const renderUserRow = (user, level, levelColor, index) => (
    <View
      key={user.id || index}
      style={[styles.userRow, index % 2 === 0 && styles.userRowAlt]}
    >
      <View style={styles.userInfo}>
        <View
          style={[styles.avatarCircle, { backgroundColor: levelColor + "20" }]}
        >
          <Ionicons name="person" size={16} color={levelColor} />
        </View>
        <View style={styles.userTextContainer}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.username || user.full_name || "Usuario"}
          </Text>
          <Text style={styles.userDate}>{formatDate(user.created_at)}</Text>
        </View>
      </View>
      <View style={[styles.levelBadge, { backgroundColor: levelColor + "15" }]}>
        <Text style={[styles.levelBadgeText, { color: levelColor }]}>
          Nv.{level}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: user.is_active ? "#10b981" : "#ef4444" },
          ]}
        />
        <Text
          style={[
            styles.statusLabel,
            { color: user.is_active ? "#10b981" : "#ef4444" },
          ]}
        >
          {user.is_active ? "Activo" : "Inactivo"}
        </Text>
      </View>
    </View>
  );

  const allUsers = [
    ...referralTeam.level1Users.map((u) => ({
      ...u,
      level: 1,
      color: "#06b6d4",
    })),
    ...referralTeam.level2Users.map((u) => ({
      ...u,
      level: 2,
      color: "#ec4899",
    })),
    ...referralTeam.level3Users.map((u) => ({
      ...u,
      level: 3,
      color: "#fbbf24",
    })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Agentes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            colors={["#3b82f6"]}
          />
        }
      >
        {/* Invitation Code Card */}
        <LinearGradient
          colors={["#2563eb", "#1d4ed8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.codeCard}
        >
          <Text style={styles.codeLabel}>Tu Código de Invitación</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{invitationCode || "..."}</Text>
            <TouchableOpacity onPress={copyCode} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={shareCode} style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={18} color="#2563eb" />
            <Text style={styles.shareButtonText}>Compartir Código</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralTeam.level1}</Text>
            <Text style={styles.statLabel}>Referidos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: agentLevel.color }]}>
              {agentLevel.level > 0 ? agentLevel.name : "—"}
            </Text>
            <Text style={styles.statLabel}>Tu Nivel</Text>
          </View>
          <View style={[styles.statCard, { borderRightWidth: 0 }]}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              RD$
              {totalCommissions.toLocaleString("es-DO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.statLabel}>Comisiones</Text>
          </View>
        </View>

        {/* Agent Level Progress */}
        <View
          style={[
            styles.levelBreakdown,
            { borderWidth: 1, borderColor: agentLevel.color + "25" },
          ]}
        >
          {/* Level Header with gradient feel */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
              backgroundColor: agentLevel.color + "10",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: agentLevel.color + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="trophy" size={20} color={agentLevel.color} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: agentLevel.level > 0 ? agentLevel.color : "#4b5563",
                }}
              >
                {agentLevel.level > 0 ? agentLevel.name : "Sin Nivel"}
              </Text>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {agentLevel.level > 0
                  ? `Comisión del ${agentLevel.commissionPercent} activa`
                  : "Necesitas 10 referidos para activar"}
              </Text>
            </View>
            {agentLevel.level > 0 && (
              <View
                style={{
                  backgroundColor: agentLevel.color,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}
                >
                  {agentLevel.commissionPercent}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View
            style={{
              backgroundColor: "#f3f4f6",
              borderRadius: 8,
              height: 12,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <LinearGradient
              colors={
                agentLevel.level >= 3
                  ? ["#f59e0b", "#fbbf24"]
                  : agentLevel.level >= 2
                    ? ["#db2777", "#ec4899"]
                    : agentLevel.level >= 1
                      ? ["#0891b2", "#06b6d4"]
                      : ["#9ca3af", "#d1d5db"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: `${Math.min(agentLevel.progress * 100, 100)}%`,
                height: "100%",
                borderRadius: 8,
              }}
            />
          </View>

          {agentLevel.nextLevel && (
            <Text
              style={{
                color: "#6b7280",
                fontSize: 12,
                textAlign: "center",
                marginBottom: 14,
                fontStyle: "italic",
              }}
            >
              🚀 {agentLevel.nextLevel.remaining} referido
              {agentLevel.nextLevel.remaining !== 1 ? "s" : ""} más para{" "}
              {agentLevel.nextLevel.name} (
              {agentLevel.nextLevel.commissionRate * 100}%)
            </Text>
          )}

          {/* Level Milestones - Colorful Cards */}
          <View
            style={[
              styles.levelRow,
              {
                backgroundColor:
                  referralTeam.level1 >= 10 ? "#ecfeff" : "#f9fafb",
                borderRadius: 10,
                padding: 10,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: referralTeam.level1 >= 10 ? "#a5f3fc" : "#f3f4f6",
              },
            ]}
          >
            <View
              style={[
                styles.levelDot,
                {
                  backgroundColor:
                    referralTeam.level1 >= 10 ? "#06b6d4" : "#d1d5db",
                  shadowColor: "#06b6d4",
                  shadowOpacity: referralTeam.level1 >= 10 ? 0.5 : 0,
                  shadowRadius: 4,
                  elevation: referralTeam.level1 >= 10 ? 2 : 0,
                },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: referralTeam.level1 >= 10 ? "#0e7490" : "#6b7280",
                }}
              >
                Nivel 1
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: referralTeam.level1 >= 10 ? "#0891b2" : "#9ca3af",
                }}
              >
                10 referidos → 2% comisión
              </Text>
            </View>
            <Text
              style={[
                styles.levelCount,
                { color: referralTeam.level1 >= 10 ? "#06b6d4" : "#9ca3af" },
              ]}
            >
              {referralTeam.level1 >= 10 ? "✅" : `${referralTeam.level1}/10`}
            </Text>
          </View>
          <View
            style={[
              styles.levelRow,
              {
                backgroundColor:
                  referralTeam.level1 >= 20 ? "#fdf2f8" : "#f9fafb",
                borderRadius: 10,
                padding: 10,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: referralTeam.level1 >= 20 ? "#fbcfe8" : "#f3f4f6",
              },
            ]}
          >
            <View
              style={[
                styles.levelDot,
                {
                  backgroundColor:
                    referralTeam.level1 >= 20 ? "#ec4899" : "#d1d5db",
                  shadowColor: "#ec4899",
                  shadowOpacity: referralTeam.level1 >= 20 ? 0.5 : 0,
                  shadowRadius: 4,
                  elevation: referralTeam.level1 >= 20 ? 2 : 0,
                },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: referralTeam.level1 >= 20 ? "#be185d" : "#6b7280",
                }}
              >
                Nivel 2
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: referralTeam.level1 >= 20 ? "#db2777" : "#9ca3af",
                }}
              >
                20 referidos → 3% comisión
              </Text>
            </View>
            <Text
              style={[
                styles.levelCount,
                { color: referralTeam.level1 >= 20 ? "#ec4899" : "#9ca3af" },
              ]}
            >
              {referralTeam.level1 >= 20 ? "✅" : `${referralTeam.level1}/20`}
            </Text>
          </View>
          <View
            style={[
              styles.levelRow,
              {
                backgroundColor:
                  referralTeam.level1 >= 30 ? "#fffbeb" : "#f9fafb",
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: referralTeam.level1 >= 30 ? "#fde68a" : "#f3f4f6",
              },
            ]}
          >
            <View
              style={[
                styles.levelDot,
                {
                  backgroundColor:
                    referralTeam.level1 >= 30 ? "#f59e0b" : "#d1d5db",
                  shadowColor: "#f59e0b",
                  shadowOpacity: referralTeam.level1 >= 30 ? 0.5 : 0,
                  shadowRadius: 4,
                  elevation: referralTeam.level1 >= 30 ? 2 : 0,
                },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: referralTeam.level1 >= 30 ? "#b45309" : "#6b7280",
                }}
              >
                Nivel 3
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: referralTeam.level1 >= 30 ? "#d97706" : "#9ca3af",
                }}
              >
                30 referidos → 5% comisión
              </Text>
            </View>
            <Text
              style={[
                styles.levelCount,
                { color: referralTeam.level1 >= 30 ? "#f59e0b" : "#9ca3af" },
              ]}
            >
              {referralTeam.level1 >= 30 ? "✅" : `${referralTeam.level1}/30`}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "team" && styles.tabActive]}
            onPress={() => setActiveTab("team")}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === "team" ? "#2563eb" : "#9ca3af"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "team" && styles.tabTextActive,
              ]}
            >
              Mi Equipo ({allUsers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "commissions" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("commissions")}
          >
            <Ionicons
              name="cash"
              size={18}
              color={activeTab === "commissions" ? "#2563eb" : "#9ca3af"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "commissions" && styles.tabTextActive,
              ]}
            >
              Comisiones ({commissions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "team" ? (
          <View style={styles.listContainer}>
            {allUsers.length > 0 ? (
              <>
                <View style={styles.listHeader}>
                  <Text style={[styles.listHeaderText, { flex: 2 }]}>
                    Usuario
                  </Text>
                  <Text style={styles.listHeaderText}>Nivel</Text>
                  <Text style={styles.listHeaderText}>Estado</Text>
                </View>
                {allUsers.map((u, i) => renderUserRow(u, u.level, u.color, i))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Sin Referidos Aún</Text>
                <Text style={styles.emptySubtitle}>
                  Comparte tu código de invitación para empezar a construir tu
                  equipo
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {commissions.length > 0 ? (
              <>
                <View style={styles.listHeader}>
                  <Text style={[styles.listHeaderText, { flex: 2 }]}>
                    Descripción
                  </Text>
                  <Text style={styles.listHeaderText}>Fecha</Text>
                  <Text style={styles.listHeaderText}>Monto</Text>
                </View>
                {commissions.map((c, i) => (
                  <View
                    key={c.id || i}
                    style={[
                      styles.commissionRow,
                      i % 2 === 0 && styles.userRowAlt,
                    ]}
                  >
                    <Text
                      style={[styles.commissionDesc, { flex: 2 }]}
                      numberOfLines={2}
                    >
                      {c.description}
                    </Text>
                    <Text style={styles.commissionDate}>{c.date}</Text>
                    <Text style={styles.commissionAmount}>
                      +RD$
                      {c.amount.toLocaleString("es-DO", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                ))}

                {/* Total */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Ganado</Text>
                  <Text style={styles.totalAmount}>
                    RD$
                    {totalCommissions.toLocaleString("es-DO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cash-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Sin Comisiones Aún</Text>
                <Text style={styles.emptySubtitle}>
                  Alcanza 10 referidos para desbloquear comisiones del 2%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>1.</Text>
            <Text style={styles.infoText}>
              Comparte tu código de invitación con amigos
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>2.</Text>
            <Text style={styles.infoText}>
              Cuando se registren usando tu código, se unen a tu equipo
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>3.</Text>
            <Text style={styles.infoText}>
              Sube de nivel consiguiendo más referidos: Nv.1 (10) = 2%, Nv.2
              (20) = 3%, Nv.3 (30) = 5%
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>4.</Text>
            <Text style={styles.infoText}>
              Las comisiones se acreditan automáticamente a tu billetera
            </Text>
          </View>
        </View>

        <View style={{ height: getSafeBottomPadding() + 30 }} />
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getHorizontalPadding(),
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: "700",
    color: "#1f2937",
  },

  // Code Card
  codeCard: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: 16,
    borderRadius: getBorderRadius(16),
    padding: 20,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  codeText: {
    fontSize: scaleFont(28),
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 4,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: getHorizontalPadding(),
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: getBorderRadius(14),
    overflow: "hidden",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#f3f4f6",
  },
  statValue: {
    fontSize: scaleFont(18),
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },

  // Level Breakdown
  levelBreakdown: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: getBorderRadius(16),
    padding: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  levelLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
  },
  levelCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    minWidth: 30,
    textAlign: "right",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: getHorizontalPadding(),
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: getBorderRadius(14),
    padding: 4,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: getBorderRadius(10),
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#dbeafe",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#2563eb",
  },

  // List
  listContainer: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: getBorderRadius(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  listHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
  },

  // User Row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  userRowAlt: {
    backgroundColor: "#fafbfc",
  },
  userInfo: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  userDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },
  levelBadge: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginHorizontal: 4,
    alignSelf: "center",
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusContainer: {
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
  statusLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Commission Row
  commissionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  commissionDesc: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 16,
  },
  commissionDate: {
    flex: 1,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  commissionAmount: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
    textAlign: "right",
  },

  // Total Row
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f0fdf4",
    borderTopWidth: 1,
    borderTopColor: "#d1fae5",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  // Info Card
  infoCard: {
    marginHorizontal: getHorizontalPadding(),
    marginTop: 16,
    backgroundColor: "#eef2ff",
    borderRadius: getBorderRadius(14),
    padding: 18,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e40af",
  },
  infoItem: {
    flexDirection: "row",
    paddingVertical: 4,
    gap: 8,
  },
  infoBullet: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3b82f6",
    width: 18,
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 18,
  },
});

export default AgentCenterScreen;
