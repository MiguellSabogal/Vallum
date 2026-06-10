@echo off
cd /d "%~dp0"

echo.
echo ============================================
echo  Celestial Boutique M&V — Setup y arranque
echo ============================================
echo.

:: Git commit
echo [1/3] Haciendo commit...
git config user.email "miguellsabogal@gmail.com"
git config user.name "Miguel"
git add scripts/ app/api/revalidate/
git commit -m "feat: catalog import system multiagente 2026 - 213 productos"
echo.

:: Insertar productos en la BD
echo [2/3] Insertando 213 productos en PostgreSQL...
cd scripts
python catalog_orchestrator.py --from-json products_catalog_2026.json
cd ..
echo.

:: Arrancar Next.js
echo [3/3] Arrancando servidor en http://localhost:3000 ...
echo (Ctrl+C para detener)
echo.
npm run dev
