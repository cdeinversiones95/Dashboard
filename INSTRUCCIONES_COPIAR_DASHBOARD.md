# 📂 Instrucciones: Integrar TransactionManagement al Dashboard

## 🎯 Ubicación del Componente

El archivo `DASHBOARD_TransactionManagement.jsx` debe ir en tu dashboard Next.js.

---

## 📋 PASO 1: Copiar el Archivo al Dashboard

### Opción A: Como Página (RECOMENDADO)

1. Ve a tu dashboard: `C:\Users\Gabriel\Desktop\JORGE 3\cde-dashboard`
2. Navega a la carpeta: `pages/` (o `app/` si usas App Router)
3. Crea el archivo: **`transactions.jsx`** (o `transactions.tsx` si usas TypeScript)
4. Copia TODO el contenido de `DASHBOARD_TransactionManagement.jsx`
5. Pégalo en `pages/transactions.jsx`

**Resultado:** Podrás acceder en `http://localhost:3000/transactions`

### Opción B: Como Componente

1. Ve a: `C:\Users\Gabriel\Desktop\JORGE 3\cde-dashboard\components`
2. Crea el archivo: **`TransactionManagement.jsx`**
3. Copia el contenido de `DASHBOARD_TransactionManagement.jsx`
4. Luego impórtalo en cualquier página que lo necesite

---

## 📋 PASO 2: Actualizar Credenciales de Supabase

Abre el archivo `transactions.jsx` y busca esta línea (alrededor de línea 10):

```javascript
const supabase = createClient(
  'https://qoysbxeqxngdqfgbljdm.supabase.co',
  'TU_SUPABASE_KEY_AQUI' // ⚠️ CAMBIA ESTO
);
```

**Reemplaza `TU_SUPABASE_KEY_AQUI`** con tu clave de Supabase:

1. Ve a: https://supabase.com/dashboard/project/qoysbxeqxngdqfgbljdm
2. Click en **Settings** → **API**
3. Copia la clave **`anon` / `public`**
4. Pégala en el código

Debería quedar algo así:
```javascript
const supabase = createClient(
  'https://qoysbxeqxngdqfgbljdm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu clave real
);
```

---

## 📋 PASO 3: Agregar al Menú de Navegación

### Si usas Sidebar/Layout

Busca tu archivo de navegación (ej: `components/Sidebar.jsx`, `components/Layout.jsx`, `components/Navigation.jsx`)

Agrega este item al menú:

```jsx
import Link from 'next/link';

// Dentro de tu menú
<Link href="/transactions">
  <a className="nav-link">
    💰 Gestión de Transacciones
  </a>
</Link>
```

### Si usas Next.js 13+ App Router

```jsx
import Link from 'next/link';

<Link href="/transactions" className="nav-link">
  💰 Gestión de Transacciones
</Link>
```

---

## 📋 PASO 4: Instalar Dependencias (si es necesario)

Si tu dashboard NO tiene Supabase instalado:

```bash
cd "C:\Users\Gabriel\Desktop\JORGE 3\cde-dashboard"
npm install @supabase/supabase-js
```

Si NO tienes Tailwind CSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 📋 PASO 5: Iniciar el Dashboard

```bash
cd "C:\Users\Gabriel\Desktop\JORGE 3\cde-dashboard"
npm run dev
```

Abre: http://localhost:3000/transactions

---

## 🎨 ESTRUCTURA ESPERADA

```
cde-dashboard/
├── pages/
│   ├── index.jsx                    # Home
│   ├── transactions.jsx             # ⭐ AQUÍ VA EL ARCHIVO
│   └── ...
├── components/
│   ├── Sidebar.jsx                  # Agregar link aquí
│   └── ...
├── package.json
└── ...
```

---

## ✅ VERIFICACIÓN

1. ✅ Archivo copiado a `pages/transactions.jsx`
2. ✅ Clave de Supabase actualizada
3. ✅ Link agregado al menú de navegación
4. ✅ Dashboard corriendo en localhost:3000
5. ✅ Funciones SQL ejecutadas en Supabase

---

## 🎉 ¡LISTO!

Ahora deberías poder:
- Ver la página en `/transactions`
- Ver todas las solicitudes de recarga
- Ver comprobantes de pago
- Aprobar/Rechazar transacciones
- Ver estadísticas en tiempo real

---

## 🐛 Solución de Problemas

### Error: "Module not found: Can't resolve '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: Tailwind CSS no funciona
Asegúrate de tener en `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  // ...
}
```

Y en `styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### No se ven las transacciones
1. Verifica que ejecutaste todos los SQL de `GUIA_RAPIDA_DASHBOARD.md`
2. Verifica que la clave de Supabase sea correcta
3. Revisa la consola del navegador (F12) para ver errores

---

## 📞 Siguiente Paso

Una vez copiado el archivo, avísame y te ayudo a:
1. Verificar que funcione correctamente
2. Personalizar los estilos si es necesario
3. Agregar más funcionalidades
