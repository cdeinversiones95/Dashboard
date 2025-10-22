# CDE INVERSIONES App

Una aplicación de inversiones y trading desarrollada con React Native y Expo SDK 54.

## Características

### 🏠 Dashboard Principal
- Estadísticas de depositantes por primera vez
- Usuarios que han retirado fondos
- Número de apostadores
- Montos de recarga y retiro
- Selector de fechas
- Sección "My Team" con niveles y estadísticas
- Sección "My Rebate" para recompensas

### ⚽ Eventos Deportivos
- Banner promocional con actividades del agente
- Navegación por pestañas (Eventos Populares / Más Eventos)
- Tarjetas de partidos destacados con información en tiempo real
- Cuadrícula de probabilidades con diferentes resultados
- Sistema de apuestas integrado

### 📊 Mis Apuestas
- Filtros por fecha y estado
- Historial completo de apuestas
- Detalles de cada apuesta (monto, ganancia, odds)
- Estados: Cancelado, Liquidado, Ganado
- Números de apuesta con función de copiado

### 👤 Perfil y Menú
- Perfil de usuario con avatar y estado VIP
- Balance disponible con botones Top Up y Withdraw
- Menú completo con todas las opciones:
  - Front Page
  - VIP
  - Event Center
  - Agent Center
  - Event Hall
  - My Account
  - Help Center
  - About IGF
  - Partner
  - Clear Cache
  - Welcome To Download IGF
- Selector de idioma
- Servicio al cliente en línea
- Opción de cerrar sesión

## Tecnologías Utilizadas

- **React Native 0.81.4** - Framework principal
- **Expo SDK 54** - Herramientas de desarrollo y entorno
- **React Navigation 6.x** - Navegación entre pantallas
- **Expo Vector Icons 15.x** - Iconografía
- **Expo Linear Gradient 15.x** - Gradientes lineales
- **React Native Reanimated 4.x** - Animaciones fluidas

## Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd IGF-Football
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en Expo Go**
   ```bash
   npm start
   ```

4. **Escanear el código QR** con la app Expo Go en tu dispositivo móvil

## Estructura del Proyecto

```
CDE-Inversiones/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js          # Dashboard principal
│   │   ├── EventsScreen.js        # Eventos deportivos
│   │   ├── MyBetsScreen.js        # Historial de apuestas
│   │   └── ProfileScreen.js       # Perfil y menú
│   ├── components/
│   │   ├── StatsCard.js           # Tarjetas de estadísticas
│   │   ├── TeamChart.js           # Gráfico circular del equipo
│   │   ├── MatchCard.js           # Tarjeta de partido
│   │   └── BetCard.js             # Tarjeta de apuesta
│   └── constants/
│       ├── theme.js               # Colores y estilos globales
│       └── assets.js              # Assets y recursos
├── App.js                         # Componente principal con navegación
├── app.json                       # Configuración de Expo
├── package.json                   # Dependencias del proyecto
└── babel.config.js                # Configuración de Babel
```

## Funcionalidades Implementadas

### ✅ Navegación
- [x] Tab Navigation con 4 pantallas principales
- [x] Iconos personalizados para cada tab
- [x] Colores de tema consistentes

### ✅ UI/UX
- [x] Diseño responsivo
- [x] Gradientes lineales
- [x] Tarjetas con sombras
- [x] Iconografía consistente
- [x] Colores del tema IGF

### ✅ Componentes Reutilizables
- [x] StatsCard - Para mostrar métricas
- [x] TeamChart - Gráfico circular
- [x] MatchCard - Información de partidos
- [x] BetCard - Detalles de apuestas

### ✅ Datos Simulados
- [x] Estadísticas del dashboard
- [x] Información de partidos
- [x] Historial de apuestas
- [x] Datos de perfil de usuario

## Estado del Proyecto: ✅ ACTUALIZADO A SDK 54 - LISTO PARA USAR

La aplicación CDE INVERSIONES ha sido completamente actualizada a Expo SDK 54 y está lista para ejecutar en Expo Go.

## Instrucciones de Uso Rápido

### 📱 Para ejecutar en tu dispositivo móvil:

1. **Descarga Expo Go en tu dispositivo:**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Ejecuta el proyecto:**
```bash
cd CDE-Inversiones
npm start
```3. **Escanea el código QR** que aparece en la terminal con la app Expo Go

4. **¡Disfruta de la app!** La aplicación se cargará automáticamente en tu dispositivo

### 🌐 Para ejecutar en el navegador web:

```bash
cd IGF-Football
npm start
# Presiona 'w' para abrir en el navegador
```

## Próximas Funcionalidades

- [ ] Integración con APIs reales
- [ ] Autenticación de usuarios
- [ ] Sistema de notificaciones push
- [ ] Animaciones y transiciones
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)
- [ ] Cache de datos offline

## Configuración para Desarrollo

### Expo Go
La aplicación está configurada para funcionar con **Expo SDK 54** y es completamente compatible con **Expo Go**.

**Versiones específicas utilizadas:**
- Expo SDK: 54.0.0
- React: 19.1.0  
- React Native: 0.81.4
- React Native Reanimated: 4.1.1
- React Native Screens: 4.16.0
- Expo Status Bar: 3.0.8

### Personalización

Para personalizar la aplicación:

1. **Colores**: Modifica `src/constants/theme.js`
2. **Iconos**: Reemplaza los iconos en cada componente
3. **Logos**: Añade tu logo en `assets/`
4. **Datos**: Reemplaza los datos simulados con llamadas a APIs reales

## Soporte

Para soporte técnico o preguntas sobre la implementación, revisa la documentación de:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)

---

**Nota**: Esta es una aplicación de demostración. Para uso en producción, asegúrate de implementar medidas de seguridad apropiadas y cumplir con las regulaciones locales sobre apuestas deportivas.