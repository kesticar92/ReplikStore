#!/bin/bash

# Cambiar al directorio del proyecto
cd "$(dirname "$0")"

# Crear y activar entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
echo "Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar el servidor
echo "Iniciando servidor..."
python3 run_demo.py 