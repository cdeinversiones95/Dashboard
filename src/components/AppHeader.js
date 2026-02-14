import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useWallet } from "../hooks/useWallet";

/**
 * Header reutilizable con logo CDE, balance y botón de chat.
 * Reemplaza el header duplicado en EventsScreen y MyBetsScreen.
 */
const AppHeader = () => {
  const { getFormattedBalance } = useWallet();
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Ionicons name="football" size={22} color="#ffffff" />
        </View>
        <Text style={styles.logoText}>CDE</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.balanceButton}
          onPress={() => navigation.navigate("Perfil")}
          activeOpacity={0.7}
        >
          <Text style={styles.balanceAmount}>{getFormattedBalance()}</Text>
          <Ionicons name="wallet" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default AppHeader;
