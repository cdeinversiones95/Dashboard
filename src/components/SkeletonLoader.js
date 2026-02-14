import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
  isSmallScreen,
} from "../utils/responsive";

// ─── Bloque base con shimmer ───────────────────────────────────────────
const SkeletonBlock = ({ width, height, borderRadius = 8, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#e2e8f0",
        },
        { opacity },
        style,
      ]}
    />
  );
};

// ─── Skeleton para StatsCard (HomeScreen) ──────────────────────────────
export const StatsCardSkeleton = () => (
  <View style={skeletonStyles.statsCard}>
    <SkeletonBlock
      width={20}
      height={20}
      borderRadius={10}
      style={{ alignSelf: "flex-end" }}
    />
    <SkeletonBlock width="60%" height={10} style={{ marginTop: "auto" }} />
    <SkeletonBlock width="80%" height={16} style={{ marginTop: 6 }} />
  </View>
);

export const HomeStatsSkeleton = () => (
  <>
    <View style={skeletonStyles.statsGrid}>
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </View>
    <View style={skeletonStyles.statsRow}>
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </View>
  </>
);

// ─── Skeleton para EventsScreen ────────────────────────────────────────
export const EventSkeleton = () => (
  <View style={skeletonStyles.eventContainer}>
    {/* Imagen */}
    <SkeletonBlock width="100%" height={180} borderRadius={12} />

    {/* Info del partido */}
    <View style={skeletonStyles.matchInfoSkeleton}>
      <SkeletonBlock width="40%" height={14} style={{ alignSelf: "center" }} />

      <View style={skeletonStyles.teamsSkeleton}>
        <View style={skeletonStyles.teamBlock}>
          <SkeletonBlock width={50} height={50} borderRadius={25} />
          <SkeletonBlock width={70} height={12} style={{ marginTop: 8 }} />
        </View>
        <SkeletonBlock width={30} height={20} borderRadius={6} />
        <View style={skeletonStyles.teamBlock}>
          <SkeletonBlock width={50} height={50} borderRadius={25} />
          <SkeletonBlock width={70} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>

    {/* Opciones de apuesta */}
    <View style={skeletonStyles.bettingRows}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.bettingRow}>
          <SkeletonBlock width="25%" height={14} />
          <SkeletonBlock width="20%" height={14} />
          <SkeletonBlock width="25%" height={14} />
          <SkeletonBlock width={50} height={30} borderRadius={6} />
        </View>
      ))}
    </View>
  </View>
);

// ─── Skeleton para MyBetsScreen ────────────────────────────────────────
export const BetItemSkeleton = () => (
  <View style={skeletonStyles.betItem}>
    <View style={skeletonStyles.betHeader}>
      <SkeletonBlock width="55%" height={16} />
      <SkeletonBlock width={70} height={22} borderRadius={12} />
    </View>
    <SkeletonBlock width="70%" height={12} style={{ marginTop: 10 }} />
    <SkeletonBlock width="50%" height={12} style={{ marginTop: 6 }} />
    <View style={skeletonStyles.betAmountRow}>
      <SkeletonBlock width="30%" height={14} />
      <SkeletonBlock width="25%" height={14} />
    </View>
  </View>
);

export const BetsListSkeleton = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <BetItemSkeleton key={i} />
    ))}
  </View>
);

// ─── Skeleton para stats boxes (MyBetsScreen) ──────────────────────────
export const StatsBoxSkeleton = () => (
  <View style={skeletonStyles.statsBoxContainer}>
    <View style={skeletonStyles.statsBoxRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.statBox}>
          <SkeletonBlock
            width="60%"
            height={20}
            style={{ alignSelf: "center" }}
          />
          <SkeletonBlock
            width="80%"
            height={10}
            style={{ alignSelf: "center", marginTop: 6 }}
          />
        </View>
      ))}
    </View>
    <View style={skeletonStyles.statsBoxRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.statBox}>
          <SkeletonBlock
            width="50%"
            height={18}
            style={{ alignSelf: "center" }}
          />
          <SkeletonBlock
            width="70%"
            height={10}
            style={{ alignSelf: "center", marginTop: 6 }}
          />
        </View>
      ))}
    </View>
  </View>
);

// ─── Estilos ────────────────────────────────────────────────────────────
const skeletonStyles = StyleSheet.create({
  // StatsCard skeleton
  statsCard: {
    flex: 1,
    borderRadius: getBorderRadius(12),
    padding: scaleWidth(15),
    minHeight: scaleHeight(isSmallScreen() ? 100 : 120),
    backgroundColor: "#f1f5f9",
    justifyContent: "space-between",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: scaleHeight(16),
    gap: getSpacing(0.625),
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: getSpacing(0.625),
    gap: getSpacing(0.625),
  },

  // Event skeleton
  eventContainer: {
    backgroundColor: "#ffffff",
    margin: 15,
    borderRadius: 12,
    padding: 15,
    overflow: "hidden",
  },
  matchInfoSkeleton: {
    paddingVertical: 15,
    gap: 15,
  },
  teamsSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  teamBlock: {
    alignItems: "center",
  },
  bettingRows: {
    gap: 10,
    marginTop: 10,
  },
  bettingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  // Bet item skeleton
  betItem: {
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
  },
  betHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  betAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  // Stats box skeleton
  statsBoxContainer: {
    gap: 10,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  statsBoxRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
});

export default SkeletonBlock;
