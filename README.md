# 🏆 IGF Football - Sistema de Apuestas Deportivas# IGF Football# IGF Football



## 📱 Aplicación Móvil React Native + 🖥️ Dashboard Administrativo Next.js



### 🎯 **PROYECTO LISTO PARA PRODUCCIÓN**Aplicación móvil para inversiones en eventos deportivos desarrollada con React Native y Supabase.Aplicación móvil para inversiones en eventos deportivos desarrollada con React Native y Supabase.



---



## 📋 **DESCRIPCIÓN DEL SISTEMA**## 🚀 Características## 🚀 Características Principales



Sistema completo de apuestas deportivas que incluye:



- **📱 App Móvil React Native** con Expo para usuarios finales- Autenticación segura con verificación- **Autenticación Segura**: Sistema de registro y login con verificación

- **🖥️ Dashboard Web Next.js** con TypeScript para administradores

- **🗄️ Base de datos Supabase** con autenticación y storage- Billetera digital y transacciones en tiempo real- **Billetera Digital**: Gestión de balance y transacciones en tiempo real

- **💰 Sistema de billeteras** con recarga y retiros

- **⚽ Eventos deportivos** con predicciones de resultados- Sistema de depósitos (Transferencias bancarias, USDT)- **Sistema de Depósitos**: Múltiples métodos de pago (Transferencias bancarias, USDT)

- **🏆 Sistema de apuestas** con ganancias automáticas

- Dashboard de estadísticas e inversiones- **Dashboard de Estadísticas**: Visualización de datos de inversión y ganancias

---

- Perfil de usuario personalizable- **Perfil de Usuario**: Gestión completa del perfil y configuraciones

## 🚀 **INSTALACIÓN Y CONFIGURACIÓN**

- Interfaz responsive optimizada- **Interfaz Responsiva**: Optimizada para todos los dispositivos

### **Requisitos previos:**

- Node.js 18+

- Expo CLI

- Cuenta de Supabase configurada## 🛠️ Tecnologías## 📱 Instalación



### **1. Configurar App Móvil:**

```bash

# Instalar dependencias- React Native + Expo### Prerrequisitos

npm install

- Supabase (PostgreSQL)- Node.js 18+

# Ejecutar en desarrollo

npm start- React Navigation v6- Expo CLI



# Builds de producción- Cuenta de Supabase

npm run build:android    # Build para Android

npm run build:ios        # Build para iOS## 🔐 Seguridad

npm run build:preview    # Build de preview

```### Configuración



### **2. Configurar Dashboard:**- Autenticación JWT con Supabase

```bash

# Ir al directorio del dashboard- Row Level Security (RLS)```bash

cd IGF-Admin-Dashboard

- Validación completa de datos# Instalar dependencias

# Instalar dependencias

npm installnpm install



# Ejecutar en desarrollo---

npm run dev

# Iniciar aplicación

# Build de producción

npm run build**Versión**: 1.0.0  npm start

npm start

```**IGF Football**```



---## 🛠️ Tecnologías



## 🗄️ **CONFIGURACIÓN DE BASE DE DATOS**- **Frontend**: React Native + Expo

- **Backend**: Supabase (PostgreSQL)

### **Tablas principales en Supabase:**- **Navegación**: React Navigation v6

- **Autenticación**: Supabase Auth

1. **👥 users** - Información de usuarios- **Base de Datos**: PostgreSQL con RLS

2. **💳 wallets** - Billeteras de usuarios

3. **💸 transactions** - Historial de transacciones## 📁 Estructura

4. **⚽ events** - Eventos deportivos (app móvil)

5. **🏟️ betting_events** - Eventos deportivos (dashboard)```

6. **🎯 betting_options** - Opciones de apuesta por eventosrc/

7. **🎲 user_bets** - Apuestas realizadas por usuarios├── components/          # Componentes reutilizables

8. **⚽ teams** - Equipos deportivos├── screens/             # Pantallas principales

├── services/            # Servicios de API

### **Configuración de autenticación:**├── contexts/            # Providers de contexto

- Row Level Security (RLS) habilitado├── hooks/               # Custom hooks

- Políticas de seguridad configuradas├── constants/           # Constantes y configuraciones

- Storage buckets para archivos└── utils/               # Utilidades

```

---

## 🔐 Seguridad

## 📱 **FUNCIONALIDADES DE LA APP MÓVIL**

- Autenticación JWT con Supabase

### **🔐 Autenticación:**- Row Level Security (RLS) en base de datos

- Registro con email y contraseña- Validación de datos en frontend y backend

- Login seguro- Gestión segura de tokens y sesiones

- Recuperación de contraseña

- Perfil de usuario editable## 📞 Soporte



### **💰 Sistema de Billetera:**Para soporte técnico o consultas sobre la aplicación, contacta al equipo de desarrollo.

- Visualización de balance

- Recarga por transferencia bancaria---

- Retiros con validación

- Historial de transacciones**Versión**: 1.0.0  

