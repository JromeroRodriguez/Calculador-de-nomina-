"""Aplicación FastAPI del Sistema de Nómina de TransCaribeCol."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models.schemas import EstadoServidor
from app.routes import configuracion, empleados, nomina
from app.services.archivo_txt import ArchivoNominaError, asegurar_archivo

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        ruta = asegurar_archivo()
        logger.info("Archivo de nóminas disponible en %s", ruta)
    except ArchivoNominaError:
        logger.exception("No fue posible preparar el archivo de nóminas al iniciar.")
    yield


app = FastAPI(
    title="Sistema de Nómina TransCaribeCol",
    description=(
        "API REST para la gestión de nómina de empleados administrativos y "
        "trabajadores operativos de Transportes del Gran Caribe Colombiano S.C.A."
    ),
    version=VERSION,
    lifespan=lifespan,
)

origenes_configurados = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5174,http://127.0.0.1:5174,http://localhost:4174,http://127.0.0.1:4174",
)
origenes = [origen.strip() for origen in origenes_configurados.split(",") if origen.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


def _mensaje_validacion(exc: RequestValidationError) -> str:
    """Traduce el primer error de Pydantic a un mensaje comprensible en español."""

    errores = exc.errors()
    if not errores:
        return "Los datos enviados no son válidos."

    error = errores[0]
    tipo = error.get("type", "")
    ubicacion = [str(parte) for parte in error.get("loc", ()) if parte != "body"]
    campo = ".".join(ubicacion) or "solicitud"

    if tipo == "extra_forbidden":
        return (
            f"El campo '{campo}' no está permitido. Las horas operativas, el riesgo "
            "y los porcentajes son determinados automáticamente por el sistema."
        )
    if tipo == "missing":
        return f"El campo '{campo}' es obligatorio."
    if tipo in {
        "int_parsing",
        "int_type",
        "int_from_float",
        "float_parsing",
        "float_type",
    }:
        return f"El campo '{campo}' debe ser un número válido."
    if tipo == "string_type":
        return f"El campo '{campo}' debe ser texto."

    mensaje = error.get("msg", "Los datos enviados no son válidos.")
    prefijo = "Value error, "
    if mensaje.startswith(prefijo):
        mensaje = mensaje[len(prefijo) :]
    return mensaje


@app.exception_handler(RequestValidationError)
async def manejar_error_validacion(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": _mensaje_validacion(exc)},
    )


@app.exception_handler(ArchivoNominaError)
async def manejar_error_archivo(_: Request, exc: ArchivoNominaError) -> JSONResponse:
    logger.error("Error de archivo de nóminas: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": (
                "Ocurrió un problema al acceder al archivo de nóminas. "
                "Verifique los permisos y la integridad de backend/app/data/nomina.txt."
            )
        },
    )


@app.get("/api/health", response_model=EstadoServidor, tags=["Sistema"])
def health() -> EstadoServidor:
    return EstadoServidor(
        estado="ok",
        servicio="Sistema de Nómina TransCaribeCol",
        version=VERSION,
    )


@app.get("/", include_in_schema=False)
def raiz() -> dict[str, str]:
    return {
        "servicio": "Sistema de Nómina TransCaribeCol",
        "documentacion": "/docs",
        "estado": "/api/health",
    }


app.include_router(nomina.router)
app.include_router(empleados.router)
app.include_router(configuracion.router)
