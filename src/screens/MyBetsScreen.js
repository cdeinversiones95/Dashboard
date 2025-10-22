import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BetCard from '../components/BetCard';
import {
  getHorizontalPadding,
  getSpacing,
} from '../utils/responsive';
import { useWallet } from '../hooks/useWallet';

const MyBetsScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  const { getFormattedBalance } = useWallet();

  const bets = [
    {
      id: 1,
      betAmount: 106.54,
      estimatedProfit: 2.56,
      betNumber: '#202510071520955148',
      match: 'Bitcoin VS Ethereum',
      score: '3-1',
      odds: '2.53%',
      status: 'Cancelado',
      statusColor: '#dc2626'
    },
    {
      id: 2,
      betAmount: 104.03,
      actualProfit: 2.51,
      betNumber: '#202510061846945980',
      match: 'Tesla VS Apple Stock',
      score: '3-3',
      odds: '2.54%',
      status: 'Liquidado',
      statusColor: '#10b981',
      isWin: true
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="trending-up" size={24} color="#2563eb" />
          <Text style={styles.logoText}>CDE</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>{getFormattedBalance().replace('$', '')}</Text>
          <Ionicons name="refresh" size={16} color="#10b981" />
          <Ionicons name="chatbubble-outline" size={16} color="#2563eb" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.dateSelector}>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <Text style={styles.dateSelectorText}>Seleccionar Fecha</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>Todos</Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Bet List Header */}
                {/* Investment List Header */}
        <Text style={styles.sectionTitle}>Lista de Inversiones</Text>

        {/* Bet Cards */}
        {bets.map((bet) => (
          <BetCard key={bet.id} bet={bet} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 60, // Padding superior controlado manualmente
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getHorizontalPadding(),
    paddingTop: 10, // Padding mínimo ya que el container controla la posición
    paddingBottom: 15, // Padding inferior moderado
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    gap: 10,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  dateSelectorText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
    minWidth: 80,
  },
  filterText: {
    fontSize: 14,
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
});

export default MyBetsScreen;