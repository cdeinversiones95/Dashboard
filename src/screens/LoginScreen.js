import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';
import {
  scaleHeight,
  scaleFont,
  getHorizontalPadding,
  getSpacing,
  getBorderRadius,
} from '../utils/responsive';

const LoginScreen = () => {
  // Estados
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [phoneExists, setPhoneExists] = useState(false);

  const { signIn, signUp } = useAuth();

  // ✅ Animaciones con useRef (para no reiniciarse en cada render)
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const ballAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pelota
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ballAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(ballAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    // Limpieza segura
    return () => {
      ballAnimation.stopAnimation();
    };
  }, []);

  // Verificar si el teléfono ya existe (solo en modo registro)
  const checkPhoneAvailability = async (phoneNumber) => {
    if (!isLogin && phoneNumber.replace(/\D/g, '').length >= 10) {
      try {
        const { exists } = await AuthService.checkPhoneExists(phoneNumber);
        setPhoneExists(exists);
      } catch (error) {
        console.log('Error verificando teléfono:', error);
        setPhoneExists(false);
      }
    } else {
      setPhoneExists(false);
    }
  };

  // ✅ Manejo de login/signup
  const handleAuth = async () => {
    if (!phone || !password) {
      Alert.alert('❌ Error', 'Por favor completa todos los campos');
      return;
    }
    
    // Validar nombre en registro
    if (!isLogin && (!name || name.trim().length < 2)) {
      Alert.alert('❌ Error', 'Por favor ingresa tu nombre (mínimo 2 caracteres)');
      return;
    }
    
    // Validar formato del teléfono
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('❌ Error', 'El número telefónico debe tener al menos 10 dígitos');
      return;
    }

    // Verificar si el teléfono ya existe (solo en registro)
    if (!isLogin && phoneExists) {
      Alert.alert(
        '📱 Número ya registrado', 
        'Este número telefónico ya tiene una cuenta. ¿Quieres iniciar sesión en su lugar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Iniciar Sesión', 
            onPress: () => {
              setIsLogin(true);
              setName('');
              setConfirmPassword('');
            }
          }
        ]
      );
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('❌ Error', 'Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      Alert.alert('❌ Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await signIn(phone, password)
        : await signUp(phone, password, { display_name: name.trim() });

      if (result?.error) {
        Alert.alert('❌ Error', result.error.message || result.error);
      } else {
        Alert.alert(
          '⚽ ¡Goool!',
          isLogin
            ? `¡Bienvenido de vuelta al campo!`
            : `¡${name} se ha unido al equipo de CDE INVERSIONES!`
        );
      }
    } catch (error) {
      console.error('Error en handleAuth:', error);
      Alert.alert('❌ Error', error.message || 'Algo salió mal. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const logoTransform = {
    transform: [
      {
        translateY: logoAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 0],
        }),
      },
      {
        scale: logoAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
    opacity: logoAnimation,
  };

  const formTransform = {
    transform: [
      {
        translateY: formAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: formAnimation,
  };

  const ballTransform = {
    transform: [
      {
        translateY: ballAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
        }),
      },
      {
        rotate: ballAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.fullScreenScroll}
          contentContainerStyle={styles.fullScreenScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#1a365d', '#2d5a87', '#3182ce']}
            locations={[0, 0.6, 1]}
            style={styles.background}
          >
          {/* Patrón de fondo de campo de fútbol */}
          <View style={styles.fieldPattern}>
            <View style={styles.fieldLine} />
            <View style={[styles.fieldLine, styles.fieldLineVertical]} />
            <View style={styles.centerCircle} />
          </View>



          {/* Header con logo animado */}
          <Animated.View style={[styles.header, logoTransform]}>
            <View style={styles.logoContainer}>
              <Animated.View style={ballTransform}>
                <MaterialCommunityIcons 
                  name="soccer" 
                  size={50} 
                  color="#ffffff" 
                />
              </Animated.View>
              <View style={styles.logoTextContainer}>
                <Text style={styles.logoText}>CDE</Text>
                <Text style={styles.logoSubtext}>INVERSIONES</Text>
              </View>
            </View>
            <Text style={styles.tagline}>
              ⚽ {isLogin ? 'Regresa al juego' : 'Únete al equipo'}
            </Text>
          </Animated.View>

          {/* Formulario animado */}
          <Animated.View style={[styles.formContainer, formTransform]}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {isLogin ? '🏟️ Iniciar Sesión' : '🎯 Crear Cuenta'}
              </Text>
              
              <View style={[
                styles.inputContainer,
                focusedInput === 'phone' && styles.inputFocused,
                !isLogin && phoneExists && styles.inputError
              ]}>
                <Ionicons name="call" size={22} color="#3182ce" />
                <TextInput
                  style={styles.input}
                  placeholder="Tu número celular"
                  placeholderTextColor="#a0aec0"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setPhoneExists(false); // Reset mientras escribe
                  }}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => {
                    setFocusedInput(null);
                    checkPhoneAvailability(phone); // Verificar cuando deja de escribir
                  }}
                />
                {!isLogin && phoneExists && (
                  <Ionicons name="warning" size={20} color="#dc2626" />
                )}
              </View>

              {/* Mensaje de advertencia si el teléfono ya existe */}
              {!isLogin && phoneExists && (
                <Text style={styles.errorText}>
                  ⚠️ Este número ya está registrado
                </Text>
              )}

              {/* Campo de nombre - solo en registro */}
              {!isLogin && (
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'name' && styles.inputFocused
                ]}>
                  <Ionicons name="person" size={22} color="#3182ce" />
                  <TextInput
                    style={styles.input}
                    placeholder="Tu nombre completo"
                    placeholderTextColor="#a0aec0"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              )}

              <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed" size={22} color="#3182ce" />
                <TextInput
                  style={styles.input}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#a0aec0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#718096" 
                  />
                </TouchableOpacity>
              </View>

              {!isLogin && (
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'confirmPassword' && styles.inputFocused
                ]}>
                  <Ionicons name="checkmark-circle" size={22} color="#3182ce" />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirma tu contraseña"
                    placeholderTextColor="#a0aec0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.authButton, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#a0aec0', '#718096'] : ['#38a169', '#2d7d32']}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialCommunityIcons
                      name={isLogin ? 'login' : 'account-plus'}
                      size={20}
                      color="#ffffff"
                    />
                  )}
                  <Text style={styles.authButtonText}>
                    {loading
                      ? 'Procesando...'
                      : isLogin
                      ? '⚽ Entrar al Campo'
                      : '🏆 Unirse al Equipo'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.switchButton}
                onPress={() => {
                  setIsLogin(!isLogin);
                  // Limpiar campos al cambiar modo
                  setName('');
                  setConfirmPassword('');
                  setFocusedInput(null);
                }}
              >
                <Text style={styles.switchText}>
                  {isLogin 
                    ? '🆕 ¿Nuevo jugador? Crea tu cuenta' 
                    : '👋 ¿Ya tienes cuenta? Inicia sesión'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    minHeight: '100%',
    paddingBottom: 50, // Espacio extra para scroll
  },

  fieldPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  fieldLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ffffff',
  },
  fieldLineVertical: {
    top: 0,
    bottom: 0,
    left: '50%',
    right: 'auto',
    width: 2,
    height: 'auto',
  },
  centerCircle: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#ffffff',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  header: {
    paddingTop: scaleHeight(80),
    paddingBottom: scaleHeight(40),
    paddingHorizontal: getHorizontalPadding(),
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing(),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: scaleHeight(15),
    borderRadius: getBorderRadius(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoTextContainer: {
    marginLeft: getSpacing(),
  },
  logoText: {
    fontSize: scaleFont(32),
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoSubtext: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#e2e8f0',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: scaleFont(18),
    color: '#e2e8f0',
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    paddingHorizontal: getHorizontalPadding(),
    paddingBottom: getSpacing(4), // Espacio extra al final
    minHeight: '60%', // Altura mínima para centrar cuando hay poco contenido
    justifyContent: 'center',
  },
  fullScreenScroll: {
    flex: 1,
  },
  fullScreenScrollContent: {
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getBorderRadius(25),
    paddingHorizontal: 25,
    paddingVertical: scaleHeight(30),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  formTitle: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: getSpacing(2),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: getBorderRadius(15),
    paddingHorizontal: 18,
    paddingVertical: scaleHeight(16),
    marginBottom: getSpacing(1.5),
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  inputFocused: {
    borderColor: '#3182ce',
    backgroundColor: '#ffffff',
    shadowOpacity: 0.1,
    transform: [{ scale: 1.02 }],
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: scaleFont(16),
    color: '#2d3748',
    marginLeft: getSpacing(0.75),
    fontWeight: '500',
  },
  eyeButton: {
    padding: getSpacing(0.5),
  },
  errorText: {
    fontSize: scaleFont(12),
    color: '#dc2626',
    marginLeft: getSpacing(2),
    marginTop: getSpacing(0.5),
    marginBottom: getSpacing(0.5),
    fontWeight: '500',
  },
  authButton: {
    borderRadius: getBorderRadius(15),
    marginTop: getSpacing(1.5),
    marginBottom: getSpacing(),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: 20,
    borderRadius: getBorderRadius(15),
  },
  authButtonText: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: getSpacing(0.5),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: getSpacing(1.5),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: getSpacing(),
    fontSize: scaleFont(14),
    color: '#a0aec0',
    fontWeight: '500',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: getSpacing(1.5),
    paddingHorizontal: getSpacing(),
    borderRadius: getBorderRadius(12),
    backgroundColor: 'rgba(49, 130, 206, 0.1)',
  },
  switchText: {
    fontSize: scaleFont(16),
    color: '#3182ce',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoginScreen;