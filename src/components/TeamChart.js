import React from 'react';
import { View, StyleSheet } from 'react-native';

const TeamChart = () => {
  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <View style={[styles.segment, styles.segment1]} />
        <View style={[styles.segment, styles.segment2]} />
        <View style={[styles.segment, styles.segment3]} />
        <View style={[styles.segment, styles.segment4]} />
        {/* Centro del círculo para mejor definición */}
        <View style={styles.centerDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    width: 60,
    height: 60,
    borderRadius: 30, // Círculo perfecto
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  segment: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  segment1: {
    backgroundColor: '#06b6d4',
    top: 0,
    left: 0,
    borderTopLeftRadius: 30,
  },
  segment2: {
    backgroundColor: '#ec4899',
    top: 0,
    right: 0,
    borderTopRightRadius: 30,
  },
  segment3: {
    backgroundColor: '#fbbf24',
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 30,
  },
  segment4: {
    backgroundColor: '#10b981',
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 30,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    top: 26,
    left: 26,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});

export default TeamChart;