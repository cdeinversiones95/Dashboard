# ============================================================================
# SCRIPT DE VERIFICACIÓN Y LIMPIEZA - POWERSHELL
# ============================================================================
# Este script verifica que todo esté configurado correctamente
# y limpia el caché para forzar el uso del proyecto nuevo
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACIÓN DE PROYECTO SUPABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar directorio
$projectPath = "C:\Users\Gabriel\Desktop\JORGE 3\IGF-Football"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ ERROR: No se encuentra el proyecto" -ForegroundColor Red
    Write-Host "Ruta: $projectPath" -ForegroundColor Yellow
    exit
}

Set-Location $projectPath
Write-Host "✅ Directorio del proyecto: OK" -ForegroundColor Green
Write-Host ""

# Verificar archivo de configuración
$configFile = "src\config\supabase.js"
if (-not (Test-Path $configFile)) {
    Write-Host "❌ ERROR: No se encuentra supabase.js" -ForegroundColor Red
    exit
}

Write-Host "Verificando credenciales..." -ForegroundColor Yellow
$content = Get-Content $configFile -Raw

# URLs a verificar
$urlNueva = "squatbbpjbxcrgqasjil"
$urlVieja = "inontxioyantwtadqbnu"

if ($content -match $urlVieja) {
    Write-Host "❌ ERROR: ¡Todavía tienes el proyecto VIEJO!" -ForegroundColor Red
    Write-Host "   Encontrado: $urlVieja" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCIÓN:" -ForegroundColor Yellow
    Write-Host "El archivo debe tener: $urlNueva" -ForegroundColor Green
    Write-Host ""
    exit
}

if ($content -match $urlNueva) {
    Write-Host "✅ Credenciales correctas (proyecto NUEVO)" -ForegroundColor Green
    Write-Host "   URL: https://$urlNueva.supabase.co" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  ADVERTENCIA: No se encuentra ninguna URL de Supabase" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host ""

# Preguntar si desea limpiar caché
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA DE CACHÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "¿Deseas limpiar el caché para asegurar que use el proyecto nuevo?" -ForegroundColor Yellow
Write-Host "Esto detendrá Expo si está corriendo." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opciones:" -ForegroundColor Cyan
Write-Host "  1 - Limpiar caché de Expo solamente (Rápido)" -ForegroundColor White
Write-Host "  2 - Limpieza completa (Expo + node_modules)" -ForegroundColor White
Write-Host "  3 - Solo verificar, no limpiar" -ForegroundColor White
Write-Host "  0 - Salir" -ForegroundColor White
Write-Host ""

$opcion = Read-Host "Selecciona una opción (1-3, 0 para salir)"

switch ($opcion) {
    "1" {
        Write-Host ""
        Write-Host "🧹 Limpiando caché de Expo..." -ForegroundColor Yellow
        
        # Eliminar carpeta .expo
        if (Test-Path ".expo") {
            Remove-Item -Recurse -Force .expo
            Write-Host "  ✅ Eliminada carpeta .expo" -ForegroundColor Green
        }
        
        # Eliminar caché temporal
        $tempExpo = Join-Path $env:TEMP "expo-*"
        $tempMetro = Join-Path $env:TEMP "metro-*"
        
        Get-ChildItem $env:TEMP -Filter "expo-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem $env:TEMP -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-Host "  ✅ Caché temporal limpiado" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Limpieza completa!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
        Write-Host "  npx expo start --clear" -ForegroundColor White
        Write-Host ""
    }
    "2" {
        Write-Host ""
        Write-Host "🧹 Limpieza COMPLETA (esto tomará unos minutos)..." -ForegroundColor Yellow
        Write-Host ""
        
        # Eliminar .expo
        if (Test-Path ".expo") {
            Write-Host "  Eliminando .expo..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force .expo
            Write-Host "  ✅ .expo eliminado" -ForegroundColor Green
        }
        
        # Eliminar node_modules
        if (Test-Path "node_modules") {
            Write-Host "  Eliminando node_modules (puede tardar)..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force node_modules
            Write-Host "  ✅ node_modules eliminado" -ForegroundColor Green
        }
        
        # Eliminar package-lock
        if (Test-Path "package-lock.json") {
            Remove-Item -Force package-lock.json
            Write-Host "  ✅ package-lock.json eliminado" -ForegroundColor Green
        }
        
        # Eliminar caché temporal
        Get-ChildItem $env:TEMP -Filter "expo-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem $env:TEMP -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Caché temporal limpiado" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "✅ Limpieza completa!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
        Write-Host "  1. npm install" -ForegroundColor White
        Write-Host "  2. npx expo start --clear" -ForegroundColor White
        Write-Host ""
    }
    "3" {
        Write-Host ""
        Write-Host "✅ Verificación completa. No se limpió el caché." -ForegroundColor Green
        Write-Host ""
        Write-Host "Si los usuarios aún se guardan en el proyecto viejo," -ForegroundColor Yellow
        Write-Host "ejecuta este script de nuevo y selecciona opción 1 o 2." -ForegroundColor Yellow
        Write-Host ""
    }
    "0" {
        Write-Host ""
        Write-Host "Saliendo..." -ForegroundColor Yellow
        Write-Host ""
        exit
    }
    default {
        Write-Host ""
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        Write-Host ""
        exit
    }
}

# Mostrar resumen final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proyecto Supabase:" -ForegroundColor White
Write-Host "  ✅ URL: https://$urlNueva.supabase.co" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host "  1. Inicia Expo con: npx expo start --clear" -ForegroundColor Cyan
Write-Host "  2. Cierra sesión en la app si estás logueado" -ForegroundColor Cyan
Write-Host "  3. Registra un NUEVO usuario" -ForegroundColor Cyan
Write-Host "  4. Verifica en Supabase dashboard del proyecto NUEVO" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard del proyecto NUEVO:" -ForegroundColor White
Write-Host "  https://supabase.com/dashboard/project/$urlNueva" -ForegroundColor Green
Write-Host ""
Write-Host "¡Listo! 🚀" -ForegroundColor Green
Write-Host ""
