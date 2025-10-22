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
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { supabase } from '../config/supabase';
import {
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

const USDTPaymentInstructionsScreen = ({ route, navigation }) => {
  const { amount, paymentMethod, depositId } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutos en segundos
  const [reference, setReference] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Generar referencia única
    const generateReference = () => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `USDT-${timestamp}-${random}`;
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
      const { status } = await requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos Necesarios', 'Necesitamos acceso a tu galería para subir el comprobante.');
        return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0].uri);
        Alert.alert('✅ Imagen Seleccionada', 'Ahora presiona "Confirmar Pago" para enviar tu comprobante.');
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
      const response = await fetch(screenshot);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const fileName = `comprobantes/${depositId}_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

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
        colors={['#065f46', '#059669', '#10b981']}
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
        <Text style={styles.headerTitle}>💰 Instrucciones USDT</Text>
        <Text style={styles.headerSubtitle}>Complete su transferencia cripto</Text>
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

        {/* Información Crypto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de Transferencia</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="logo-bitcoin" size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Criptomoneda</Text>
                <Text style={styles.infoValue}>
                  {paymentMethod?.account_info?.currency}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="globe" size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Red Blockchain</Text>
                <Text style={styles.infoValue}>
                  {paymentMethod?.account_info?.network}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(paymentMethod?.account_info?.network, 'Red')}
              >
                <Ionicons name="copy-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.walletRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="wallet" size={20} color="#10b981" />
              </View>
              <View style={styles.walletContent}>
                <Text style={styles.infoLabel}>Dirección de Wallet</Text>
                <Text style={[styles.infoValue, styles.walletAddress]}>
                  {paymentMethod?.account_info?.wallet_address}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.fullCopyButton}
              onPress={() => copyToClipboard(paymentMethod?.account_info?.wallet_address, 'Dirección de wallet')}
            >
              <Ionicons name="copy" size={16} color="#ffffff" />
              <Text style={styles.fullCopyText}>Copiar Dirección Completa</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="barcode-outline" size={20} color="#10b981" />
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

        {/* Botón de Subir Comprobante */}
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={pickImage}
          disabled={uploading}
        >
          <LinearGradient
            colors={screenshot ? ['#10b981', '#059669'] : ['#8b5cf6', '#7c3aed']}
            style={styles.uploadGradient}
          >
            {screenshot ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.uploadText}>✅ Comprobante Adjuntado</Text>
              </>
            ) : (
              <>
                <Ionicons name="camera" size={20} color="#ffffff" />
                <Text style={styles.uploadText}>📷 Subir Comprobante</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Mostrar preview del comprobante */}
        {screenshot && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Comprobante seleccionado:</Text>
            <Image source={{ uri: screenshot }} style={styles.previewImage} />
            <TouchableOpacity 
              style={styles.changeImageButton}
              onPress={pickImage}
            >
              <Ionicons name="refresh" size={16} color="#10b981" />
              <Text style={styles.changeImageText}>Cambiar imagen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botones de Acción */}
        <TouchableOpacity
          style={[styles.confirmButton, uploading && styles.confirmButtonDisabled]}
          onPress={async () => {
            if (!screenshot) {
              Alert.alert(
                '📷 Comprobante Requerido',
                'Por favor sube una captura de tu comprobante de pago.',
                [{ text: 'OK' }]
              );
              return;
            }

            Alert.alert(
              '✅ Confirmar Pago',
              '¿Ya enviaste el USDT y subiste el comprobante?',
              [
                { text: 'No todavía', style: 'cancel' },
                {
                  text: 'Sí, Confirmar',
                  onPress: async () => {
                    const uploaded = await uploadScreenshot();
                    if (uploaded) {
                      Alert.alert(
                        '✅ Solicitud Enviada',
                        'Tu transacción está siendo verificada en la blockchain. Te notificaremos cuando sea confirmada (usualmente toma 5-15 minutos).',
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
                    }
                  },
                },
              ]
            );
          }}
          disabled={uploading}
        >
          <LinearGradient
            colors={uploading ? ['#a0aec0', '#718096'] : ['#10b981', '#059669']}
            style={styles.confirmGradient}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.confirmText}>Subiendo...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.confirmText}>Confirmar Pago</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Instrucciones */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📌 Pasos a Seguir:</Text>
          <Text style={styles.instructionItem}>
            1️⃣ Abre tu wallet de criptomonedas
          </Text>
          <Text style={styles.instructionItem}>
            2️⃣ Selecciona enviar USDT en red TRC20
          </Text>
          <Text style={styles.instructionItem}>
            3️⃣ Pega la dirección de wallet mostrada
          </Text>
          <Text style={styles.instructionItem}>
            4️⃣ Envía el monto equivalente en USDT
          </Text>
          <Text style={styles.instructionItem}>
            5️⃣ Guarda el hash de transacción
          </Text>
          <Text style={styles.instructionItem}>
            6️⃣ Presiona "Ya Realicé el Pago"
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            <Text style={styles.warningBold}>Importante:</Text> Envía USDT ÚNICAMENTE por la red TRC20. Envíos por otras redes (ERC20, BEP20, etc.) se perderán y no podrán ser recuperados.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            💡 El tipo de cambio será calculado al momento de la confirmación de la transacción en la blockchain.
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
    borderColor: '#10b981',
    shadowColor: '#10b981',
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
    color: '#10b981',
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
  walletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: getSpacing(1),
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(1.25),
  },
  infoContent: {
    flex: 1,
  },
  walletContent: {
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
  walletAddress: {
    fontSize: scaleFont(11),
    fontWeight: '500',
    color: '#10b981',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  referenceText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: getSpacing(0.5),
  },
  fullCopyButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing(1),
    borderRadius: getBorderRadius(8),
    marginTop: getSpacing(),
    gap: getSpacing(0.5),
  },
  fullCopyText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: '#ffffff',
  },
  uploadButton: {
    borderRadius: getBorderRadius(12),
    marginBottom: getSpacing(1.5),
    overflow: 'hidden',
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(1.5),
    gap: getSpacing(0.5),
  },
  uploadText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#ffffff',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    padding: getSpacing(1.5),
    borderRadius: getBorderRadius(12),
    marginBottom: getSpacing(1.5),
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: getSpacing(),
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: getBorderRadius(8),
    marginBottom: getSpacing(),
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(0.5),
    paddingVertical: getSpacing(0.5),
  },
  changeImageText: {
    fontSize: scaleFont(14),
    color: '#10b981',
    fontWeight: '500',
  },
  confirmButton: {
    borderRadius: getBorderRadius(12),
    marginVertical: getSpacing(2),
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
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

export default USDTPaymentInstructionsScreen;
