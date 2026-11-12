"""Constantes y catálogos centrales de las reglas de nómina de TransCaribeCol."""

from decimal import Decimal
from typing import TypedDict

TIPO_ADMINISTRATIVO = "ADMINISTRATIVO"
TIPO_OPERATIVO = "OPERATIVO"
TIPOS_EMPLEADO = (TIPO_ADMINISTRATIVO, TIPO_OPERATIVO)

# ---------------------------------------------------------------------------
# Módulo A - Empleados administrativos
# ---------------------------------------------------------------------------
VALOR_HORA_ADMINISTRATIVO = 20_000
VALOR_HORA_EXTRA_ADMINISTRATIVO = 25_000
PORCENTAJE_SALUD_ADMINISTRATIVO = Decimal("4")  # % sobre el total devengado
PORCENTAJE_PENSION_ADMINISTRATIVO = Decimal("4")  # % sobre el total devengado
PORCENTAJE_ARL_ADMINISTRATIVO = Decimal("0.522")  # Riesgo I
NIVEL_RIESGO_ADMINISTRATIVO = "I"

# ---------------------------------------------------------------------------
# Módulo B - Empleados operativos (trabajadores oficiales)
# ---------------------------------------------------------------------------
VALOR_HORA_OPERATIVO = 40_000
PORCENTAJE_IBC = Decimal("40")  # % del salario bruto
PORCENTAJE_SALUD_OPERATIVO = Decimal("12.5")  # % sobre el IBC
PORCENTAJE_PENSION_OPERATIVO = Decimal("16")  # % sobre el IBC


class CargoOperativo(TypedDict):
    """Configuración fija de un cargo operativo."""

    horas_mensuales: int
    nivel_riesgo: str
    porcentaje_arl: Decimal


CARGOS_OPERATIVOS: dict[str, CargoOperativo] = {
    "Conductor": {
        "horas_mensuales": 160,
        "nivel_riesgo": "II",
        "porcentaje_arl": Decimal("1.044"),
    },
    "Oficios Generales": {
        "horas_mensuales": 100,
        "nivel_riesgo": "I",
        "porcentaje_arl": Decimal("0.522"),
    },
    "Vigilancia": {
        "horas_mensuales": 336,
        "nivel_riesgo": "IV",
        "porcentaje_arl": Decimal("4.350"),
    },
}

NOMBRES_CARGOS_OPERATIVOS = tuple(CARGOS_OPERATIVOS.keys())

# ---------------------------------------------------------------------------
# Formato de persistencia
# ---------------------------------------------------------------------------
COLUMNAS_TXT = (
    "Nombre",
    "Tipo",
    "Cargo",
    "HT",
    "Salario",
    "HE",
    "TPHE",
    "Salud",
    "Pension",
    "ARL",
    "Total a pagar",
)
CABECERA_TXT = ";".join(COLUMNAS_TXT)


def capitalizar_nombre(nombre: str | None) -> str:
    """Normaliza y capitaliza formalmente un nombre propio en español.

    Mantiene en minúscula los conectores y preposiciones intermedias
    (de, del, la, las, los, y, e) salvo cuando son la palabra inicial.
    """
    partes = str(nombre or "").strip().split()
    if not partes:
        return ""
    conectores = {"de", "del", "la", "las", "los", "y", "e"}
    palabras: list[str] = []
    for i, p in enumerate(partes):
        p_lower = p.lower()
        if i > 0 and p_lower in conectores:
            palabras.append(p_lower)
        else:
            palabras.append(p.capitalize())
    return " ".join(palabras)

