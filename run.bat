@echo off
echo ==========================================
echo     SWAY - Sistema Web de Conservacion Marina
echo ==========================================
echo.
echo Iniciando servidor Flask...
echo.
echo Asegurate de tener Python instalado y las dependencias instaladas:
echo   pip install -r requirements.txt
echo.
echo El servidor se ejecutara en: http://localhost:5000
echo.
echo Para detener el servidor, presiona Ctrl+C
echo.
echo ==========================================
echo.

REM Activar entorno virtual si existe
if exist venv\Scripts\activate.bat (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
)

REM Ejecutar la aplicación
python app.py

pause
