"""Endpoint de consulta de empleados registrados (únicos) en el historial."""

from fastapi import APIRouter

from app.models.schemas import ListaEmpleados
from app.services.consultas_nomina import listar_empleados_unicos

router = APIRouter(prefix="/api", tags=["Empleados"])


@router.get(
    "/empleados",
    response_model=ListaEmpleados,
    summary="Consultar los empleados registrados en el historial",
)
def empleados() -> ListaEmpleados:
    return listar_empleados_unicos()
