import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getSpacing,
  getBorderRadius,
  getIconSize,
  isSmallScreen,
  getHorizontalPadding,
} from '../utils/responsive';

const BetCard = ({ bet }) => {
  return (
    <View style={styles.container}>
      {/* Bet Amount and Profit */}
      <View style={styles.topSection}>
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Cantidad Invertida</Text>
            <View style={styles.statusContainer}>
              <Ionicons 
                name={bet.status === 'Canceled' ? 'close-circle' : 'checkmark-circle'} 
                size={getIconSize(16)} 
                color={bet.statusColor} 
              />
              <Text style={[styles.statusText, { color: bet.statusColor }]}>
                {bet.status}
              </Text>
            </View>
          </View>
          <Text style={styles.amount}>{bet.betAmount}</Text>
        </View>
        
        <View style={styles.profitSection}>
          <Text style={styles.label}>
            {bet.estimatedProfit ? 'Ganancia Estimada' : 'Ganancia Real'}
          </Text>
          <Text style={styles.profit}>
            {bet.estimatedProfit || bet.actualProfit}
          </Text>
        </View>
      </View>

      {/* Bet Details */}
      <View style={styles.detailsSection}>
        <View style={styles.betNumberRow}>
          <Text style={styles.label}>Número de Operación</Text>
          {bet.isWin && (
            <View style={styles.winBadge}>
              <Ionicons name="trophy" size={12} color="#ffffff" />
              <Text style={styles.winText}>Liquidado</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.betNumberContainer}>
          <Text style={styles.betNumber}>{bet.betNumber}</Text>
          <Ionicons name="copy-outline" size={16} color="#06b6d4" />
        </TouchableOpacity>

        <Text style={styles.bettingLabel}>Contenido de la Inversión</Text>
        
        <TouchableOpacity style={styles.matchContainer}>
          <Text style={styles.matchText}>{bet.match}</Text>
          <Ionicons name="trending-up-outline" size={16} color="#6b7280" />
        </TouchableOpacity>

        {/* Match Details */}
        <View style={styles.matchDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Resultado</Text>
            <Text style={styles.detailValue}>{bet.score}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Probabilidades</Text>
            <Text style={styles.detailValue}>{bet.odds}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Estado</Text>
            <Text style={[styles.detailValue, { color: bet.statusColor }]}>
              {bet.status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: getBorderRadius(12),
    padding: scaleWidth(15),
    marginBottom: getSpacing(),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: getSpacing(),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  amountSection: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  profitSection: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profit: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  detailsSection: {
    paddingTop: 15,
  },
  betNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  winBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  winText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  betNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  betNumber: {
    fontSize: 12,
    color: '#06b6d4',
    flex: 1,
  },
  bettingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  matchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderRadius: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
});

export default BetCard;