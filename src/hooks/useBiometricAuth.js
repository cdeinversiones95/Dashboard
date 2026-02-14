import { useState, useEffect } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_CREDENTIALS_KEY = "biometric_credentials";
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export const useBiometricAuth = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricSettings();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (compatible) {
        // Verificar que el usuario tenga biometría registrada en el dispositivo
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(enrolled);

        if (enrolled) {
          const types =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          setBiometricType(types);
        }
      } else {
        setIsBiometricSupported(false);
      }
    } catch (error) {
      console.error("Error checking biometric support:", error);
      setIsBiometricSupported(false);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(enabled === "true");
    } catch (error) {
      console.error("Error loading biometric settings:", error);
      setIsBiometricEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const enableBiometricAuth = async (email, password) => {
    try {
      // Verificar que hay autenticación biométrica disponible
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        throw new Error(
          "No hay datos biométricos configurados en el dispositivo",
        );
      }

      // Guardar credenciales de forma segura
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentials);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");

      setIsBiometricEnabled(true);
      return { success: true };
    } catch (error) {
      console.error("Error enabling biometric auth:", error);
      return { success: false, error: error.message };
    }
  };

  const disableBiometricAuth = async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false");
      setIsBiometricEnabled(false);
      return { success: true };
    } catch (error) {
      console.error("Error disabling biometric auth:", error);
      return { success: false, error: error.message };
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      // Verificar que la autenticación biométrica está habilitada
      if (!isBiometricEnabled) {
        throw new Error("Autenticación biométrica no habilitada");
      }

      // Verificar que hay datos biométricos registrados
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        throw new Error(
          "No hay datos biométricos registrados en el dispositivo",
        );
      }

      // Realizar autenticación biométrica
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Iniciar sesión con datos biométricos",
        subtitle: "Usa tu huella dactilar o Face ID para acceder",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar contraseña",
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Obtener credenciales guardadas
        const credentialsString = await SecureStore.getItemAsync(
          BIOMETRIC_CREDENTIALS_KEY,
        );
        if (!credentialsString) {
          throw new Error("No se encontraron credenciales guardadas");
        }

        const credentials = JSON.parse(credentialsString);
        return {
          success: true,
          credentials: {
            email: credentials.email,
            password: credentials.password,
          },
        };
      } else {
        return {
          success: false,
          error:
            result.error === "user_cancel"
              ? "Cancelado por el usuario"
              : "Autenticación fallida",
        };
      }
    } catch (error) {
      console.error("Error in biometric authentication:", error);
      return { success: false, error: error.message };
    }
  };

  const getBiometricTypeText = () => {
    if (!biometricType || biometricType.length === 0)
      return "Datos biométricos";

    if (
      biometricType.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      )
    ) {
      return "Face ID";
    } else if (
      biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      return "Huella dactilar";
    } else if (
      biometricType.includes(LocalAuthentication.AuthenticationType.IRIS)
    ) {
      return "Reconocimiento de iris";
    } else {
      return "Datos biométricos";
    }
  };

  return {
    // Estado
    isBiometricSupported,
    isBiometricEnabled,
    biometricType,
    loading,

    // Métodos
    enableBiometricAuth,
    disableBiometricAuth,
    authenticateWithBiometrics,
    getBiometricTypeText,
  };
};
