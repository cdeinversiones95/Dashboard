import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dimensiones base para el diseño (iPhone 11/12/13 como referencia)
const REFERENCE_WIDTH = 375;
const REFERENCE_HEIGHT = 812;

// Función para escalar dimensiones horizontalmente
export const scaleWidth = (size) => {
  return (SCREEN_WIDTH / REFERENCE_WIDTH) * size;
};

// Función para escalar dimensiones verticalmente  
export const scaleHeight = (size) => {
  return (SCREEN_HEIGHT / REFERENCE_HEIGHT) * size;
};

// Función para escalar fuentes responsivamente
export const scaleFont = (size) => {
  const scale = Math.min(SCREEN_WIDTH / REFERENCE_WIDTH, SCREEN_HEIGHT / REFERENCE_HEIGHT);
  return Math.max(size * scale, size * 0.8); // Mínimo 80% del tamaño original
};

// Función para obtener padding horizontal responsivo
export const getHorizontalPadding = () => {
  if (SCREEN_WIDTH < 350) return 12; // Pantallas muy pequeñas
  if (SCREEN_WIDTH < 400) return 16; // Pantallas pequeñas
  if (SCREEN_WIDTH < 450) return 20; // Pantallas medianas
  return 24; // Pantallas grandes
};

// Función para obtener padding vertical responsivo
export const getVerticalPadding = () => {
  if (SCREEN_HEIGHT < 650) return 10; // Pantallas muy pequeñas
  if (SCREEN_HEIGHT < 750) return 15; // Pantallas pequeñas
  if (SCREEN_HEIGHT < 850) return 20; // Pantallas medianas
  return 25; // Pantallas grandes
};

// Función para obtener el tamaño de iconos responsivo
export const getIconSize = (baseSize = 24) => {
  return Math.round(scaleFont(baseSize));
};

// Función para obtener border radius responsivo
export const getBorderRadius = (baseRadius = 8) => {
  return Math.round(scaleWidth(baseRadius));
};

// Función para obtener el número de columnas en grid
export const getGridColumns = () => {
  if (SCREEN_WIDTH < 350) return 1; // Pantallas muy pequeñas - 1 columna
  if (SCREEN_WIDTH < 400) return 2; // Pantallas pequeñas - 2 columnas
  return 2; // Pantallas medianas y grandes - 2 columnas
};

// Función para determinar si es una pantalla pequeña
export const isSmallScreen = () => {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667;
};

// Función para determinar si es una pantalla muy pequeña
export const isVerySmallScreen = () => {
  return SCREEN_WIDTH < 350 || SCREEN_HEIGHT < 600;
};

// Función para obtener el alto de header responsivo
export const getHeaderHeight = () => {
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  return statusBarHeight + scaleHeight(60);
};

// Función para obtener dimensiones de tarjetas
export const getCardDimensions = () => {
  const padding = getHorizontalPadding();
  const cardWidth = (SCREEN_WIDTH - (padding * 3)) / 2; // 2 columnas con padding
  
  return {
    width: cardWidth,
    height: Math.round(cardWidth * 0.8), // Ratio 4:5
    padding: padding / 2,
  };
};

// Función para obtener espaciado entre elementos
export const getSpacing = (factor = 1) => {
  const baseSpacing = 16;
  return Math.round(scaleWidth(baseSpacing * factor));
};

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  REFERENCE_WIDTH,
  REFERENCE_HEIGHT,
};