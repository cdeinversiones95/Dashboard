import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MatchCard from '../components/MatchCard';
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
} from '../utils/responsive';
import { useWallet } from '../hooks/useWallet';

const EventsScreen = () => {
  const { getFormattedBalance } = useWallet();
  const [activeTab, setActiveTab] = useState('Popular');

  const matches = [
    {
      id: 1,
      homeTeam: 'Bitcoin',
      awayTeam: 'Ethereum',
      odds: [
        { type: '0:0', value: '5.15%', amount: '2.7M' },
        { type: '0:1', value: '4.87%', amount: '1.7M' },
        { type: '0:2', value: '2.41%', amount: '1.8M' },
        { type: '0:3', value: '0.84%', amount: '2.2M' },
        { type: '1:0', value: '5.94%', amount: '2.7M' },
        { type: '1:1', value: '6.11%', amount: '2.9M' },
        { type: '1:2', value: '2.68%', amount: '2.6M' },
        { type: '1:3', value: '0.76%', amount: '2.1M' },
        { type: '2:0', value: '3.16%', amount: '2.3M' },
        { type: '2:1', value: '2.97%', amount: '2.8M' },
        { type: '2:2', value: '2.53%', amount: '2.7M' },
        { type: '2:3', value: '2%', amount: '2.9M' },
        { type: '3:0', value: '1.19%', amount: '2.1M' },
      ],
      volume: '112.1B',
      time: '115\'47min 12s',
      status: 'live'
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
        {/* Promotion Banner */}
        <View style={styles.promotionBanner}>
          <Text style={styles.promotionTitle}>ACTIVIDAD DE PRIMERA INVERSIÓN DEL AGENTE</Text>
          <View style={styles.promotionRules}>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <Text key={item} style={styles.ruleText}>
                {item}. El subordinado recibirá 1 USD por la primera inversión de 10 USD, y el agente 0.5 USD.
              </Text>
            ))}
          </View>
          <View style={styles.promotionNote}>
            <Text style={styles.noteText}>
              NOTA: MIEMBROS ACTIVOS DEL AGENTE (NO RECIBIRÁN ESTE BONUS DEL 30%
            </Text>
          </View>
          <View style={styles.bonusInfo}>
            <Ionicons name="volume-high" size={16} color="#ffffff" />
            <Text style={styles.bonusText}>
              Obten un bonus del 6%. Si depositas USDT los miércoles, recibirás
            </Text>
          </View>
        </View>

        {/* Event Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Popular' && styles.activeTab]}
            onPress={() => setActiveTab('Popular')}
          >
            <Text style={[styles.tabText, activeTab === 'Popular' && styles.activeTabText]}>
              Inversiones Populares
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'More' && styles.activeTab]}
            onPress={() => setActiveTab('More')}
          >
            <Text style={[styles.tabText, activeTab === 'More' && styles.activeTabText]}>
              Más Inversiones
            </Text>
          </TouchableOpacity>
        </View>

        {/* Featured Match */}
        <View style={styles.featuredMatch}>
          <MatchCard match={matches[0]} featured={true} />
        </View>

        {/* Odds Grid */}
        <View style={styles.oddsGrid}>
          {matches[0].odds.map((odd, index) => (
            <TouchableOpacity key={index} style={styles.oddItem}>
              <Text style={styles.oddScore}>{odd.type}</Text>
              <Text style={styles.oddValue}>{odd.value}</Text>
              <Text style={styles.oddAmount}>{odd.amount}</Text>
              <TouchableOpacity style={styles.betButton}>
                <Text style={styles.betButtonText}>Invertir</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
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
    fontSize: scaleFont(isSmallScreen() ? 20 : 24),
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: getSpacing(0.5),
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: getBorderRadius(20),
    gap: getSpacing(0.5),
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1,
  },
  promotionBanner: {
    backgroundColor: '#1e40af',
    margin: 20,
    borderRadius: 12,
    padding: 15,
  },
  promotionTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  promotionRules: {
    marginBottom: 10,
  },
  ruleText: {
    color: '#ffffff',
    fontSize: 10,
    marginBottom: 2,
  },
  promotionNote: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  noteText: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
  },
  bonusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusText: {
    color: '#ffffff',
    fontSize: 10,
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ec4899',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
  },
  featuredMatch: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  oddsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 5,
  },
  oddItem: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  oddScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  oddValue: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  oddAmount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  betButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default EventsScreen;