"""Consultas y datos derivados del historial persistido en el TXT."""

from __future__ import annotations

from typing import Any

from app.constantes import (
    CARGOS_OPERATIVOS,
    NIVEL_RIESGO_ADMINISTRATIVO,
    PORCENTAJE_ARL_ADMINISTRATIVO,
    TIPO_ADMINISTRATIVO,
    TIPO_OPERATIVO,
    VALOR_HORA_ADMINISTRATIVO,
    VALOR_HORA_OPERATIVO,
)
from app.models.schemas import (
    EmpleadoResumen,
    EstadisticasNomina,
    HistorialNomina,
    ListaEmpleados,
    NominaRegistro,
)
from app.services.archivo_txt import leer_registros


def _construir_registro(datos: dict[str, Any], identificador: int) -> NominaRegistro:
    """Añade al registro persistido los metadatos informativos del tipo/cargo."""

    tipo = str(datos["tipo"]).strip().upper()
    cargo = str(datos["cargo"]).strip()

    if tipo == TIPO_ADMINISTRATIVO:
        valor_hora = VALOR_HORA_ADMINISTRATIVO
        nivel_riesgo = NIVEL_RIESGO_ADMINISTRATIVO
        porcentaje_arl = float(PORCENTAJE_ARL_ADMINISTRATIVO)
        ibc = None
    elif tipo == TIPO_OPERATIVO:
        valor_hora = VALOR_HORA_OPERATIVO
        configuracion = CARGOS_OPERATIVOS.get(cargo)
        if not configuracion:
            cargo_norm = cargo.casefold()
            for k, conf in CARGOS_OPERATIVOS.items():
                if k.casefold() == cargo_norm:
                    configuracion = conf
                    cargo = k
                    break

        if configuracion:
            nivel_riesgo = configuracion["nivel_riesgo"]
            porcentaje_arl = float(configuracion["porcentaje_arl"])
        else:
            nivel_riesgo = "N/D"
            porcentaje_arl = 0.0
        ibc = round(datos["salario"] * 0.40)
    else:
        valor_hora = 0
        nivel_riesgo = "N/D"
        porcentaje_arl = 0.0
        ibc = None

    total_devengado = datos["salario"] + datos["total_pago_horas_extras"]
    total_descuentos = datos["salud"] + datos["pension"] + datos["arl"]

    return NominaRegistro(
        id=identificador,
        nombre=datos["nombre"],
        tipo=tipo,
        cargo=cargo,
        horas_trabajadas=datos["horas_trabajadas"],
        salario=datos["salario"],
        horas_extras=datos["horas_extras"],
        total_pago_horas_extras=datos["total_pago_horas_extras"],
        salud=datos["salud"],
        pension=datos["pension"],
        arl=datos["arl"],
        total_devengado=total_devengado,
        total_descuentos=total_descuentos,
        total_pagar=datos["total_pagar"],
        valor_hora=valor_hora,
        nivel_riesgo=nivel_riesgo,
        porcentaje_arl=porcentaje_arl,
        ibc=ibc,
    )


def listar_registros() -> list[NominaRegistro]:
    """Devuelve el historial completo con identificadores consecutivos."""

    filas = leer_registros()
    return [
        _construir_registro(fila, indice)
        for indice, fila in enumerate(filas, start=1)
    ]


def construir_historial() -> HistorialNomina:
    registros = listar_registros()
    return HistorialNomina(total=len(registros), registros=registros)


def obtener_registro(identificador: int) -> NominaRegistro | None:
    if identificador < 1:
        return None
    registros = listar_registros()
    if identificador > len(registros):
        return None
    return registros[identificador - 1]


def listar_empleados_unicos() -> ListaEmpleados:
    """Agrupa el historial por nombre, tipo y cargo.

    Un mismo empleado puede tener varios volantes; para las tarjetas de
    "empleados registrados" se cuenta una sola vez y se conserva su último
    registro como referencia.
    """

    agrupados: dict[tuple[str, str, str], EmpleadoResumen] = {}

    for registro in listar_registros():
        clave = (
            registro.nombre.casefold(),
            registro.tipo,
            registro.cargo.casefold(),
        )
        existente = agrupados.get(clave)
        if existente is None:
            agrupados[clave] = EmpleadoResumen(
                id=registro.id,
                nombre=registro.nombre,
                tipo=registro.tipo,
                cargo=registro.cargo,
                horas_trabajadas=registro.horas_trabajadas,
                valor_hora=registro.valor_hora,
                nivel_riesgo=registro.nivel_riesgo,
                porcentaje_arl=registro.porcentaje_arl,
                total_volantes=1,
                ultimo_registro=registro,
            )
        else:
            actualizado = existente.model_copy(
                update={
                    "id": registro.id,
                    "horas_trabajadas": registro.horas_trabajadas,
                    "valor_hora": registro.valor_hora,
                    "nivel_riesgo": registro.nivel_riesgo,
                    "porcentaje_arl": registro.porcentaje_arl,
                    "total_volantes": existente.total_volantes + 1,
                    "ultimo_registro": registro,
                }
            )
            agrupados[clave] = actualizado

    empleados = sorted(
        agrupados.values(),
        key=lambda empleado: (empleado.nombre.casefold(), empleado.cargo.casefold()),
    )
    return ListaEmpleados(total=len(empleados), empleados=empleados)


def calcular_estadisticas() -> EstadisticasNomina:
    registros = listar_registros()
    empleados = listar_empleados_unicos().empleados

    return EstadisticasNomina(
        total_empleados=len(empleados),
        empleados_administrativos=sum(
            1 for empleado in empleados if empleado.tipo == TIPO_ADMINISTRATIVO
        ),
        empleados_operativos=sum(
            1 for empleado in empleados if empleado.tipo == TIPO_OPERATIVO
        ),
        total_volantes=len(registros),
        total_nomina_procesada=sum(registro.total_pagar for registro in registros),
        ultimo_volante=registros[-1] if registros else None,
    )
