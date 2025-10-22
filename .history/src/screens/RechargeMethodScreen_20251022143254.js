import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

const RechargeMethodScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2d5a87', '#3182ce']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 Recargar Balance</Text>
        <Text style={styles.headerSubtitle}>Selecciona tu método de pago</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.methodCard}
          onPress={() => navigation.navigate('BankTransfer')}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.methodGradient}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="business" size={48} color="#ffffff" />
            </View>
            <Text style={styles.methodTitle}>Transferencia Bancaria</Text>
            <Text style={styles.methodSubtitle}>
              Banreservas • Popular • BHD
            </Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.methodCard}
          onPress={() => navigation.navigate('USDTTransfer')}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.methodGradient}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="logo-bitcoin" size={48} color="#ffffff" />
            </View>
            <Text style={styles.methodTitle}>USDT (TRC20)</Text>
            <Text style={styles.methodSubtitle}>
              Criptomoneda estable
            </Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3182ce" />
          <Text style={styles.infoText}>
            Monto mínimo de recarga: RD$ 1,000
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: getHorizontalPadding(),
  },
  backButton: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: scaleFont(28),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: '#e2e8f0',
  },
  content: {
    flex: 1,
    padding: getHorizontalPadding(),
    paddingTop: getSpacing(3),
  },
  methodCard: {
    marginBottom: getSpacing(2),
    borderRadius: getBorderRadius(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  methodGradient: {
    padding: getSpacing(2.5),
    alignItems: 'center',
    position: 'relative',
  },
  methodIcon: {
    marginBottom: getSpacing(1.5),
  },
  methodTitle: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  methodSubtitle: {
    fontSize: scaleFont(14),
    color: 'rgba(255,255,255,0.9)',
  },
  arrowContainer: {
    position: 'absolute',
    right: getSpacing(2),
    top: '50%',
    marginTop: -12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: getSpacing(1.5),
    borderRadius: getBorderRadius(12),
    borderLeftWidth: 4,
    borderLeftColor: '#3182ce',
    marginTop: getSpacing(2),
  },
  infoText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#1e40af',
    marginLeft: getSpacing(0.75),
    fontWeight: '500',
  },
});

export default RechargeMethodScreen;
