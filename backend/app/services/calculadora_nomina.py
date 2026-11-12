"""Punto único de entrada para el cálculo de nómina según el tipo de empleado."""

from app.constantes import (
    CARGOS_OPERATIVOS,
    TIPO_ADMINISTRATIVO,
    TIPO_OPERATIVO,
    TIPOS_EMPLEADO,
)
from app.models.schemas import NominaSolicitud
from app.services.calculo_administrativo import ResultadoCalculo, calcular_administrativo
from app.services.calculo_operativo import calcular_operativo


def calcular_nomina(solicitud: NominaSolicitud) -> ResultadoCalculo:
    """Aplica las reglas correspondientes al tipo de empleado solicitado."""

    if solicitud.tipo not in TIPOS_EMPLEADO:
        raise ValueError("El tipo de empleado debe ser ADMINISTRATIVO u OPERATIVO.")

    nombre = solicitud.nombre.strip()
    cargo = solicitud.cargo.strip()

    if not nombre:
        raise ValueError("El nombre es obligatorio y no puede contener solo espacios.")
    if not cargo:
        raise ValueError("El cargo es obligatorio.")

    if solicitud.tipo == TIPO_ADMINISTRATIVO:
        if solicitud.horas_trabajadas is None:
            raise ValueError("Las horas ordinarias son obligatorias para un administrativo.")
        if solicitud.horas_trabajadas < 0:
            raise ValueError("Las horas ordinarias no pueden ser negativas.")
        if solicitud.horas_extras is None:
            horas_extras = 0
        else:
            horas_extras = solicitud.horas_extras
        if horas_extras < 0:
            raise ValueError("Las horas extras no pueden ser negativas.")
        return calcular_administrativo(nombre, cargo, solicitud.horas_trabajadas, horas_extras)

    # Operativo: las horas y el riesgo provienen exclusivamente del cargo.
    if cargo not in CARGOS_OPERATIVOS:
        cargos = ", ".join(CARGOS_OPERATIVOS)
        raise ValueError(f"El cargo operativo debe ser uno de: {cargos}.")
    if solicitud.horas_trabajadas is not None:
        raise ValueError(
            "Las horas de los trabajadores operativos se asignan automáticamente "
            "según el cargo y no pueden enviarse manualmente."
        )
    if solicitud.horas_extras not in (None, 0):
        raise ValueError("Los trabajadores operativos no pueden registrar horas extras.")

    return calcular_operativo(nombre, cargo)
