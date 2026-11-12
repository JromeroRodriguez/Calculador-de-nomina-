"""Pruebas de las fórmulas administrativas y operativas."""

from decimal import Decimal

import pytest

from app.services.calculo_administrativo import (
    calcular_administrativo,
    redondear_peso,
)
from app.services.calculo_operativo import calcular_operativo


def test_caso_1_administrativo():
    resultado = calcular_administrativo(
        "Ana Maria Jaimes Gonzalez", "Auxiliar Administrativo", 40, 20
    )

    assert resultado.salario == 800_000
    assert resultado.total_pago_horas_extras == 500_000
    assert resultado.total_devengado == 1_300_000
    assert resultado.salud == 52_000
    assert resultado.pension == 52_000
    assert resultado.arl == 6_786
    assert resultado.total_descuentos == 110_786
    assert resultado.total_pagar == 1_189_214
    assert resultado.horas_trabajadas == 40
    assert resultado.horas_extras == 20


def test_administrativo_sin_horas_extras():
    resultado = calcular_administrativo("Carlos Perez", "Contador", 40, 0)

    assert resultado.total_pago_horas_extras == 0
    assert resultado.total_devengado == 800_000
    assert resultado.salud == 32_000
    assert resultado.pension == 32_000
    assert resultado.arl == 4_176
    assert resultado.total_descuentos == 68_176
    assert resultado.total_pagar == 731_824


def test_administrativo_sin_horas():
    resultado = calcular_administrativo("Sin Horas", "Auxiliar", 0, 0)
    assert resultado.total_devengado == 0
    assert resultado.total_descuentos == 0
    assert resultado.total_pagar == 0


@pytest.mark.parametrize(
    (
        "cargo",
        "horas",
        "nivel",
        "porcentaje",
        "salario",
        "ibc",
        "salud",
        "pension",
        "arl",
        "descuentos",
        "total",
    ),
    [
        (
            "Conductor",
            160,
            "II",
            1.044,
            6_400_000,
            2_560_000,
            320_000,
            409_600,
            26_726,
            756_326,
            5_643_674,
        ),
        (
            "Oficios Generales",
            100,
            "I",
            0.522,
            4_000_000,
            1_600_000,
            200_000,
            256_000,
            8_352,
            464_352,
            3_535_648,
        ),
        (
            "Vigilancia",
            336,
            "IV",
            4.350,
            13_440_000,
            5_376_000,
            672_000,
            860_160,
            233_856,
            1_766_016,
            11_673_984,
        ),
    ],
)
def test_casos_operativos(
    cargo,
    horas,
    nivel,
    porcentaje,
    salario,
    ibc,
    salud,
    pension,
    arl,
    descuentos,
    total,
):
    resultado = calcular_operativo("Trabajador Operativo", cargo)

    assert resultado.cargo == cargo
    assert resultado.horas_trabajadas == horas
    assert resultado.horas_extras == 0
    assert resultado.total_pago_horas_extras == 0
    assert resultado.nivel_riesgo == nivel
    assert resultado.porcentaje_arl == pytest.approx(porcentaje)
    assert resultado.salario == salario
    assert resultado.ibc == ibc
    assert resultado.salud == salud
    assert resultado.pension == pension
    assert resultado.arl == arl
    assert resultado.total_descuentos == descuentos
    assert resultado.total_pagar == total


def test_cargo_operativo_invalido():
    with pytest.raises(ValueError, match="cargo operativo"):
        calcular_operativo("X", "Gerente")


def test_redondeo_al_peso_mas_cercano():
    assert redondear_peso(Decimal("1000.4")) == 1000
    assert redondear_peso(Decimal("1000.5")) == 1001
    assert redondear_peso(Decimal("26726.4")) == 26726
    assert redondear_peso(Decimal("26726.5")) == 26727
