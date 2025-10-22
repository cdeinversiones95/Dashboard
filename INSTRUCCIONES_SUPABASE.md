# 🔧 CONFIGURACIÓN IMPORTANTE EN SUPABASE

## ⚠️ DEBES HACER ESTO PARA QUE FUNCIONE EL LOGIN CON TELÉFONO

### Opción 1: Desactivar confirmación de email (RECOMENDADO)

1. Ve a tu proyecto Supabase:
   https://supabase.com/dashboard/project/qoysbxeqxngdqfgbljdm

2. En el menú lateral, ve a: **Authentication** → **Providers**

3. Haz clic en **Email** para expandir la configuración

4. **DESACTIVA** estas opciones:
   - ❌ "Confirm email" (Enable email confirmations)
   - ✅ Deja activado "Enable email provider"

5. Haz clic en **Save** para guardar los cambios

### Opción 2: Usar autenticación por teléfono (ALTERNATIVA)

Si prefieres usar autenticación por teléfono nativa de Supabase:

1. Ve a: **Authentication** → **Providers**

2. Activa el proveedor **Phone**

3. Configura un proveedor de SMS (Twilio, MessageBird, etc.)

### ¿Por qué es necesario?

- La app usa números de teléfono para login
- Internamente convierte el teléfono a email: `numero@phone.local`
- Supabase valida el formato del email
- Si la confirmación está activa, rechaza dominios no estándar

### Después de configurar:

1. Recarga la app (presiona `r` en la terminal de Expo)
2. Intenta registrar un usuario con un número de teléfono
3. Debería funcionar sin problemas

---

**Estado actual:**
- ✅ Base de datos configurada
- ✅ Tablas creadas
- ✅ Triggers funcionando
- ⏳ Falta: Desactivar confirmación de email en Supabase
