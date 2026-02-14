import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../hooks/useWallet";
import { useVipLevel, VIP_LEVELS } from "../hooks/useVipLevel";
import { useBiometricAuth } from "../hooks/useBiometricAuth";
import WalletService from "../services/WalletService";
import {
  getDepositStatusInfo,
  getPaymentMethodText,
} from "../utils/statusHelpers";
import { formatDateTime } from "../utils/formatters";
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
  useSafeArea,
  getSafeBottomPadding,
  getSafeContainerStyle,
} from "../utils/responsive";

const ProfileScreen = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth();
  const {
    balance,
    getFormattedBalance,
    requestDeposit,
    requestWithdrawal,
    loading: walletLoading,
  } = useWallet();

  const {
    isBiometricSupported,
    isBiometricEnabled,
    enableBiometricAuth,
    disableBiometricAuth,
    getBiometricTypeText,
    loading: biometricLoading,
  } = useBiometricAuth();

  const {
    currentLevel: vipLevel,
    nextLevel,
    totalDeposited,
    progress: vipProgress,
    amountToNext,
    isMaxLevel,
    allLevels,
  } = useVipLevel();

  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const insets = useSafeArea();

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    fetchRechargeHistory();
  };

  const fetchRechargeHistory = async () => {
    if (!user) return;

    try {
      setLoadingHistory(true);

      const { data, error } = await WalletService.getDepositHistory(user.id);

      if (error) {
        console.error("Error obteniendo historial de recargas:", error);
        throw new Error(error);
      }

      setRechargeHistory(data || []);
    } catch (error) {
      console.error("Error fetching recharge history:", error);
      Alert.alert("Error", "No se pudo cargar el historial de recargas");
      setRechargeHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Use shared helpers: getDepositStatusInfo, getPaymentMethodText, formatDateTime
  // imported from utils/statusHelpers and utils/formatters
  const getStatusInfo = getDepositStatusInfo;
  const formatDate = formatDateTime;

  const handleLogout = () => {
    Alert.alert(
      "⚽ Cerrar Sesión",
      "¿Estás seguro de que quieres salir del campo?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              Alert.alert(
                "👋 ¡Hasta luego!",
                "Has salido del campo exitosamente",
              );
            } catch (error) {
              Alert.alert("❌ Error", "No se pudo cerrar la sesión");
            }
          },
        },
      ],
    );
  };

  const handleBiometricToggle = async () => {
    if (isBiometricEnabled) {
      // Deshabilitar biométricos
      Alert.alert(
        "🔒 Deshabilitar Autenticación Biométrica",
        "¿Estás seguro de que quieres deshabilitar el inicio de sesión con datos biométricos?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Deshabilitar",
            style: "destructive",
            onPress: async () => {
              const result = await disableBiometricAuth();
              if (result.success) {
                Alert.alert(
                  "✅ Deshabilitado",
                  "La autenticación biométrica ha sido deshabilitada",
                );
              } else {
                Alert.alert(
                  "❌ Error",
                  result.error ||
                    "No se pudo deshabilitar la autenticación biométrica",
                );
              }
            },
          },
        ],
      );
    } else {
      // Habilitar biométricos - Mostrar modal de contraseña
      setShowPasswordModal(true);
    }
  };

  const confirmEnableBiometric = async () => {
    if (!passwordInput) {
      Alert.alert("❌ Error", "La contraseña es requerida");
      return;
    }

    // Usar el teléfono del perfil si está disponible, o el email del usuario
    // Esto asegura que LoginScreen reciba el identificador correcto
    const identifier = userProfile?.phone || user?.email;

    if (!identifier) {
      Alert.alert("❌ Error", "No se pudo obtener la información del usuario");
      setShowPasswordModal(false);
      return;
    }

    const result = await enableBiometricAuth(identifier, passwordInput);

    setShowPasswordModal(false);
    setPasswordInput("");

    if (result.success) {
      Alert.alert(
        "✅ Habilitado",
        `La autenticación con ${getBiometricTypeText()} ha sido habilitada exitosamente`,
      );
    } else {
      Alert.alert(
        "❌ Error",
        result.error || "No se pudo habilitar la autenticación biométrica",
      );
    }
  };

  const menuItems = [
    {
      id: "biometric",
      icon: "lock-closed",
      title: "Autenticación Biométrica",
      subtitle: isBiometricSupported
        ? `Iniciar sesión con ${getBiometricTypeText()}`
        : "No disponible en este dispositivo",
      rightComponent: isBiometricSupported ? (
        <View style={styles.switchContainer}>
          <Switch
            value={isBiometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: "#E5E5E5", true: "#007AFF" }}
            thumbColor={isBiometricEnabled ? "#FFFFFF" : "#FFFFFF"}
          />
        </View>
      ) : (
        <Text style={styles.disabledText}>No disponible</Text>
      ),
      onPress: isBiometricSupported ? handleBiometricToggle : null,
    },
    {
      id: 1,
      title: "Página Principal",
      icon: "home-outline",
      onPress: () => navigation.navigate("Home"),
    },
    {
      id: 2,
      title: "VIP",
      icon: "star-outline",
      onPress: () => setShowVipModal(true),
    },
    {
      id: 3,
      title: "Centro de Inversiones",
      icon: "trophy-outline",
      hasArrow: true,
      onPress: () => Alert.alert("🏆 Inversiones", "Próximamente disponible"),
    },
    {
      id: 4,
      title: "Centro de Agentes",
      icon: "people-outline",
      hasArrow: true,
      onPress: () => navigation.navigate("AgentCenter"),
    },
    {
      id: 5,
      title: "Sala de Eventos",
      icon: "calendar-outline",
      onPress: () => navigation.navigate("Inversiones"),
    },
    {
      id: 7,
      title: "Centro de Ayuda",
      icon: "help-circle-outline",
      onPress: () =>
        Alert.alert("❓ Ayuda", "Contacta con soporte: soporte@cde.com"),
    },
    {
      id: 8,
      title: "Acerca de CDE",
      icon: "information-circle-outline",
      onPress: () =>
        Alert.alert(
          "ℹ️ CDE INVERSIONES",
          "Versión 1.0.0\nPlataforma de inversiones deportivas",
        ),
    },
    {
      id: 9,
      title: "Partner",
      icon: "people-circle-outline",
      onPress: () =>
        Alert.alert("🤝 Partner", "Programa de socios próximamente"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Header */}
        <LinearGradient
          colors={["#3b82f6", "#1d4ed8"]}
          style={styles.profileHeader}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>
                {userProfile?.full_name ||
                  userProfile?.display_name ||
                  userProfile?.name ||
                  user?.user_metadata?.display_name ||
                  "Usuario"}
              </Text>
              <View style={styles.vipBadge}>
                <Text style={{ fontSize: 12 }}>{vipLevel.badge}</Text>
                <Text
                  style={[
                    styles.vipText,
                    {
                      color:
                        vipLevel.color === "#6b7280"
                          ? "#10b981"
                          : vipLevel.color,
                    },
                  ]}
                >
                  {vipLevel.name}
                </Text>
                <Ionicons
                  name="star"
                  size={12}
                  color={
                    vipLevel.color === "#6b7280" ? "#fbbf24" : vipLevel.color
                  }
                />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Balance Card */}
        <LinearGradient
          colors={["#3b82f6", "#1e40af"]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceAmount}>
            {walletLoading ? "..." : getFormattedBalance()}
          </Text>
          <Text style={styles.balanceLabel}>Balance Disponible</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("RechargeMethod")}
            >
              <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Recargar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => navigation.navigate("Withdrawal")}
            >
              <Ionicons name="cash-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Retirar</Text>
            </TouchableOpacity>
          </View>

          {/* History Button */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={openHistoryModal}
          >
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text style={styles.historyButtonText}>
              Ver Historial de Recargas
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
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
              <Text style={styles.flagEmoji}>{"\uD83C\uDDE9\uD83C\uDDF4"}</Text>
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

      {/* VIP Level Modal */}
      <Modal
        visible={showVipModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.vipModalContent}>
            <View style={styles.vipModalHeader}>
              <Text style={styles.vipModalTitle}>🏆 Niveles VIP</Text>
              <TouchableOpacity onPress={() => setShowVipModal(false)}>
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.vipCurrentInfo}>
              <Text style={styles.vipCurrentLabel}>Tu nivel actual</Text>
              <View
                style={[
                  styles.vipCurrentBadge,
                  { backgroundColor: vipLevel.color + "15" },
                ]}
              >
                <Text style={{ fontSize: 28 }}>{vipLevel.badge}</Text>
                <Text
                  style={[styles.vipCurrentName, { color: vipLevel.color }]}
                >
                  {vipLevel.name}
                </Text>
              </View>
              <Text style={styles.vipDepositedText}>
                Total recargado: RD$
                {totalDeposited.toLocaleString("es-DO", {
                  minimumFractionDigits: 2,
                })}
              </Text>
              {!isMaxLevel && (
                <View style={styles.vipProgressWrap}>
                  <View style={styles.vipProgressBarBg}>
                    <View
                      style={[
                        styles.vipProgressBarFill,
                        {
                          width: `${vipProgress}%`,
                          backgroundColor: vipLevel.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.vipProgressAmountText}>
                    Faltan RD$
                    {amountToNext.toLocaleString("es-DO", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    para {nextLevel?.name}
                  </Text>
                </View>
              )}
              {isMaxLevel && (
                <Text style={styles.vipMaxLevelText}>
                  🎉 ¡Has alcanzado el nivel máximo!
                </Text>
              )}
            </View>

            <ScrollView style={styles.vipLevelsList}>
              {allLevels.map((level) => (
                <View
                  key={level.level}
                  style={[
                    styles.vipLevelItem,
                    vipLevel.level === level.level && styles.vipLevelItemActive,
                    vipLevel.level === level.level && {
                      borderColor: level.color,
                    },
                  ]}
                >
                  <View style={styles.vipLevelItemHeader}>
                    <View style={styles.vipLevelItemLeft}>
                      <Text style={{ fontSize: 20 }}>{level.badge}</Text>
                      <View>
                        <Text
                          style={[
                            styles.vipLevelItemName,
                            vipLevel.level === level.level && {
                              color: level.color,
                            },
                          ]}
                        >
                          {level.name}
                        </Text>
                        <Text style={styles.vipLevelItemDeposit}>
                          {level.minDeposit === 0
                            ? "Sin mínimo"
                            : `Recargas ≥ RD$${level.minDeposit.toLocaleString("es-DO")}`}
                        </Text>
                      </View>
                    </View>
                    {vipLevel.level >= level.level ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={level.color}
                      />
                    ) : (
                      <Ionicons name="lock-closed" size={20} color="#d1d5db" />
                    )}
                  </View>
                  <View style={styles.vipBenefitsList}>
                    {level.benefits.map((benefit, i) => (
                      <Text key={i} style={styles.vipBenefitText}>
                        • {benefit}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Modal for Biometric Enable */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.passwordModalContent}>
            <Text style={styles.modalTitle}>🔒 Habilitar Biometría</Text>
            <Text style={styles.modalSubtitle}>
              Por seguridad, ingresa tu contraseña actual para habilitar el
              inicio de sesión con {getBiometricTypeText()}.
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña actual"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordInput("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmEnableBiometric}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Historial de Recargas</Text>
              <TouchableOpacity
                onPress={() => setShowHistoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {loadingHistory ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>Cargando historial...</Text>
                </View>
              ) : rechargeHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>
                    Sin recargas registradas
                  </Text>
                  <Text style={styles.emptyText}>
                    Aún no has realizado ninguna recarga a tu cuenta.
                    {"\n"}¡Haz tu primera recarga para empezar a invertir!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => {
                      setShowHistoryModal(false);
                      navigation.navigate("RechargeMethod");
                    }}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color="#ffffff"
                    />
                    <Text style={styles.emptyButtonText}>
                      Hacer primera recarga
                    </Text>
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
                              RD${item.amount.toLocaleString("es-DO")}
                            </Text>
                            <Text style={styles.historyDate}>
                              {formatDate(item.created_at)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusInfo.bgColor },
                            ]}
                          >
                            <Ionicons
                              name={statusInfo.icon}
                              size={14}
                              color={statusInfo.color}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: statusInfo.color },
                              ]}
                            >
                              {statusInfo.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.historyDetails}>
                          <View style={styles.historyDetailRow}>
                            <Ionicons
                              name="card-outline"
                              size={14}
                              color="#6b7280"
                            />
                            <Text style={styles.historyDetailText}>
                              {getPaymentMethodText(item.payment_method)}
                            </Text>
                          </View>
                          {item.reference_number && (
                            <View style={styles.historyDetailRow}>
                              <Ionicons
                                name="barcode-outline"
                                size={14}
                                color="#6b7280"
                              />
                              <Text style={styles.historyDetailText}>
                                Ref: {item.reference_number}
                              </Text>
                            </View>
                          )}
                          {item.receipt_url && (
                            <View style={styles.historyDetailRow}>
                              <Ionicons
                                name="image"
                                size={14}
                                color="#10b981"
                              />
                              <Text
                                style={[
                                  styles.historyDetailText,
                                  { color: "#10b981" },
                                ]}
                              >
                                📎 Comprobante adjunto
                              </Text>
                            </View>
                          )}
                          {item.admin_notes && (
                            <View style={styles.historyDetailRow}>
                              <Ionicons
                                name="chatbubble-outline"
                                size={14}
                                color="#3b82f6"
                              />
                              <Text
                                style={[
                                  styles.historyDetailText,
                                  { color: "#3b82f6" },
                                ]}
                              >
                                💬 {item.admin_notes}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Refresh Button */}
            {!loadingHistory && rechargeHistory.length > 0 && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchRechargeHistory}
              >
                <Ionicons name="refresh" size={20} color="#3b82f6" />
                <Text style={styles.refreshButtonText}>Actualizar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  profileHeader: {
    padding: getSpacing(1.25),
    paddingTop: getSpacing(1), // Reducir padding superior ya que el container controla la posición
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start",
  },
  vipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  withdrawButton: {
    backgroundColor: "#10b981",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  historyButtonText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "500",
  },
  menuContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "400",
  },
  bottomSection: {
    padding: 20,
    paddingBottom: 30,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  flagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flagEmoji: {
    fontSize: 18,
  },
  languageText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  supportButton: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  supportText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: getSpacing(),
    borderRadius: getBorderRadius(8),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#dc2626",
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
    color: "#dc2626",
    fontWeight: "600",
    marginLeft: getSpacing(0.5),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    gap: 8,
  },
  refreshButtonText: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "600",
  },
  // History Section (moved from outside)
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  historyList: {
    gap: 12,
    paddingBottom: 10,
  },
  historyCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  historyAmount: {
    flex: 1,
  },
  historyAmountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 3,
  },
  historyDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyDetails: {
    gap: 8,
  },
  historyDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyDetailText: {
    fontSize: 13,
    color: "#6b7280",
  },
  // Biometric styles
  switchContainer: {
    alignItems: "flex-end",
  },
  disabledText: {
    fontSize: 13,
    color: "#9b9b9b",
    fontStyle: "italic",
  },
  // Password Modal Styles
  passwordModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignSelf: "center",
    marginBottom: "auto",
    marginTop: "auto",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#f9fafb",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  confirmButton: {
    backgroundColor: "#3b82f6",
  },
  cancelButtonText: {
    color: "#4b5563",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  // VIP Modal Styles
  vipModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 30,
  },
  vipModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  vipModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  vipCurrentInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  vipCurrentLabel: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
  },
  vipCurrentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  vipCurrentName: {
    fontSize: 22,
    fontWeight: "800",
  },
  vipDepositedText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 10,
  },
  vipProgressWrap: {
    width: "100%",
  },
  vipProgressBarBg: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
  },
  vipProgressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  vipProgressAmountText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "center",
  },
  vipMaxLevelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
    marginTop: 4,
  },
  vipLevelsList: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  vipLevelItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  vipLevelItemActive: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  vipLevelItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vipLevelItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vipLevelItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  vipLevelItemDeposit: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  vipBenefitsList: {
    marginTop: 10,
    paddingLeft: 32,
  },
  vipBenefitText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 3,
  },
});

export default ProfileScreen;
