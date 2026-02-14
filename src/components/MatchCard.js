import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getSpacing,
  getBorderRadius,
  getIconSize,
  isSmallScreen,
} from "../utils/responsive";

const MatchCard = ({ match, featured = false }) => {
  return (
    <View style={[styles.container, featured && styles.featuredContainer]}>
      {featured && (
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>
            🔴 {match.time} Hora de Inicio 22:30 04/10
          </Text>
        </View>
      )}

      <View style={styles.matchHeader}>
        <View style={styles.teamContainer}>
          <View style={styles.teamInfo}>
            <View style={styles.teamIcon}>
              <Text style={styles.teamInitial}>
                {match.homeTeam ? match.homeTeam.charAt(0).toUpperCase() : "L"}
              </Text>
            </View>
            <Text style={styles.teamName}>{match.homeTeam}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.teamInfo}>
            <View style={[styles.teamIcon, styles.awayTeamIcon]}>
              <Text style={styles.teamInitial}>
                {match.awayTeam ? match.awayTeam.charAt(0).toUpperCase() : "V"}
              </Text>
            </View>
            <Text style={styles.teamName}>{match.awayTeam}</Text>
          </View>
        </View>

        {featured && (
          <View style={styles.volumeContainer}>
            <Text style={styles.volumeLabel}>Volumen:</Text>
            <Text style={styles.volumeValue}>{match.volume}</Text>
          </View>
        )}
      </View>

      {featured && (
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: getBorderRadius(12),
    padding: scaleWidth(15),
  },
  featuredContainer: {
    borderWidth: 2,
    borderColor: "#ec4899",
  },
  liveIndicator: {
    backgroundColor: "#ec4899",
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: getBorderRadius(16),
    alignSelf: "flex-start",
    marginBottom: getSpacing(0.75),
  },
  liveText: {
    color: "#ffffff",
    fontSize: scaleFont(12),
    fontWeight: "500",
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamInfo: {
    alignItems: "center",
    flex: 1,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  awayTeamIcon: {
    backgroundColor: "#dc2626",
  },
  teamInitial: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  teamName: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
    fontWeight: "500",
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b7280",
    marginHorizontal: 10,
  },
  volumeContainer: {
    alignItems: "flex-end",
  },
  volumeLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "60%",
    backgroundColor: "#10b981",
    borderRadius: 2,
  },
});

export default MatchCard;
