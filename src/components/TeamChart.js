import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TeamChart = ({ level1 = 0, level2 = 0, level3 = 0 }) => {
  const total = level1 + level2 + level3;

  // Si no hay referidos, mostrar gráfico vacío con texto
  if (total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <View style={[styles.emptyChart]} />
          <View style={styles.centerDot} />
        </View>
        <Text style={styles.totalText}>0</Text>
      </View>
    );
  }

  // Calcular porcentajes para el gráfico
  const p1 = (level1 / total) * 100;
  const p2 = (level2 / total) * 100;
  const p3 = (level3 / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {/* Fondo base */}
        <View style={[styles.segment, styles.segment4]} />
        {/* Nivel 3 - amarillo */}
        {level3 > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: "#fbbf24",
                width: `${Math.max(p3, 15)}%`,
                height: `${Math.max(p3, 15)}%`,
                bottom: 0,
                right: 0,
                borderBottomRightRadius: 30,
              },
            ]}
          />
        )}
        {/* Nivel 2 - rosa */}
        {level2 > 0 && (
          <View
            style={[
              styles.segment,
              {
                backgroundColor: "#ec4899",
                width: `${Math.max(p2, 20)}%`,
                height: `${Math.max(p2, 20)}%`,
                top: 0,
                right: 0,
                borderTopRightRadius: 30,
              },
            ]}
          />
        )}
        {/* Nivel 1 - cian (siempre aparece si hay datos) */}
        <View
          style={[
            styles.segment,
            {
              backgroundColor: "#06b6d4",
              width: `${Math.max(p1, 25)}%`,
              height: "100%",
              top: 0,
              left: 0,
              borderTopLeftRadius: 30,
              borderBottomLeftRadius: 30,
            },
          ]}
        />
        <View style={styles.centerDot} />
      </View>
      <Text style={styles.totalText}>{total}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  chartContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  emptyChart: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e5e7eb",
  },
  segment: {
    position: "absolute",
  },
  segment4: {
    backgroundColor: "#10b981",
    ...StyleSheet.absoluteFillObject,
  },
  centerDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    top: 26,
    left: 26,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  totalText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    marginTop: 2,
  },
});

export default TeamChart;
