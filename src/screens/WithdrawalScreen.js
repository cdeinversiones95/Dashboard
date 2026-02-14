import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../hooks/useWallet";
import { useVipLevel } from "../hooks/useVipLevel";
import { getWithdrawalStatusInfo } from "../utils/statusHelpers";
import { formatDateTime } from "../utils/formatters";

const WithdrawalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    balance,
    getFormattedBalance,
    requestWithdrawal,
    withdrawals,
    loading: walletLoading,
  } = useWallet();

  const {
    maxWithdrawal,
    totalDeposited,
    minBalanceRequired,
    minBalancePercent,
    currentLevel: vipLevel,
  } = useVipLevel();

  // maxWithdrawal ya considera: balance actual - (38% de depósitos totales)
  // No hay que restar totalWithdrawn porque el balance actual ya refleja retiros anteriores
  const withdrawalRemaining = maxWithdrawal;
  const effectiveLimit = Math.min(balance, withdrawalRemaining);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [usdtAddress, setUsdtAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollYRef = useRef(0);

  // Refs para cada input
  const amountRef = useRef(null);
  const bankNameRef = useRef(null);
  const accountNumberRef = useRef(null);
  const accountHolderRef = useRef(null);
  const usdtRef = useRef(null);

  // Escuchar apertura/cierre de teclado
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll al input enfocado
  const scrollToInput = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.measureInWindow((x, y, width, height) => {
        const screenH = Dimensions.get("window").height;
        const kbH = keyboardHeight || screenH * 0.4;
        const inputBottom = y + height;
        const visibleBottom = screenH - kbH;
        if (inputBottom > visibleBottom - 30) {
          const scrollBy = inputBottom - visibleBottom + 80;
          scrollViewRef.current?.scrollTo({
            y: scrollYRef.current + scrollBy,
            animated: true,
          });
        }
      });
    }, 500);
  };

  const validateWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);

    if (!withdrawAmount || isNaN(amount)) {
      Alert.alert("❌ Error", "Por favor ingresa un monto válido");
      return false;
    }

    if (amount <= 0) {
      Alert.alert("❌ Error", "El monto debe ser mayor a 0");
      return false;
    }

    if (amount >= balance) {
      Alert.alert(
        "❌ Error",
        `No puedes retirar todo tu balance. Tu cuenta nunca puede quedar en 0.\n\nBalance actual: ${getFormattedBalance()}`,
      );
      return false;
    }

    if (amount > withdrawalRemaining) {
      Alert.alert(
        "❌ Límite de Retiro",
        `El monto excede tu límite disponible para retiro.\n\n` +
          `✅ Disponible para retiro: RD$${withdrawalRemaining.toLocaleString("es-DO", { minimumFractionDigits: 2 })}\n\n` +
          `💰 Balance mínimo obligatorio: RD$${minBalanceRequired.toLocaleString("es-DO", { minimumFractionDigits: 2 })} (${Math.round(minBalancePercent * 100)}% según tu nivel ${vipLevel.name})\n\n` +
          `Recarga más para aumentar tu límite de retiro.`,
      );
      return false;
    }

    // Verificar que el balance no quede por debajo del % mínimo según nivel VIP
    const balanceAfterWithdrawal = balance - amount;
    if (balanceAfterWithdrawal < minBalanceRequired) {
      const maxAllowed = Math.max(balance - minBalanceRequired, 0);
      Alert.alert(
        "❌ Balance Mínimo Requerido",
        `No puedes dejar tu cuenta por debajo del ${Math.round(minBalancePercent * 100)}% de tus depósitos (nivel ${vipLevel.name}).\n\n` +
          `💰 Tus depósitos totales: RD$${totalDeposited.toLocaleString("es-DO", { minimumFractionDigits: 2 })}\n` +
          `🔒 Balance mínimo obligatorio: RD$${minBalanceRequired.toLocaleString("es-DO", { minimumFractionDigits: 2 })}\n` +
          `💵 Tu balance actual: ${getFormattedBalance()}\n\n` +
          `✅ Máximo que puedes retirar ahora: RD$${maxAllowed.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      );
      return false;
    }

    if (paymentMethod === "bank_transfer") {
      if (
        !bankInfo.bankName ||
        !bankInfo.accountNumber ||
        !bankInfo.accountHolder
      ) {
        Alert.alert(
          "❌ Error",
          "Por favor completa toda la información bancaria",
        );
        return false;
      }
    } else if (paymentMethod === "usdt") {
      if (!usdtAddress) {
        Alert.alert("❌ Error", "Por favor ingresa tu dirección USDT");
        return false;
      }
    }

    return true;
  };

  const processWithdrawal = async () => {
    if (!validateWithdrawal()) return;

    const amount = parseFloat(withdrawAmount);

    Alert.alert(
      "💸 Confirmar Retiro",
      `¿Estás seguro que quieres retirar RD$${amount.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?\n\nEste monto será debitado de tu cuenta inmediatamente y será procesado por el administrador.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: submitWithdrawal,
        },
      ],
    );
  };

  const submitWithdrawal = async () => {
    try {
      setLoading(true);
      const amount = parseFloat(withdrawAmount);

      // Preparar información de pago
      let paymentDetails = {};
      if (paymentMethod === "bank_transfer") {
        paymentDetails = {
          bank_name: bankInfo.bankName,
          account_number: bankInfo.accountNumber,
          account_holder: bankInfo.accountHolder,
        };
      } else {
        paymentDetails = {
          usdt_address: usdtAddress,
        };
      }

      // Usar el hook para procesar el retiro
      // Corregido: El orden de los argumentos debe coincidir con useWallet (amount, paymentDetails, paymentMethodType)
      const result = await requestWithdrawal(
        amount,
        paymentDetails,
        paymentMethod,
      );

      if (!result.error) {
        // Limpiar formulario
        setWithdrawAmount("");
        setBankInfo({ bankName: "", accountNumber: "", accountHolder: "" });
        setUsdtAddress("");

        Alert.alert(
          "✅ Retiro Exitoso",
          `🎉 Tu retiro de RD$${amount.toLocaleString("es-DO")} ha sido procesado correctamente.\n\n💰 Monto debitado de tu cuenta\n🏦 Método: ${paymentMethod === "bank_transfer" ? "Transferencia Bancaria" : "USDT"}\n📧 Administrador notificado via sistema\n\n⏰ Tiempo de procesamiento: 24-48 horas\n📞 Contacta al admin si tienes dudas`,
          [
            {
              text: "Entendido",
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        throw new Error(
          result.error || "Error desconocido al procesar el retiro",
        );
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      Alert.alert(
        "❌ Error",
        `No se pudo procesar tu solicitud de retiro.\n\nDetalles: ${error.message || "Error desconocido"}\n\nPor favor intenta nuevamente o contacta al administrador.`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Use shared helpers imported from utils/
  const getStatusInfo = getWithdrawalStatusInfo;
  const formatDate = formatDateTime;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💸 Retirar Fondos</Text>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Ionicons name="time-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 40,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Balance Info */}
        <LinearGradient
          colors={["#10b981", "#059669"]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Balance Disponible</Text>
          <Text style={styles.balanceAmount}>{getFormattedBalance()}</Text>
          <View style={styles.withdrawalLimitInfo}>
            <Text style={styles.withdrawalLimitLabel}>
              {vipLevel.badge} Límite de retiro disponible
            </Text>
            <Text style={styles.withdrawalLimitAmount}>
              RD$
              {withdrawalRemaining.toLocaleString("es-DO", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </LinearGradient>

        {/* Withdrawal Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>💰 Cantidad a Retirar</Text>

          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>RD$</Text>
            <TextInput
              ref={amountRef}
              style={styles.amountInput}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              onFocus={() => scrollToInput(amountRef)}
            />
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {[100, 500, 1000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountButton}
                onPress={() => setWithdrawAmount(amount.toString())}
                disabled={amount > balance}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount > balance && styles.quickAmountTextDisabled,
                  ]}
                >
                  RD${amount.toLocaleString("es-DO")}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.quickAmountButton}
              onPress={() =>
                setWithdrawAmount(Math.floor(effectiveLimit).toString())
              }
              disabled={effectiveLimit <= 0}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  effectiveLimit <= 0 && styles.quickAmountTextDisabled,
                ]}
              >
                Máximo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method Selection */}
          <Text style={styles.sectionTitle}>🏦 Método de Pago</Text>

          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === "bank_transfer" && styles.paymentMethodActive,
              ]}
              onPress={() => setPaymentMethod("bank_transfer")}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color={
                  paymentMethod === "bank_transfer" ? "#ffffff" : "#6b7280"
                }
              />
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === "bank_transfer" &&
                    styles.paymentMethodTextActive,
                ]}
              >
                Transferencia Bancaria
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === "usdt" && styles.paymentMethodActive,
              ]}
              onPress={() => setPaymentMethod("usdt")}
            >
              <Ionicons
                name="logo-bitcoin"
                size={20}
                color={paymentMethod === "usdt" ? "#ffffff" : "#6b7280"}
              />
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === "usdt" && styles.paymentMethodTextActive,
                ]}
              >
                USDT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bank Transfer Form */}
          {paymentMethod === "bank_transfer" && (
            <View style={styles.bankForm}>
              <Text style={styles.formLabel}>Nombre del Banco</Text>
              <TextInput
                ref={bankNameRef}
                style={styles.textInput}
                value={bankInfo.bankName}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, bankName: text })
                }
                placeholder="Ej: Banco Popular"
                placeholderTextColor="#9ca3af"
                onFocus={() => scrollToInput(bankNameRef)}
              />

              <Text style={styles.formLabel}>Número de Cuenta</Text>
              <TextInput
                ref={accountNumberRef}
                style={styles.textInput}
                value={bankInfo.accountNumber}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, accountNumber: text })
                }
                placeholder="Ej: 1234567890"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                onFocus={() => scrollToInput(accountNumberRef)}
              />

              <Text style={styles.formLabel}>Titular de la Cuenta</Text>
              <TextInput
                ref={accountHolderRef}
                style={styles.textInput}
                value={bankInfo.accountHolder}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, accountHolder: text })
                }
                placeholder="Nombre completo del titular"
                placeholderTextColor="#9ca3af"
                onFocus={() => scrollToInput(accountHolderRef)}
              />
            </View>
          )}

          {/* USDT Form */}
          {paymentMethod === "usdt" && (
            <View style={styles.usdtForm}>
              <Text style={styles.formLabel}>Dirección USDT (TRC20)</Text>
              <TextInput
                ref={usdtRef}
                style={styles.textInput}
                value={usdtAddress}
                onChangeText={setUsdtAddress}
                placeholder="Ej: TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"
                placeholderTextColor="#9ca3af"
                onFocus={() => scrollToInput(usdtRef)}
              />
            </View>
          )}

          {/* Warning */}
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              El monto solicitado será debitado inmediatamente de tu cuenta. La
              transferencia será procesada por el administrador en 24-48 horas.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={processWithdrawal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cash-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Solicitar Retiro</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Historial de Retiros</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {walletLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>Cargando historial...</Text>
                </View>
              ) : withdrawals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
                  <Text style={styles.emptyText}>
                    No tienes retiros registrados
                  </Text>
                </View>
              ) : (
                withdrawals.map((withdrawal) => {
                  const statusInfo = getStatusInfo(withdrawal.status);
                  return (
                    <View key={withdrawal.id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyAmount}>
                          RD$
                          {withdrawal.amount.toLocaleString("es-DO", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusInfo.bgColor },
                          ]}
                        >
                          <Ionicons
                            name={statusInfo.icon}
                            size={12}
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

                      <Text style={styles.historyDate}>
                        {formatDate(withdrawal.created_at)}
                      </Text>

                      <Text style={styles.historyMethod}>
                        {withdrawal.payment_method === "usdt" ||
                        (withdrawal.user_notes &&
                          withdrawal.user_notes.includes("usdt"))
                          ? "💰 USDT (TRC20)"
                          : "🏦 Retiro Bancario"}
                      </Text>

                      {(withdrawal.admin_notes || withdrawal.user_notes) && (
                        <Text style={styles.historyNotes}>
                          📝 {withdrawal.admin_notes || withdrawal.user_notes}
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
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
  header: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  balanceNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  withdrawalLimitInfo: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  withdrawalLimitLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginBottom: 4,
  },
  withdrawalLimitAmount: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "700",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b7280",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    paddingVertical: 15,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  quickAmountTextDisabled: {
    color: "#9ca3af",
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    gap: 4,
    minHeight: 48,
  },
  paymentMethodActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    flexShrink: 1,
    textAlign: "center",
  },
  paymentMethodTextActive: {
    color: "#ffffff",
  },
  bankForm: {
    marginBottom: 20,
  },
  usdtForm: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff",
    marginBottom: 15,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#dc2626",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
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
    maxHeight: "80%",
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
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
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 15,
    textAlign: "center",
  },
  historyCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  historyMethod: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 5,
  },
  historyNotes: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
});

export default WithdrawalScreen;
