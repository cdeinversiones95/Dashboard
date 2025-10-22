import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getSpacing,
  getBorderRadius,
  getIconSize,
  isSmallScreen,
} from '../utils/responsive';

const StatsCard = ({ title, value, color, icon, fullWidth = true }) => {
  return (
    <View style={[
      styles.container,
      { backgroundColor: color },
      fullWidth ? styles.fullWidth : styles.halfWidth
    ]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={getIconSize(20)} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: getBorderRadius(12),
    padding: scaleWidth(15),
    minHeight: scaleHeight(isSmallScreen() ? 100 : 120),
    justifyContent: 'space-between',
  },
  fullWidth: {
    flex: 1,
  },
  halfWidth: {
    flex: 1,
  },
  iconContainer: {
    alignSelf: 'flex-end',
  },
  title: {
    fontSize: scaleFont(12),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: getSpacing(0.3),
  },
  value: {
    fontSize: scaleFont(isSmallScreen() ? 24 : 32),
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default StatsCard;