**Desarrollado con** ❤️ **para IGF Football**
### **⚽ Eventos y Apuestas:**
- Lista de eventos deportivos del día actual
- Predicciones de resultados (0-0, 1-0, 1-1, etc.)
- Sistema de apuestas con ganancias calculadas
- Historial de apuestas realizadas
- Estados: activa, ganada, perdida, cancelada

### **📊 Estadísticas:**
- Ganancias totales
- Apuestas activas
- Historial completo

---

## 🖥️ **FUNCIONALIDADES DEL DASHBOARD**

### **👥 Gestión de Usuarios:**
- Lista completa de usuarios registrados
- Información detallada de cada usuario
- Gestión de estados de cuenta

### **💳 Gestión de Billeteras:**
- Visualización de balances
- Historial de transacciones
- Aprobación de recargas
- Procesamiento de retiros

### **⚽ Gestión de Eventos:**
- Creación de eventos deportivos
- Configuración de opciones de apuesta
- Modificación de eventos existentes
- **Cancelación automática con reembolsos**

### **🏆 Finalización de Eventos:**
- **🆕 Vista detallada de usuarios por predicción**
- Selección del resultado ganador
- Procesamiento automático de ganancias
- Cálculo y distribución de premios

### **📊 Transacciones:**
- Historial completo de transacciones
- Filtros y búsqueda avanzada
- Estadísticas financieras

---

## 🔧 **CARACTERÍSTICAS TÉCNICAS**

### **📱 App Móvil:**
- **Framework:** React Native + Expo
- **Navegación:** React Navigation 6
- **Estado:** Context API
- **Styling:** StyleSheet nativo + Linear Gradient
- **Base de datos:** Supabase SDK
- **Build:** EAS Build

### **🖥️ Dashboard:**
- **Framework:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS
- **Componentes:** Lucide React Icons
- **Base de datos:** Supabase Admin SDK
- **Deployment:** Vercel ready

### **🗄️ Backend:**
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** REST + Real-time subscriptions

---

## 🚨 **FUNCIONALIDADES DE SEGURIDAD**

### **🔐 Autenticación:**
- JWT tokens seguros
- Refresh token automático
- Session persistence
- Logout automático por inactividad

### **🛡️ Autorización:**
- Row Level Security (RLS)
- Políticas de acceso granulares
- Validación de permisos en cada operación

### **💰 Transacciones:**
- Validación de balance antes de apostar
- Atomicidad en operaciones financieras
- Logs de auditoría completos
- Prevención de double-spending

---

## 📈 **FLUJO DE NEGOCIO**

### **1. Registro de Usuario:**
Usuario se registra → Email de verificación → Billetera creada automáticamente

### **2. Recarga de Saldo:**
Usuario solicita recarga → Sube comprobante → Admin aprueba → Balance actualizado

### **3. Realizar Apuesta:**
Usuario ve eventos del día → Selecciona predicción → Confirma apuesta → Balance deducido

### **4. Finalizar Evento:**
Admin selecciona resultado → Ganancias calculadas → Balances actualizados → Usuarios notificados

### **5. Retiro de Fondos:**
Usuario solicita retiro → Validación de balance → Admin procesa → Transferencia bancaria

---

## 🎯 **MEJORAS IMPLEMENTADAS RECIENTEMENTE**

### **✅ Filtrado por Día Actual:**
- App móvil solo muestra eventos del día actual
- Optimización de performance y UX

### **✅ Cancelación con Reembolso Automático:**
- Sistema de cancelación desde dashboard
- Reembolso automático a usuarios afectados
- Registro de transacciones de reembolso

### **✅ Modal de Finalización Mejorado:**
- **🆕 Lista detallada de usuarios por predicción**
- Información completa antes de seleccionar ganador
- Cálculo preciso de pagos totales
- Interface responsive y clara

### **✅ Sincronización Mobile-Dashboard:**
- Conexión perfecta entre app móvil y dashboard
- Visualización inmediata de apuestas
- Estados sincronizados en tiempo real

---

## 📱 **DEPLOYMENT**

### **App Móvil:**
```bash
# Build para tiendas de aplicaciones
eas build --platform android --profile production
eas build --platform ios --profile production

# Subir a tiendas
eas submit --platform android
eas submit --platform ios
```

### **Dashboard:**
```bash
# Build optimizado
npm run build

# Deploy a Vercel (recomendado)
vercel deploy

# O cualquier hosting que soporte Next.js
```

---

## 📞 **SOPORTE Y MANTENIMIENTO**

### **🔧 Scripts útiles:**
- `npm start` - Ejecutar app móvil
- `npm run build` - Build de producción
- `npm run lint` - Verificar código

### **📋 Variables de entorno necesarias:**
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo dashboard)

---

## ✅ **ESTADO DEL PROYECTO: PRODUCTION READY**

- ✅ Código limpio y optimizado
- ✅ Sin archivos de testing o debug
- ✅ Documentación completa
- ✅ Scripts de build configurados
- ✅ Base de datos optimizada
- ✅ Funcionalidades core completadas
- ✅ Sistema de seguridad implementado
- ✅ UI/UX optimizada para ambas plataformas

**🎉 El sistema está listo para despliegue en producción.**