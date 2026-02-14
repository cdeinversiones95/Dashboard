import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Animated,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getHorizontalPadding,
  getVerticalPadding,
  getSpacing,
  getBorderRadius,
  isSmallScreen,
  getIconSize,
  useSafeArea,
  getSafeBottomPadding,
  getSafeContainerStyle,
} from "../utils/responsive";
import { useWallet } from "../hooks/useWallet";
import { useCurrentUser } from "../hooks/useCurrentUser";
import EventsService from "../services/EventsService";
import AppHeader from "../components/AppHeader";
import { EventSkeleton } from "../components/SkeletonLoader";

// Componente con animación stagger para filas de apuestas
const AnimatedBettingRow = ({ option, index, onPress }) => {
  const rowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rowAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: rowAnim,
        transform: [
          {
            translateY: rowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.bettingRow}>
        <View style={styles.bettingInfo}>
          <Text style={styles.scoreText}>{option.score}</Text>
          <Text style={styles.profitText}>{option.profit_percentage}%</Text>
          <Text style={styles.volumeText}>{option.volume || "N/A"}</Text>
        </View>
        <TouchableOpacity
          style={styles.betButton}
          onPress={() => onPress(option)}
        >
          <Text style={styles.betButtonText}>Bet</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const EventsScreen = () => {
  const { getFormattedBalance, balance, refreshBalance } = useWallet();
  const { userId, loading: userLoading } = useCurrentUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [estimatedProfit, setEstimatedProfit] = useState("0");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const insets = useSafeArea();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Cargar eventos al montar el componente y configurar subscripción en tiempo real
  useEffect(() => {
    loadEvents(true); // Mostrar loading inicial

    // 🔄 SUSCRIPCIÓN EN TIEMPO REAL para actualizaciones automáticas
    const subscription = EventsService.subscribeToEvents((table, payload) => {
      // Recargar eventos cuando hay cambios (sin mostrar loading)
      loadEvents(false);

      // Mostrar notificación al usuario sobre nuevos eventos
      if (payload.eventType === "INSERT" && table === "events") {
        Alert.alert(
          "🆕 Nuevo Evento Disponible",
          `Se agregó: ${payload.new?.title || "Nuevo evento de apuestas"}`,
          [
            { text: "Más tarde", style: "cancel" },
            {
              text: "Ver ahora",
              onPress: () => {
                // Forzar recarga y ir al nuevo evento
                loadEvents().then(() => {
                  // Si hay eventos, ir al más reciente
                  if (events.length > 0) {
                    setCurrentEventIndex(0);
                  }
                });
              },
            },
          ],
        );
      }
    });

    // Cleanup al desmontar componente
    return () => {
      EventsService.unsubscribeFromEvents();
    };
  }, []);

  // Función para cargar eventos desde Supabase (mejorada con opciones)
  const loadEvents = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const { data, error } = await EventsService.getActiveEvents();

      if (error) {
        console.error("❌ Error cargando eventos:", error);
        Alert.alert(
          "Error de Conexión",
          "No se pudieron cargar los eventos. ¿Verificar conexión?",
          [
            { text: "Reintentar", onPress: () => loadEvents(true) },
            { text: "Más tarde", style: "cancel" },
          ],
        );
        return;
      }

      if (data && data.length > 0) {
        setEvents(data);
        setCurrentEventIndex(0);
      } else {
        setEvents([]);
        setCurrentEventIndex(0);
      }
    } catch (error) {
      console.error("❌ Error cargando eventos:", error);
      Alert.alert("Error", "Error de conexión a la base de datos");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Función de refresh manual (pull-to-refresh)
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Función para refrescar eventos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Obtener evento actual - SOLO EVENTOS REALES
  const getCurrentEvent = () => {
    if (events.length === 0) return null;
    return events[currentEventIndex] || null;
  };

  const currentEvent = getCurrentEvent();

  // Función para abrir modal de apuesta
  const openBetModal = (option) => {
    setSelectedBet(option);

    // Calcular ganancia estimada con el balance completo
    if (balance > 0) {
      const profitPercentage =
        option.profit_percentage ||
        parseFloat((option.profit || "0").replace("%", ""));
      const profit = (balance * profitPercentage) / 100;
      setEstimatedProfit(
        profit.toLocaleString("es-DO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    } else {
      setEstimatedProfit("0");
    }

    setModalVisible(true);
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Función para cerrar modal
  const closeBetModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedBet(null);
      setEstimatedProfit("0");
    });
  };

  // Realizar apuesta
  const placeBet = async () => {
    try {
      // Usar userId del hook useCurrentUser
      if (!userId) {
        Alert.alert("Error", "Debes iniciar sesión para realizar una apuesta");
        return;
      }

      // Verificar que el usuario tenga saldo
      if (balance <= 0) {
        Alert.alert(
          "Error",
          "No tienes saldo suficiente para realizar esta apuesta",
        );
        return;
      }

      // Realizar apuesta usando EventsService con el saldo completo
      const { data, error } = await EventsService.placeBet(
        userId,
        currentEvent.id,
        selectedBet.id,
        balance, // Usar el saldo completo
      );

      if (error) {
        Alert.alert("Error", error);
        return;
      }

      // Refrescar el saldo después de la apuesta exitosa
      await refreshBalance();

      Alert.alert(
        "Apuesta Realizada",
        `Apuesta de ${getFormattedBalance()} en ${selectedBet.score} realizada exitosamente!\n\nGanancia estimada: RD$${estimatedProfit}`,
        [{ text: "OK", onPress: closeBetModal }],
      );
    } catch (error) {
      console.error("Error realizando apuesta:", error);
      Alert.alert("Error", "Ocurrió un error al procesar la apuesta");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header reutilizable */}
      <AppHeader />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#6b8aff"]} // Android
            tintColor="#6b8aff" // iOS
          />
        }
      >
        {/* Título del evento */}
        <View style={styles.eventTitle}>
          <Text style={styles.titleText}>Detalles del Evento</Text>
        </View>

        {/* Imagen del evento y detalles del partido */}
        {currentEvent ? (
          <View style={styles.eventContainer}>
            <Image
              source={{ uri: currentEvent.event_image }}
              style={styles.eventImage}
            />

            <View style={styles.matchInfo}>
              <Text style={styles.leagueText}>
                {currentEvent.league || "Liga Principal"}
              </Text>

              {/* Información de fecha y hora del partido */}
              <View style={styles.matchTimeContainer}>
                <View style={styles.timeInfo}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={styles.matchDateText}>
                    {currentEvent.match_time
                      ? new Date(currentEvent.match_time).toLocaleDateString(
                          "es-ES",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : "Fecha por confirmar"}
                  </Text>
                </View>
                <View style={styles.timeInfo}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.matchTimeText}>
                    {currentEvent.match_time
                      ? new Date(currentEvent.match_time).toLocaleTimeString(
                          "es-ES",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Hora por confirmar"}
                  </Text>
                </View>
              </View>

              <View style={styles.teamsContainer}>
                <View style={styles.teamSection}>
                  <Image
                    source={{ uri: currentEvent.team_a_logo }}
                    style={styles.teamLogo}
                  />
                  <Text style={styles.teamName}>
                    {currentEvent.team_a_name}
                  </Text>
                </View>

                <View style={styles.vsSection}>
                  <Text style={styles.vsText}>vs</Text>
                </View>

                <View style={styles.teamSection}>
                  <Image
                    source={{ uri: currentEvent.team_b_logo }}
                    style={styles.teamLogo}
                  />
                  <Text style={styles.teamName}>
                    {currentEvent.team_b_name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Encabezados de la tabla de apuestas */}
            <View style={styles.bettingHeader}>
              <View style={styles.headerRow}>
                <Text style={styles.headerLabel}>Proyecto</Text>
                <Text style={styles.headerLabel}>Ganancia</Text>
                <Text style={styles.headerLabel}>Volumen Negociable</Text>
              </View>
              <Text style={styles.actionHeader}>Apostar</Text>
            </View>

            {/* Lista de opciones de apuesta con stagger */}
            <View style={styles.bettingOptions}>
              {currentEvent?.betting_options?.map((option, index) => (
                <AnimatedBettingRow
                  key={index}
                  option={option}
                  index={index}
                  onPress={openBetModal}
                />
              )) || (
                <View style={styles.noBetsContainer}>
                  <Text style={styles.noBetsText}>
                    No hay opciones de apuesta disponibles
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : loading ? (
          <EventSkeleton />
        ) : (
          <View style={styles.noEventsContainer}>
            <View style={styles.noEventsIcon}>
              <Text style={styles.noEventsEmoji}>⚽</Text>
            </View>
            <Text style={styles.noEventsTitle}>
              No hay eventos de inversión
            </Text>
            <Text style={styles.noEventsSubtitle}>
              Por el momento no hay partidos disponibles para apostar.{"\n"}
              Los eventos aparecerán aquí cuando sean creados desde el
              dashboard.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de apuesta */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeBetModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bet {currentEvent?.team_a_name || "Equipo A"} vs.{" "}
                {currentEvent?.team_b_name || "Equipo B"}
              </Text>
              <TouchableOpacity
                onPress={closeBetModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Información del partido en el modal */}
            <View style={styles.modalMatchInfo}>
              <View style={styles.modalTeam}>
                <Image
                  source={{ uri: currentEvent?.team_a_logo }}
                  style={styles.modalTeamLogo}
                />
                <Text style={styles.modalTeamName}>
                  {currentEvent?.team_a_name}
                </Text>
              </View>

              <View style={styles.modalProfitInfo}>
                <Text style={styles.modalProfitText}>
                  {selectedBet?.profit_percentage}%
                </Text>
              </View>

              <View style={styles.modalTeam}>
                <Image
                  source={{ uri: currentEvent?.team_b_logo }}
                  style={styles.modalTeamLogo}
                />
                <Text style={styles.modalTeamName}>
                  {currentEvent?.team_b_name}
                </Text>
              </View>
            </View>

            {/* Formulario de apuesta */}
            <View style={styles.modalContent}>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Monto de la Transacción</Text>
                  <TextInput
                    style={[styles.amountInput, styles.disabledInput]}
                    value={getFormattedBalance()}
                    editable={false}
                    placeholder="Saldo completo"
                  />
                  <Text style={styles.helperText}>
                    Se apostará todo el saldo disponible
                  </Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ganancia</Text>
                  <TextInput
                    style={styles.profitInput}
                    value={selectedBet?.profit || "0"}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.estimateSection}>
                <View style={styles.estimateHeader}>
                  <Text style={styles.estimateLabel}>Ganancia Estimada</Text>
                  <Text style={styles.feeText}>0% Tarifa de Gestión</Text>
                </View>
                <TextInput
                  style={styles.estimateInput}
                  value={estimatedProfit}
                  placeholder="0"
                  editable={false}
                />
              </View>

              {/* Saldo disponible */}
              <View style={styles.availableBalance}>
                <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                <Text style={styles.balanceValue}>{getFormattedBalance()}</Text>
              </View>
            </View>

            {/* Botón de realizar apuesta */}
            <TouchableOpacity style={styles.placeBetButton} onPress={placeBet}>
              <Text style={styles.placeBetText}>Realizar Apuesta</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },

  // Header Styles
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
  eventTitle: {
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
    textAlign: "center",
  },

  // Event Container Styles
  eventContainer: {
    backgroundColor: "#ffffff",
    margin: 15,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  matchInfo: {
    padding: 20,
  },
  leagueText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 10,
  },
  // Estilos para fecha y hora del partido
  matchTimeContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  matchDateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  matchTimeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 6,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamSection: {
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
  },
  vsSection: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b7280",
  },

  // Betting Header Styles
  bettingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    flex: 1,
  },
  headerLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  actionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    width: 60,
    textAlign: "center",
  },

  // Betting Options Styles
  bettingOptions: {
    paddingBottom: 20,
  },
  bettingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  bettingInfo: {
    flexDirection: "row",
    flex: 1,
  },
  scoreText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  profitText: {
    flex: 1,
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
  },
  volumeText: {
    flex: 1,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  betButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    width: 60,
  },
  betButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalMatchInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  modalTeam: {
    alignItems: "center",
    flex: 1,
  },
  modalTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  modalTeamName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
  },
  modalProfitInfo: {
    paddingHorizontal: 20,
  },
  modalProfitText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
    textAlign: "center",
  },
  modalContent: {
    padding: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },
  disabledInput: {
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  profitInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  estimateSection: {
    marginBottom: 20,
  },
  estimateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  feeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  estimateInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "#f9fafb",
    color: "#059669",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  availableBalance: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  placeBetButton: {
    backgroundColor: "#3b82f6",
    margin: 20,
    marginTop: 0,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  placeBetText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  // Estilos para cuando no hay eventos
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#ffffff",
    margin: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noEventsIcon: {
    backgroundColor: "#f3f4f6",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noEventsEmoji: {
    fontSize: 40,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 10,
  },
  noEventsSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  noBetsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noBetsText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default EventsScreen;
