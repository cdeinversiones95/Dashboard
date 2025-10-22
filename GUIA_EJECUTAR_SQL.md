# 🚀 Guía Rápida - Ejecutar Script de Recarga

## 📋 Paso 1: Ir a Supabase

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Selecciona el proyecto: **qoysbxeqxngdqfgbljdm**

## 💻 Paso 2: Abrir SQL Editor

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"New Query"** o **"Nueva Consulta"**

## 📝 Paso 3: Copiar y Pegar

1. Abre el archivo: `11_CREAR_TABLA_RECHARGE_AMOUNTS.sql`
2. Selecciona TODO el contenido (Ctrl + A)
3. Copia (Ctrl + C)
4. Pega en el SQL Editor de Supabase (Ctrl + V)

## ▶️ Paso 4: Ejecutar

1. Haz clic en el botón **"Run"** (o presiona Ctrl + Enter)
2. Espera a que termine (debería tomar 2-3 segundos)

## ✅ Paso 5: Verificar Resultados

Deberías ver al final:

### Tabla 1: Montos de Recarga
```
| amount   | currency | display_order |
|----------|----------|---------------|
| 1000.00  | DOP      | 1             |
| 2500.00  | DOP      | 2             |
| 5000.00  | DOP      | 3             |
| 10000.00 | DOP      | 4             |
| 25000.00 | DOP      | 5             |
| 50000.00 | DOP      | 6             |
```

### Total: 6 montos

## 🎉 ¡Listo!

Ahora puedes probar la app móvil:
1. Ve a Perfil
2. Click en "Recargar"
3. Selecciona Bancario o USDT
4. Verás los montos y el timer de 60 minutos

---

## ⚠️ Si hay algún error

Si sale algún error, copia el mensaje y dímelo para ayudarte a resolverlo.
