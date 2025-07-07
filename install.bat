@echo off
echo ==========================================
echo     INSTALACION DE DEPENDENCIAS - SWAY
echo ==========================================
echo.
echo Instalando dependencias necesarias...
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en el PATH
    echo Por favor, instala Python desde https://python.org
    pause
    exit /b 1
)

REM Crear entorno virtual si no existe
if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
)

REM Activar entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate.bat

REM Instalar dependencias
echo Instalando dependencias desde requirements.txt...
pip install -r requirements.txt

echo.
echo ==========================================
echo     INSTALACION COMPLETADA
echo ==========================================
echo.
echo Para ejecutar la aplicacion, usa:
echo   run.bat
echo.
echo O ejecuta manualmente:
echo   venv\Scripts\activate.bat
echo   python app.py
echo.
pause
