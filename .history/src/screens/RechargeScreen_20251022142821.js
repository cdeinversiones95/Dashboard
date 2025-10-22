import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import {
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

const RechargeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null); // 'bank' o 'usdt'
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [rechargeAmounts, setRechargeAmounts] = useState([]);

  const BANKS = [
    { id: 1, name: 'Banco Banreservas', icon: '🏦' },
    { id: 2, name: 'Banco Popular Dominicano', icon: '🏦' },
    { id: 3, name: 'Banco BHD', icon: '🏦' },
  ];

  const MIN_AMOUNT = 1000;

  useEffect(() => {
    loadRechargeData();
  }, []);

  const loadRechargeData = async () => {
    try {
      // Cargar montos predeterminados
      const { data: amounts } = await supabase
        .from('recharge_amounts')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (amounts) {
        setRechargeAmounts(amounts);
      }

      // Cargar métodos de pago del sistema
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      if (methods) {
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Error loading recharge data:', error);
    }
  };

  const handleSubmitRecharge = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount < MIN_AMOUNT) {
      Alert.alert('Error', `El monto mínimo de recarga es RD$ ${MIN_AMOUNT.toLocaleString()}`);
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    if (selectedMethod === 'bank' && !selectedBank) {
      Alert.alert('Error', 'Por favor selecciona un banco');
      return;
    }

    setLoading(true);

    try {
      const paymentMethod = selectedMethod === 'bank'
        ? paymentMethods.find(m => m.account_info.bank_name === selectedBank.name)
        : paymentMethods.find(m => m.method_type === 'crypto');

      // Crear solicitud de depósito pendiente
      const { data, error } = await supabase
        .from('pending_deposits')
        .insert({
          user_id: user.id,
          amount: amount,
          payment_method_id: paymentMethod?.id,
          payment_reference: '',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        '✅ Solicitud Enviada',
        `Tu solicitud de recarga por RD$ ${amount.toLocaleString()} ha sido enviada.\n\nInstrucciones de pago:\n\n${getPaymentInstructions()}`,
        [
          {
            text: 'Entendido',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting recharge:', error);
      Alert.alert('Error', 'No se pudo procesar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentInstructions = () => {
    if (selectedMethod === 'bank' && selectedBank) {
      const bankInfo = paymentMethods.find(m => m.account_info.bank_name === selectedBank.name);
      return `${selectedBank.name}\nCuenta: ${bankInfo?.account_info.account_number}\nTitular: ${bankInfo?.account_info.account_holder}\n\nRealiza la transferencia y espera la aprobación del administrador.`;
    } else if (selectedMethod === 'usdt') {
      const usdtInfo = paymentMethods.find(m => m.method_type === 'crypto');
      return `Red: ${usdtInfo?.account_info.network}\nWallet: ${usdtInfo?.account_info.wallet_address}\n\nEnvía el USDT y espera la confirmación.`;
    }
    return '';
  };

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
        <Text style={styles.headerSubtitle}>Elige tu método de pago preferido</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selección de método de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Método de Pago</Text>
          
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'bank' && styles.methodCardSelected,
            ]}
            onPress={() => {
              setSelectedMethod('bank');
              setSelectedBank(null);
            }}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="business" size={32} color={selectedMethod === 'bank' ? '#3182ce' : '#64748b'} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Transferencia Bancaria</Text>
              <Text style={styles.methodSubtitle}>Banreservas, Popular, BHD</Text>
            </View>
            {selectedMethod === 'bank' && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'usdt' && styles.methodCardSelected,
            ]}
            onPress={() => {
              setSelectedMethod('usdt');
              setSelectedBank(null);
            }}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="logo-bitcoin" size={32} color={selectedMethod === 'usdt' ? '#3182ce' : '#64748b'} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>USDT (TRC20)</Text>
              <Text style={styles.methodSubtitle}>Criptomoneda estable</Text>
            </View>
            {selectedMethod === 'usdt' && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>
        </View>

        {/* Selección de banco (solo si método es bancario) */}
        {selectedMethod === 'bank' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Selecciona tu Banco</Text>
            {BANKS.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={[
                  styles.bankCard,
                  selectedBank?.id === bank.id && styles.bankCardSelected,
                ]}
                onPress={() => setSelectedBank(bank)}
              >
                <Text style={styles.bankIcon}>{bank.icon}</Text>
                <Text style={styles.bankName}>{bank.name}</Text>
                {selectedBank?.id === bank.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selección de monto */}
        {selectedMethod && (selectedMethod !== 'bank' || selectedBank) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedMethod === 'bank' ? '3' : '2'}. Monto a Recargar
            </Text>
            
            <Text style={styles.minAmountText}>
              Monto mínimo: RD$ {MIN_AMOUNT.toLocaleString()}
            </Text>

            <View style={styles.amountsGrid}>
              {rechargeAmounts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.amountButton,
                    selectedAmount === item.amount && styles.amountButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedAmount(item.amount);
                    setCustomAmount('');
                  }}
                >
                  <Text style={[
                    styles.amountText,
                    selectedAmount === item.amount && styles.amountTextSelected,
                  ]}>
                    RD$ {item.amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.orText}>o ingresa un monto personalizado</Text>

            <View style={styles.customAmountContainer}>
              <Text style={styles.currencySymbol}>RD$</Text>
              <TextInput
                style={styles.customAmountInput}
                placeholder="Ingresa monto"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedAmount(null);
                }}
              />
            </View>
          </View>
        )}

        {/* Botón de confirmar */}
        {selectedMethod && (selectedMethod !== 'bank' || selectedBank) && (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitRecharge}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#a0aec0', '#718096'] : ['#10b981', '#059669']}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.submitText}>
                    Solicitar Recarga
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3182ce" />
          <Text style={styles.infoText}>
            Las recargas son procesadas por un administrador. Recibirás una notificación cuando tu recarga sea aprobada.
          </Text>
        </View>
      </ScrollView>
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
  },
  section: {
    marginBottom: getSpacing(2),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: getSpacing(),
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: getSpacing(1.5),
    borderRadius: getBorderRadius(12),
    marginBottom: getSpacing(),
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  methodCardSelected: {
    borderColor: '#3182ce',
    backgroundColor: '#eff6ff',
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(),
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: scaleFont(12),
    color: '#64748b',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: getSpacing(1.25),
    borderRadius: getBorderRadius(10),
    marginBottom: getSpacing(0.75),
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  bankCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  bankIcon: {
    fontSize: 24,
    marginRight: getSpacing(),
  },
  bankName: {
    flex: 1,
    fontSize: scaleFont(15),
    fontWeight: '500',
    color: '#1e293b',
  },
  minAmountText: {
    fontSize: scaleFont(13),
    color: '#64748b',
    marginBottom: getSpacing(),
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(0.75),
    marginBottom: getSpacing(),
  },
  amountButton: {
    width: '48%',
    padding: getSpacing(1.25),
    backgroundColor: '#ffffff',
    borderRadius: getBorderRadius(10),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  amountButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  amountText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#64748b',
  },
  amountTextSelected: {
    color: '#10b981',
  },
  orText: {
    textAlign: 'center',
    fontSize: scaleFont(13),
    color: '#94a3b8',
    marginVertical: getSpacing(),
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: getBorderRadius(12),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: getSpacing(1.5),
  },
  currencySymbol: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#64748b',
    marginRight: getSpacing(0.5),
  },
  customAmountInput: {
    flex: 1,
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#1e293b',
    paddingVertical: getSpacing(1.25),
  },
  submitButton: {
    borderRadius: getBorderRadius(12),
    marginVertical: getSpacing(2),
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(1.5),
    gap: getSpacing(0.5),
  },
  submitText: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: getSpacing(1.25),
    borderRadius: getBorderRadius(10),
    borderLeftWidth: 4,
    borderLeftColor: '#3182ce',
    marginBottom: getSpacing(3),
  },
  infoText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#1e40af',
    marginLeft: getSpacing(0.75),
    lineHeight: 20,
  },
});

export default RechargeScreen;
