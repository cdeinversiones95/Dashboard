import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import {
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

const PaymentInstructionsScreen = ({ route, navigation }) => {
  const { amount, bank, paymentMethod, depositId } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutos en segundos
  const [reference, setReference] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Generar referencia única
    const generateReference = () => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `REF-${timestamp}-${random}`;
    };
    setReference(generateReference());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          Alert.alert(
            '⏰ Tiempo Agotado',
            'El tiempo para completar el pago ha expirado. Por favor, genera una nueva solicitud de recarga.',
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigation]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 1800) return '#10b981'; // Verde > 30 min
    if (timeRemaining > 600) return '#f59e0b'; // Amarillo > 10 min
    return '#ef4444'; // Rojo < 10 min
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('✅ Copiado', `${label} copiado al portapapeles`);
  };

  const pickImage = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos Necesarios', 'Necesitamos acceso a tu galería para subir el comprobante.');
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0].uri);
        Alert.alert('✅ Imagen Seleccionada', 'Ahora presiona "Ya Realicé el Pago" para enviar tu comprobante.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const uploadScreenshot = async () => {
    if (!screenshot) {
      Alert.alert('📷 Comprobante Requerido', 'Por favor sube una captura de tu comprobante de pago antes de confirmar.');
      return false;
    }

    setUploading(true);
    try {
      // Convertir la imagen a base64
      const response = await fetch(screenshot);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const fileName = `comprobantes/${depositId}_${Date.now()}.jpg`;
      
      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Actualizar pending_deposits con la URL del comprobante
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      await supabase
        .from('pending_deposits')
        .update({ 
          payment_reference: reference,
          proof_image_url: publicUrl 
        })
        .eq('id', depositId);

      return true;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      Alert.alert('Error', 'No se pudo subir el comprobante. Intenta de nuevo.');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2d5a87', '#3182ce']}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              '⚠️ Cancelar Pago',
              '¿Estás seguro de que quieres cancelar esta solicitud de recarga?',
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Sí, Cancelar',
                  style: 'destructive',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main' }],
                    });
                  },
                },
              ]
            );
          }} 
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Instrucciones de Pago</Text>
        <Text style={styles.headerSubtitle}>Complete su transferencia</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          <LinearGradient
            colors={[getTimeColor(), getTimeColor() + 'dd']}
            style={styles.timerGradient}
          >
            <Ionicons name="time-outline" size={32} color="#ffffff" />
            <View style={styles.timerInfo}>
              <Text style={styles.timerLabel}>Complete su pago en:</Text>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Monto */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Monto a Transferir</Text>
          <Text style={styles.amountValue}>RD$ {amount.toLocaleString()}</Text>
        </View>

        {/* Información Bancaria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Bancarios</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="business" size={20} color="#3182ce" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Banco</Text>
                <Text style={styles.infoValue}>
                  {bank?.name || paymentMethod?.account_info?.bank_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(bank?.name || paymentMethod?.account_info?.bank_name, 'Banco')}
              >
                <Ionicons name="copy-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person" size={20} color="#3182ce" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Titular</Text>
                <Text style={styles.infoValue}>
                  {paymentMethod?.account_info?.account_holder}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(paymentMethod?.account_info?.account_holder, 'Titular')}
              >
                <Ionicons name="copy-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="card" size={20} color="#3182ce" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Número de Cuenta</Text>
                <Text style={[styles.infoValue, styles.accountNumber]}>
                  {paymentMethod?.account_info?.account_number}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(paymentMethod?.account_info?.account_number, 'Número de cuenta')}
              >
                <Ionicons name="copy-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="wallet" size={20} color="#3182ce" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tipo de Cuenta</Text>
                <Text style={styles.infoValue}>
                  {paymentMethod?.account_info?.account_type}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="barcode-outline" size={20} color="#3182ce" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Referencia de Pago</Text>
                <Text style={[styles.infoValue, styles.referenceText]}>
                  {reference}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(reference, 'Referencia')}
              >
                <Ionicons name="copy-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Botones de Acción */}
        <TouchableOpacity style={styles.shareButton} onPress={sharePaymentInfo}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.shareGradient}
          >
            <Ionicons name="share-social" size={20} color="#ffffff" />
            <Text style={styles.shareText}>Compartir Información</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            Alert.alert(
              '✅ Pago Realizado',
              '¿Ya completaste la transferencia?',
              [
                { text: 'No todavía', style: 'cancel' },
                {
                  text: 'Sí, Ya pagué',
                  onPress: () => {
                    Alert.alert(
                      '✅ Solicitud Enviada',
                      'Tu pago está siendo verificado. Te notificaremos cuando sea aprobado (usualmente en menos de 30 minutos).',
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
                  },
                },
              ]
            );
          }}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.confirmGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.confirmText}>Ya Realicé el Pago</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Instrucciones */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📌 Pasos a Seguir:</Text>
          <Text style={styles.instructionItem}>
            1️⃣ Abre tu app bancaria o ve a un cajero
          </Text>
          <Text style={styles.instructionItem}>
            2️⃣ Realiza la transferencia con los datos mostrados
          </Text>
          <Text style={styles.instructionItem}>
            3️⃣ Incluye la referencia en el concepto de pago
          </Text>
          <Text style={styles.instructionItem}>
            4️⃣ Guarda tu comprobante de pago
          </Text>
          <Text style={styles.instructionItem}>
            5️⃣ Presiona "Ya Realicé el Pago" cuando termines
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            <Text style={styles.warningBold}>Importante:</Text> El monto debe ser exacto. Transferencias con montos diferentes no serán procesadas.
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
  timerContainer: {
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
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(2),
  },
  timerInfo: {
    marginLeft: getSpacing(1.5),
  },
  timerLabel: {
    fontSize: scaleFont(13),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  timerText: {
    fontSize: scaleFont(32),
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  amountCard: {
    backgroundColor: '#ffffff',
    padding: getSpacing(2),
    borderRadius: getBorderRadius(16),
    alignItems: 'center',
    marginBottom: getSpacing(2),
    borderWidth: 2,
    borderColor: '#3182ce',
    shadowColor: '#3182ce',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    fontSize: scaleFont(14),
    color: '#64748b',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: scaleFont(36),
    fontWeight: 'bold',
    color: '#3182ce',
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
  infoCard: {
    backgroundColor: '#ffffff',
    padding: getSpacing(1.5),
    borderRadius: getBorderRadius(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getSpacing(1),
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(1.25),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#1e293b',
  },
  accountNumber: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    letterSpacing: 1,
  },
  referenceText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#3182ce',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: getSpacing(0.5),
  },
  shareButton: {
    borderRadius: getBorderRadius(12),
    marginBottom: getSpacing(1.5),
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(1.5),
    gap: getSpacing(0.5),
  },
  shareText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButton: {
    borderRadius: getBorderRadius(12),
    marginBottom: getSpacing(2),
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(1.75),
    gap: getSpacing(0.5),
  },
  confirmText: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  instructionsBox: {
    backgroundColor: '#f8fafc',
    padding: getSpacing(2),
    borderRadius: getBorderRadius(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: getSpacing(1.5),
  },
  instructionsTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: getSpacing(1.25),
  },
  instructionItem: {
    fontSize: scaleFont(14),
    color: '#475569',
    marginBottom: getSpacing(0.75),
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: getSpacing(1.5),
    borderRadius: getBorderRadius(10),
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: getSpacing(3),
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
});

export default PaymentInstructionsScreen;
