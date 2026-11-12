# Imagen base oficial multi-arquitectura (amd64 / arm64)
FROM python:3.12-slim

# Evitar escritura de bytecode y garantizar salida de logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Instalar curl para el healthcheck del contenedor
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del backend
COPY . .

# Asegurar existencia del directorio de datos de nómina
RUN mkdir -p /app/app/data

# Puerto del servicio
EXPOSE 8000

# Verificación de salud interna del contenedor
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/health || exit 1

# Comando de ejecución con Uvicorn escuchando en todas las interfaces de red
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
