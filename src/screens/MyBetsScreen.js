import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getHorizontalPadding,
  getSpacing,
  useSafeArea,
  getSafeBottomPadding,
  getSafeContainerStyle,
} from "../utils/responsive";
import { useWallet } from "../hooks/useWallet";
import { useCurrentUser } from "../hooks/useCurrentUser";
import EventsService from "../services/EventsService";
import AppHeader from "../components/AppHeader";
import {
  StatsBoxSkeleton,
  BetsListSkeleton,
} from "../components/SkeletonLoader";
import { getBetStatusColor, getBetStatusText } from "../utils/statusHelpers";
import {
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatCurrency as formatCurrencyUtil,
} from "../utils/formatters";
import { Colors } from "../constants/theme";

// Objeto theme para compatibilidad
const theme = {
  colors: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    success: Colors.success,
    danger: Colors.danger,
    warning: Colors.warning,
    background: Colors.background,
    surface: Colors.surface,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
  },
};

const CalendarModal = ({ visible, onClose, onSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const handleDayPress = (day) => {
    const selectedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    const formatted = selectedDate.toISOString().split("T")[0];
    onSelect(formatted);
    onClose();
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={styles.calendarDayCell}
          onPress={() => handleDayPress(i)}
        >
          <Text style={styles.calendarDayText}>{i}</Text>
        </TouchableOpacity>,
      );
    }

    return days;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.monthNavButton}
            >
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.monthNavButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>{renderDays()}</View>

          <TouchableOpacity
            style={styles.closeCalendarButton}
            onPress={onClose}
          >
            <Text style={styles.closeCalendarButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const MyBetsScreen = () => {
  const [dateString, setDateString] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [bets, setBets] = useState([]);
  const [betStats, setBetStats] = useState({
    totalBets: 0,
    totalAmount: 0,
    estimatedProfit: 0,
    pendingBets: 0,
    wonBets: 0,
    lostBets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { getFormattedBalance } = useWallet();
  const { userId, loading: userLoading } = useCurrentUser();
  const insets = useSafeArea();

  // Cargar apuestas del usuario cuando userId esté disponible
  useEffect(() => {
    if (userId) {
      loadUserBets();
      loadUserStats();
    }
  }, [userId]);

  // Función para cargar apuestas del usuario
  const loadUserBets = async (dateFilter = null) => {
    try {
      setLoading(true);

      if (!userId) {
        setBets([]);
        return;
      }

      // Obtener apuestas del usuario
      const { data: userBets, error } = await EventsService.getUserBets(
        userId,
        dateFilter,
      );

      if (error) {
        console.error("❌ Error cargando apuestas:", error);
        Alert.alert("Error", "No se pudieron cargar las apuestas");
        setBets([]);
        return;
      }

      setBets(userBets || []);
    } catch (error) {
      console.error("❌ Error cargando apuestas:", error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar estadísticas del usuario
  const loadUserStats = async () => {
    try {
      if (!userId) return;

      const { data: stats, error } =
        await EventsService.getUserBetStats(userId);

      if (error) {
        console.error("❌ Error cargando estadísticas:", error);
        return;
      }

      setBetStats(
        stats || {
          totalBets: 0,
          totalAmount: 0,
          estimatedProfit: 0,
          pendingBets: 0,
          wonBets: 0,
          lostBets: 0,
        },
      );
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
    }
  };

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserBets(dateString || null);
    await loadUserStats();
    setRefreshing(false);
  };

  // Use shared helpers from utils/
  const formatDate = formatDateUtil;
  const formatTime = formatTimeUtil;
  const getStatusColor = getBetStatusColor;
  const getStatusText = getBetStatusText;
  const formatCurrency = formatCurrencyUtil;

  // Renderizar componente de apuesta individual
  const renderBetItem = ({ item }) => (
    <View style={styles.betItem}>
      <View style={styles.betHeader}>
        <Text style={styles.betEventTitle}>
          {item.events?.title || "Evento no encontrado"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.betDetails}>
        <Text style={styles.betTeams}>
          {item.events?.team_a_name} vs {item.events?.team_b_name}
        </Text>
        <Text style={styles.betDate}>
          {formatDate(item.events?.match_time)} -{" "}
          {formatTime(item.events?.match_time)}
        </Text>
      </View>

      <View style={styles.betScoreInfo}>
        <Text style={styles.betScore}>
          Predicción: {item.betting_options?.score || "N/A"}
        </Text>
        <Text style={styles.betProfit}>
          Ganancia: {item.betting_options?.profit_percentage || 0}%
        </Text>
      </View>

      <View style={styles.betAmountInfo}>
        <View style={styles.betAmountRow}>
          <Text style={styles.amountLabel}>Monto:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.amount || 0)}
          </Text>
        </View>
        <View style={styles.betAmountRow}>
          <Text style={styles.amountLabel}>Ganancia estimada:</Text>
          <Text style={[styles.amountValue, { color: theme.colors.success }]}>
            {formatCurrency(item.potential_profit || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.betFooter}>
        <Text style={styles.betId}>ID: {item.id}</Text>
        <Text style={styles.betCreated}>
          Creada: {formatDate(item.created_at)} {formatTime(item.created_at)}
        </Text>
      </View>
    </View>
  );

  // Manejar cambio de fecha con filtrado real
  const handleDateTextChange = (text) => {
    // Permitir solo números y guiones
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;

    // Auto-formato YYYY-MM-DD
    if (cleaned.length > 4)
      formatted = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
    if (cleaned.length > 6)
      formatted = formatted.slice(0, 7) + "-" + cleaned.slice(6);

    if (formatted.length > 10) formatted = formatted.slice(0, 10);

    setDateString(formatted);

    // Si es una fecha válida completa, buscar
    if (formatted.length === 10) {
      loadUserBets(formatted);
    } else if (formatted.length === 0) {
      loadUserBets(null);
    }
  };

  // Función de navegación mejorada
  const goBack = () => {
    if (dateString) {
      setDateString("");
      loadUserBets(null);
    }
  };

  // Función para cancelar apuesta real
  const cancelBetAction = async (betId) => {
    try {
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado");
        return;
      }

      const { data, error } = await EventsService.cancelBet(betId, userId);

      if (error) {
        Alert.alert("Error", error);
        return;
      }

      Alert.alert("Éxito", "Apuesta cancelada exitosamente");
      // Recargar apuestas
      await loadUserBets(dateString || null);
      await loadUserStats();
    } catch (error) {
      console.error("❌ Error cancelando apuesta:", error);
      Alert.alert("Error", "No se pudo cancelar la apuesta");
    }
  };

  // Función para cancelar apuesta con confirmación
  const cancelBet = (betId) => {
    Alert.alert(
      "Cancelar Apuesta",
      "¿Estás seguro de que quieres cancelar esta apuesta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => cancelBetAction(betId),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header reutilizable */}
      <AppHeader />

      <View style={styles.content}>
        {/* Título de la página */}
        <View style={styles.pageTitle}>
          <Text style={styles.titleText}>Mis Trades</Text>
          <TouchableOpacity onPress={goBack} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Formulario de filtro por fecha */}
        <View style={styles.formContainer}>
          <View style={styles.dateFilterContainer}>
            <Text style={styles.filterLabel}>Filtrar por fecha</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={dateString}
                onChangeText={handleDateTextChange}
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.calendarIcon}
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          onSelect={(date) => {
            setDateString(date);
            loadUserBets(date);
          }}
        />

        {/* Contenido Principal */}
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Estadísticas Generales */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {betStats.totalBets}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Total Apuestas
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(betStats.totalAmount)}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Monto Total
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text
                style={[styles.statValue, { color: theme.colors.success }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(betStats.estimatedProfit)}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Ganancia Est.
              </Text>
            </View>
          </View>

          {/* Estado de las Apuestas */}
          <View style={styles.statusStatsContainer}>
            <View style={styles.statusStatBox}>
              <Text style={[styles.statusStatValue, { color: "#FFA500" }]}>
                {betStats.pendingBets}
              </Text>
              <Text style={styles.statusStatLabel}>Pendientes</Text>
            </View>
            <View style={styles.statusStatBox}>
              <Text style={[styles.statusStatValue, { color: "#00FF00" }]}>
                {betStats.wonBets}
              </Text>
              <Text style={styles.statusStatLabel}>Ganadas</Text>
            </View>
            <View style={styles.statusStatBox}>
              <Text style={[styles.statusStatValue, { color: "#FF0000" }]}>
                {betStats.lostBets}
              </Text>
              <Text style={styles.statusStatLabel}>Perdidas</Text>
            </View>
          </View>

          {/* Lista de Apuestas */}
          <View style={styles.betsSection}>
            <Text style={styles.sectionTitle}>Mis Apuestas</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <StatsBoxSkeleton />
                <BetsListSkeleton count={3} />
              </View>
            ) : bets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Sin registros</Text>
                <Text style={styles.emptySubtext}>
                  No tienes apuestas registradas
                </Text>
              </View>
            ) : (
              bets.map((item) => (
                <View key={item.id.toString()}>{renderBetItem({ item })}</View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelect={(date) => {
          setDateString(date);
          loadUserBets(date);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },

  // Header Styles (similar al anterior)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    backgroundColor: "#2563eb",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  balanceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  messageButton: {
    padding: 8,
  },

  // Content Styles
  content: {
    flex: 1,
  },

  // Page Title Styles (adaptado del HTML)
  pageTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  closeButton: {
    padding: 5,
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
  },

  // Form Container (para el filtro de fecha)
  formContainer: {
    backgroundColor: "#ffffff",
    margin: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateFilterContainer: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  dateInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  calendarIcon: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#d1d5db",
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Estadísticas Container
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    margin: 15,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },

  // Status Stats Container
  statusStatsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusStatBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  statusStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusStatLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },

  // Bets Section
  betsSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 15,
  },

  // Loading Container
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },

  // Empty Container
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },

  // Bet Item
  betItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  betHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  betEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  betDetails: {
    marginBottom: 10,
  },
  betTeams: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 4,
  },
  betDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  betScoreInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  betScore: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  betProfit: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: "600",
  },
  betAmountInfo: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  betAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "600",
  },
  betFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  betId: {
    fontSize: 11,
    color: "#9ca3af",
  },
  betCreated: {
    fontSize: 11,
    color: "#9ca3af",
  },

  // Calendar Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 350,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  monthNavButton: {
    padding: 5,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekDayLabel: {
    width: 35,
    textAlign: "center",
    fontWeight: "600",
    color: "#6b7280",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDayCell: {
    width: "14.28%", // 100% / 7
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  calendarDayText: {
    fontSize: 16,
    color: "#1f2937",
  },
  closeCalendarButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
  },
  closeCalendarButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
});

export default MyBetsScreen;
