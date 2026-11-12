"""Catálogo informativo de tarifas y cargos para el formulario del frontend."""

from fastapi import APIRouter

from app.constantes import (
    CARGOS_OPERATIVOS,
    NIVEL_RIESGO_ADMINISTRATIVO,
    PORCENTAJE_ARL_ADMINISTRATIVO,
    PORCENTAJE_IBC,
    PORCENTAJE_PENSION_ADMINISTRATIVO,
    PORCENTAJE_PENSION_OPERATIVO,
    PORCENTAJE_SALUD_ADMINISTRATIVO,
    PORCENTAJE_SALUD_OPERATIVO,
    VALOR_HORA_ADMINISTRATIVO,
    VALOR_HORA_EXTRA_ADMINISTRATIVO,
    VALOR_HORA_OPERATIVO,
)
from app.models.schemas import (
    CargoOperativoConfig,
    ConfiguracionAdministrativo,
    ConfiguracionNomina,
    ConfiguracionOperativo,
)

router = APIRouter(prefix="/api", tags=["Configuración"])


@router.get(
    "/configuracion",
    response_model=ConfiguracionNomina,
    summary="Consultar tarifas, porcentajes y cargos operativos vigentes",
)
def configuracion() -> ConfiguracionNomina:
    cargos = [
        CargoOperativoConfig(
            nombre=nombre,
            horas_mensuales=configuracion["horas_mensuales"],
            nivel_riesgo=configuracion["nivel_riesgo"],
            porcentaje_arl=float(configuracion["porcentaje_arl"]),
        )
        for nombre, configuracion in CARGOS_OPERATIVOS.items()
    ]

    return ConfiguracionNomina(
        administrativo=ConfiguracionAdministrativo(
            valor_hora_ordinaria=VALOR_HORA_ADMINISTRATIVO,
            valor_hora_extra=VALOR_HORA_EXTRA_ADMINISTRATIVO,
            porcentaje_salud=float(PORCENTAJE_SALUD_ADMINISTRATIVO),
            porcentaje_pension=float(PORCENTAJE_PENSION_ADMINISTRATIVO),
            porcentaje_arl=float(PORCENTAJE_ARL_ADMINISTRATIVO),
            nivel_riesgo=NIVEL_RIESGO_ADMINISTRATIVO,
        ),
        operativo=ConfiguracionOperativo(
            valor_hora=VALOR_HORA_OPERATIVO,
            porcentaje_ibc=float(PORCENTAJE_IBC),
            porcentaje_salud=float(PORCENTAJE_SALUD_OPERATIVO),
            porcentaje_pension=float(PORCENTAJE_PENSION_OPERATIVO),
            cargos=cargos,
        ),
    )
