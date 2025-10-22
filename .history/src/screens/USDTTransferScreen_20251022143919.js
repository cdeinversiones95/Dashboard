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

const USDTTransferScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [rechargeAmounts, setRechargeAmounts] = useState([]);

  const MIN_AMOUNT = 1000;

  useEffect(() => {
    loadRechargeData();
  }, []);

  const loadRechargeData = async () => {
    try {
      const { data: amounts } = await supabase
        .from('recharge_amounts')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (amounts) {
        setRechargeAmounts(amounts);
      }

      const { data: method } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .eq('method_type', 'crypto')
        .single();

      if (method) {
        setPaymentMethod(method);
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

    setLoading(true);

    try {
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

      const usdtInfo = paymentMethod?.account_info;
      Alert.alert(
        '✅ Solicitud Enviada',
        `Tu solicitud de recarga por RD$ ${amount.toLocaleString()} ha sido enviada.\n\n📋 Instrucciones de Pago:\n\n💰 Moneda: ${usdtInfo?.currency}\n🌐 Red: ${usdtInfo?.network}\n📱 Wallet:\n${usdtInfo?.wallet_address}\n\nEnvía el USDT equivalente y espera la confirmación del administrador.`,
        [
          {
            text: 'Entendido',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#065f46', '#059669', '#10b981']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 USDT (TRC20)</Text>
        <Text style={styles.headerSubtitle}>Recarga con criptomoneda</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cryptoInfoCard}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.cryptoGradient}
          >
            <Ionicons name="logo-bitcoin" size={48} color="#ffffff" />
            <Text style={styles.cryptoTitle}>USDT - Tether</Text>
            <Text style={styles.cryptoSubtitle}>Red TRC20 (TRON)</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monto a Recargar</Text>
          
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

        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            <Text style={styles.warningBold}>Importante:</Text> Asegúrate de enviar USDT únicamente a través de la red TRC20. Envíos por otras redes no serán procesados.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            Recibirás la dirección de wallet después de confirmar tu solicitud. El administrador procesará tu recarga una vez confirmada la transacción en la blockchain.
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
    color: '#d1fae5',
  },
  content: {
    flex: 1,
    padding: getHorizontalPadding(),
  },
  cryptoInfoCard: {
    marginBottom: getSpacing(2),
    borderRadius: getBorderRadius(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  cryptoGradient: {
    padding: getSpacing(2.5),
    alignItems: 'center',
  },
  cryptoTitle: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: getSpacing(),
    marginBottom: 4,
  },
  cryptoSubtitle: {
    fontSize: scaleFont(14),
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: getSpacing(2),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: getSpacing(1.5),
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: getSpacing(1.25),
    borderRadius: getBorderRadius(10),
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: getSpacing(1.5),
  },
  warningText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#92400e',
    marginLeft: getSpacing(0.75),
    lineHeight: 20,
  },
  warningBold: {
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: getSpacing(1.25),
    borderRadius: getBorderRadius(10),
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginBottom: getSpacing(3),
  },
  infoText: {
    flex: 1,
    fontSize: scaleFont(13),
    color: '#065f46',
    marginLeft: getSpacing(0.75),
    lineHeight: 20,
  },
});

export default USDTTransferScreen;
