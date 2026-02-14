import { useState } from "react";
import { Alert } from "react-native";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";

/**
 * Hook compartido para seleccionar y gestionar imágenes de comprobantes de pago.
 * Usado en PaymentInstructionsScreen y USDTPaymentInstructionsScreen.
 *
 * @returns {{ screenshot, pickImage, clearImage }}
 */
export const useImageUpload = () => {
  const [screenshot, setScreenshot] = useState(null);

  const pickImage = async () => {
    try {
      const { status } = await requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permisos Necesarios",
          "Necesitamos acceso a tu galería para subir el comprobante.",
        );
        return null;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setScreenshot(uri);
        return uri;
      }

      return null;
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
      return null;
    }
  };

  const clearImage = () => {
    setScreenshot(null);
  };

  return {
    screenshot,
    pickImage,
    clearImage,
  };
};
