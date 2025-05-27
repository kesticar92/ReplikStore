from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
import random
import time
import datetime
from typing import List, Dict
from collections import deque
import os
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    require_role, fake_users_db, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

app = FastAPI()

# Configuración de templates y archivos estáticos
current_dir = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(current_dir, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(current_dir, "static")), name="static")

# Almacenamiento en memoria
lecturas_historicas = deque(maxlen=100)  # Mantener las últimas 100 lecturas

# Simulación de sensores
SENSORS = [
    {"id": "TEMP001", "name": "Temperatura", "min": 18, "max": 26, "unit": "°C"},
    {"id": "HUM001", "name": "Humedad", "min": 40, "max": 60, "unit": "%"},
    {"id": "STOCK001", "name": "Stock", "min": 20, "max": 100, "unit": "unidades"},
    {"id": "PRES001", "name": "Presencia", "min": 0, "max": 1, "unit": "presente"},
]

sensor_data = {}

def generate_sensor_data():
    global sensor_data
    sensor_data = {}
    for s in SENSORS:
        if s["id"].startswith("TEMP"):
            value = round(random.uniform(16, 28), 2)
        elif s["id"].startswith("HUM"):
            value = round(random.uniform(35, 65), 2)
        elif s["id"].startswith("STOCK"):
            value = random.randint(0, 120)
        elif s["id"].startswith("PRES"):
            value = random.choice([0, 1])
        else:
            value = 0
        status = "normal"
        if value < s["min"]:
            status = "bajo"
        elif value > s["max"]:
            status = "alto"
        sensor_data[s["id"]] = {
            "id": s["id"],
            "name": s["name"],
            "value": value,
            "unit": s["unit"],
            "min": s["min"],
            "max": s["max"],
            "status": status
        }

# Rutas de autenticación
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# Rutas protegidas para la API
@app.get("/api/sensors")
async def get_sensors(current_user = Depends(get_current_active_user)):
    generate_sensor_data()
    # Guardar cada lectura en memoria
    now = datetime.datetime.utcnow()
    docs = []
    for s in sensor_data.values():
        doc = s.copy()
        doc["timestamp"] = now
        docs.append(doc)
    if docs:
        lecturas_historicas.extend(docs)
    return list(sensor_data.values())

@app.get("/api/sensors/{sensor_id}")
async def get_sensor(sensor_id: str, current_user = Depends(get_current_active_user)):
    if sensor_id in sensor_data:
        return sensor_data[sensor_id]
    else:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")

@app.get("/api/history")
async def get_history(current_user = Depends(get_current_active_user)):
    # Obtener las últimas 10 lecturas del historial en memoria
    return list(lecturas_historicas)[-10:]

@app.get("/api/export")
async def export_data(current_user = Depends(require_role("admin"))):
    import csv
    from fastapi.responses import StreamingResponse
    import io

    # Usar las lecturas históricas en memoria
    if not lecturas_historicas:
        raise HTTPException(status_code=404, detail="No hay datos para exportar")

    # Obtener los nombres de los campos
    fieldnames = list(lecturas_historicas[0].keys())

    # Crear un buffer en memoria
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in lecturas_historicas:
        # Convertir timestamp a string si existe
        row = dict(row)
        if 'timestamp' in row and not isinstance(row['timestamp'], str):
            row['timestamp'] = row['timestamp'].isoformat()
        writer.writerow(row)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sensor_data.csv"}
    )

@app.get("/api/tabla_fake")
def get_tabla_fake():
    # Simula una tabla de registros históricos (para pruebas)
    tabla = []
    for i in range(10):
        row = {}
        for s in SENSORS:
            if s["id"].startswith("TEMP"):
                value = round(random.uniform(16, 28), 2)
            elif s["id"].startswith("HUM"):
                value = round(random.uniform(35, 65), 2)
            elif s["id"].startswith("STOCK"):
                value = random.randint(0, 120)
            elif s["id"].startswith("PRES"):
                value = random.choice([0, 1])
            else:
                value = 0
            row[s["id"]] = value
        tabla.append(row)
    return tabla

@app.get("/", response_class=HTMLResponse)
def dashboard():
    # Obtener el directorio actual del script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Construir la ruta al archivo HTML
    html_path = os.path.join(current_dir, "dashboard.html")
    with open(html_path) as f:
        return f.read()

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")), name="static") 