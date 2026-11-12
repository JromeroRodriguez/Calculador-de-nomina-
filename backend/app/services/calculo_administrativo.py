"""Reglas de cálculo para empleados administrativos (Módulo A)."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from app.constantes import (
    NIVEL_RIESGO_ADMINISTRATIVO,
    PORCENTAJE_ARL_ADMINISTRATIVO,
    PORCENTAJE_PENSION_ADMINISTRATIVO,
    PORCENTAJE_SALUD_ADMINISTRATIVO,
    TIPO_ADMINISTRATIVO,
    VALOR_HORA_ADMINISTRATIVO,
    VALOR_HORA_EXTRA_ADMINISTRATIVO,
)


@dataclass(frozen=True)
class ResultadoCalculo:
    """Resultado monetario completo de una liquidación de nómina."""

    nombre: str
    tipo: str
    cargo: str
    horas_trabajadas: int
    salario: int
    horas_extras: int
    total_pago_horas_extras: int
    salud: int
    pension: int
    arl: int
    total_devengado: int
    total_descuentos: int
    total_pagar: int
    valor_hora: int
    nivel_riesgo: str
    porcentaje_arl: float
    ibc: int | None = None


def redondear_peso(valor: Decimal) -> int:
    """Redondea un valor Decimal al peso colombiano más cercano (medio hacia arriba)."""

    return int(valor.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calcular_administrativo(
    nombre: str,
    cargo: str,
    horas_trabajadas: int,
    horas_extras: int,
) -> ResultadoCalculo:
    """Calcula la nómina de un empleado administrativo según el ejercicio académico."""

    salario = Decimal(horas_trabajadas) * Decimal(VALOR_HORA_ADMINISTRATIVO)
    total_pago_horas_extras = Decimal(horas_extras) * Decimal(
        VALOR_HORA_EXTRA_ADMINISTRATIVO
    )
    total_devengado = salario + total_pago_horas_extras

    salud = redondear_peso(
        total_devengado * PORCENTAJE_SALUD_ADMINISTRATIVO / Decimal("100")
    )
    pension = redondear_peso(
        total_devengado * PORCENTAJE_PENSION_ADMINISTRATIVO / Decimal("100")
    )
    arl = redondear_peso(
        total_devengado * PORCENTAJE_ARL_ADMINISTRATIVO / Decimal("100")
    )

    total_descuentos = salud + pension + arl
    total_devengado_entero = int(total_devengado)
    total_pagar = total_devengado_entero - total_descuentos

    return ResultadoCalculo(
        nombre=nombre,
        tipo=TIPO_ADMINISTRATIVO,
        cargo=cargo,
        horas_trabajadas=horas_trabajadas,
        salario=int(salario),
        horas_extras=horas_extras,
        total_pago_horas_extras=int(total_pago_horas_extras),
        salud=salud,
        pension=pension,
        arl=arl,
        total_devengado=total_devengado_entero,
        total_descuentos=total_descuentos,
        total_pagar=total_pagar,
        valor_hora=VALOR_HORA_ADMINISTRATIVO,
        nivel_riesgo=NIVEL_RIESGO_ADMINISTRATIVO,
        porcentaje_arl=float(PORCENTAJE_ARL_ADMINISTRATIVO),
        ibc=None,
    )
