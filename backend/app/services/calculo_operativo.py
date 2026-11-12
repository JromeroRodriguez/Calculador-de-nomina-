"""Reglas de cálculo para empleados operativos (Módulo B)."""

from decimal import Decimal

from app.constantes import (
    CARGOS_OPERATIVOS,
    PORCENTAJE_IBC,
    PORCENTAJE_PENSION_OPERATIVO,
    PORCENTAJE_SALUD_OPERATIVO,
    TIPO_OPERATIVO,
    VALOR_HORA_OPERATIVO,
)
from app.services.calculo_administrativo import ResultadoCalculo, redondear_peso


def calcular_operativo(nombre: str, cargo: str) -> ResultadoCalculo:
    """Calcula la nómina de un trabajador operativo a partir del cargo seleccionado.

    Las horas mensuales, el nivel de riesgo y el porcentaje ARL son determinados
    exclusivamente por el catálogo del backend; nunca por el frontend.
    """

    configuracion = CARGOS_OPERATIVOS.get(cargo)
    if configuracion is None:
        cargos = ", ".join(CARGOS_OPERATIVOS)
        raise ValueError(f"El cargo operativo debe ser uno de: {cargos}.")

    horas_mensuales = configuracion["horas_mensuales"]
    salario = Decimal(horas_mensuales) * Decimal(VALOR_HORA_OPERATIVO)
    ibc = salario * PORCENTAJE_IBC / Decimal("100")

    salud = redondear_peso(ibc * PORCENTAJE_SALUD_OPERATIVO / Decimal("100"))
    pension = redondear_peso(ibc * PORCENTAJE_PENSION_OPERATIVO / Decimal("100"))
    arl = redondear_peso(ibc * configuracion["porcentaje_arl"] / Decimal("100"))

    total_descuentos = salud + pension + arl
    salario_entero = int(salario)
    total_pagar = salario_entero - total_descuentos

    return ResultadoCalculo(
        nombre=nombre,
        tipo=TIPO_OPERATIVO,
        cargo=cargo,
        horas_trabajadas=horas_mensuales,
        salario=salario_entero,
        horas_extras=0,
        total_pago_horas_extras=0,
        salud=salud,
        pension=pension,
        arl=arl,
        total_devengado=salario_entero,
        total_descuentos=total_descuentos,
        total_pagar=total_pagar,
        valor_hora=VALOR_HORA_OPERATIVO,
        nivel_riesgo=configuracion["nivel_riesgo"],
        porcentaje_arl=float(configuracion["porcentaje_arl"]),
        ibc=redondear_peso(ibc),
    )
