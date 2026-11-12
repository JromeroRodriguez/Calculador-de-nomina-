"""Persistencia de nóminas en el archivo plano ``data/nomina.txt``."""

from __future__ import annotations

import logging
import threading
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.constantes import CABECERA_TXT, capitalizar_nombre

logger = logging.getLogger(__name__)

RUTA_NOMINA = Path(__file__).resolve().parent.parent / "data" / "nomina.txt"
_LOCK = threading.RLock()


class ArchivoNominaError(Exception):
    """Error controlado al leer o escribir el archivo de nóminas."""


def asegurar_archivo(ruta: Path | None = None) -> Path:
    """Crea el directorio y el archivo con su cabecera cuando no existen."""

    destino = ruta or RUTA_NOMINA
    with _LOCK:
        try:
            destino.parent.mkdir(parents=True, exist_ok=True)
            if not destino.exists() or destino.stat().st_size == 0:
                destino.write_text(CABECERA_TXT + "\n", encoding="utf-8")
        except OSError as exc:
            raise ArchivoNominaError(
                f"No fue posible crear el archivo de nóminas: {exc}"
            ) from exc
    return destino


def _parsear_linea(linea: str) -> dict[str, Any] | None:
    """Convierte una línea del TXT en un diccionario; devuelve None si es inválida."""

    partes = linea.split(";")
    if len(partes) != 11:
        return None

    nombre = capitalizar_nombre(partes[0].strip())
    tipo = partes[1].strip().upper()
    cargo = partes[2].strip()

    if not nombre or not tipo or not cargo:
        return None

    from app.constantes import TIPOS_EMPLEADO
    if tipo not in TIPOS_EMPLEADO:
        return None

    try:
        horas_trabajadas = int(partes[3])
        salario = int(partes[4])
        horas_extras = int(partes[5])
        total_pago_horas_extras = int(partes[6])
        salud = int(partes[7])
        pension = int(partes[8])
        arl = int(partes[9])
        total_pagar = int(partes[10])
    except ValueError:
        return None

    return {
        "nombre": nombre,
        "tipo": tipo,
        "cargo": cargo,
        "horas_trabajadas": horas_trabajadas,
        "salario": salario,
        "horas_extras": horas_extras,
        "total_pago_horas_extras": total_pago_horas_extras,
        "salud": salud,
        "pension": pension,
        "arl": arl,
        "total_pagar": total_pagar,
    }


def leer_registros(ruta: Path | None = None) -> list[dict[str, Any]]:
    """Lee todos los registros válidos del archivo de nóminas."""

    destino = asegurar_archivo(ruta)
    with _LOCK:
        try:
            contenido = destino.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            raise ArchivoNominaError(
                f"No fue posible leer el archivo de nóminas: {exc}"
            ) from exc

    registros: list[dict[str, Any]] = []
    for numero_linea, linea in enumerate(contenido.splitlines(), start=1):
        linea_limpia = linea.strip()
        if not linea_limpia:
            continue
        if linea_limpia == CABECERA_TXT:
            continue

        registro = _parsear_linea(linea_limpia)
        if registro is None:
            logger.warning(
                "Se omitió una línea inválida en %s (línea %s).",
                destino,
                numero_linea,
            )
            continue
        registros.append(registro)
    return registros


def _validar_texto(valor: Any, nombre_campo: str) -> str:
    texto = str(valor).strip()
    if not texto:
        raise ValueError(f"El campo {nombre_campo} es obligatorio.")
    if any(caracter in texto for caracter in (";", "\r", "\n")):
        raise ValueError(
            f"El campo {nombre_campo} no puede contener punto y coma ni saltos de línea."
        )
    return texto


def _validar_entero(valor: Any, nombre_campo: str) -> int:
    try:
        numero = int(valor)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"El campo {nombre_campo} debe ser un número entero.") from exc
    if numero < 0:
        raise ValueError(f"El campo {nombre_campo} no puede ser negativo.")
    return numero


def formatear_linea(registro: Mapping[str, Any]) -> str:
    """Construye una línea del TXT con el orden obligatorio de columnas."""

    nombre = capitalizar_nombre(_validar_texto(registro.get("nombre"), "nombre"))
    tipo = _validar_texto(registro.get("tipo"), "tipo")
    cargo = _validar_texto(registro.get("cargo"), "cargo")

    valores = [
        nombre,
        tipo,
        cargo,
        str(_validar_entero(registro.get("horas_trabajadas"), "horas trabajadas")),
        str(_validar_entero(registro.get("salario"), "salario")),
        str(_validar_entero(registro.get("horas_extras"), "horas extras")),
        str(
            _validar_entero(
                registro.get("total_pago_horas_extras"), "total pago horas extras"
            )
        ),
        str(_validar_entero(registro.get("salud"), "salud")),
        str(_validar_entero(registro.get("pension"), "pensión")),
        str(_validar_entero(registro.get("arl"), "ARL")),
        str(_validar_entero(registro.get("total_pagar"), "total a pagar")),
    ]
    return ";".join(valores)


def agregar_registro(registro: Mapping[str, Any], ruta: Path | None = None) -> int:
    """Agrega una nómina confirmada al final del archivo y devuelve su ID.

    La lectura del consecutivo y la escritura se realizan bajo el mismo bloqueo
    para evitar que dos confirmaciones simultáneas obtengan el mismo ID.
    """

    destino = asegurar_archivo(ruta)
    linea = formatear_linea(registro)
    with _LOCK:
        try:
            contenido = destino.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            raise ArchivoNominaError(
                f"No fue posible leer el archivo de nóminas: {exc}"
            ) from exc

        identificador = len(leer_registros(destino)) + 1
        prefijo = "" if (not contenido or contenido.endswith("\n")) else "\n"
        try:
            with destino.open("a", encoding="utf-8", newline="\n") as archivo:
                archivo.write(prefijo + linea + "\n")
        except OSError as exc:
            raise ArchivoNominaError(
                f"No fue posible guardar la nómina en el archivo: {exc}"
            ) from exc
    return identificador


def _formatear_moneda(valor: int | float) -> str:
    """Devuelve un valor monetario con separadores de miles y símbolo."""

    return f"${int(valor):,.0f}".replace(",", ".")


def _formatear_registro_exportacion(registro: Mapping[str, Any], indice: int) -> str:
    """Genera una vista estructurada de un volante de pago individual para el reporte."""

    nombre = capitalizar_nombre(str(registro.get("nombre", "")).strip()) or "Empleado sin nombre"
    tipo = str(registro.get("tipo", "")).strip() or "Sin tipo"
    cargo = str(registro.get("cargo", "")).strip() or "Sin cargo"
    horas_trabajadas = int(registro.get("horas_trabajadas", 0) or 0)
    horas_extras = int(registro.get("horas_extras", 0) or 0)
    salario = int(registro.get("salario", 0) or 0)
    total_pago_horas_extras = int(registro.get("total_pago_horas_extras", 0) or 0)
    salud = int(registro.get("salud", 0) or 0)
    pension = int(registro.get("pension", 0) or 0)
    arl = int(registro.get("arl", 0) or 0)
    total_pagar = int(registro.get("total_pagar", 0) or 0)
    total_devengado = salario + total_pago_horas_extras
    total_deducciones = salud + pension + arl

    tipo_norm = tipo.upper()
    es_operativo = (tipo_norm == "OPERATIVO")
    lbl_salud = "Aporte Salud (12.5%):" if es_operativo else "Aporte Salud (4%):"
    lbl_pension = "Aporte Pensión (16%):" if es_operativo else "Aporte Pensión (4%):"

    sep = "-" * 88
    lineas = [
        f"[ COMPROBANTE DE PAGO N.° {indice:03d} ]",
        sep,
        f"  Empleado:           {nombre}",
        f"  Tipo de trabajador: {tipo}",
        f"  Cargo desempeñado:  {cargo}",
        f"  Horas reportadas:   {horas_trabajadas} h ordinarias | {horas_extras} h extras",
        "",
        f"  {'CONCEPTOS DEVENGADOS':<40} {'DEDUCCIONES LEGALES':<40}",
        f"  {'-' * 38}  {'-' * 38}",
        f"  {'Salario base:':<22} {_formatear_moneda(salario):>14}  {lbl_salud:<22} {_formatear_moneda(salud):>14}",
        f"  {'Pago horas extras:':<22} {_formatear_moneda(total_pago_horas_extras):>14}  {lbl_pension:<22} {_formatear_moneda(pension):>14}",
        f"  {'':<22} {'':>14}  {'Aporte ARL:':<22} {_formatear_moneda(arl):>14}",
        f"  {'-' * 38}  {'-' * 38}",
        f"  {'Total Devengado:':<22} {_formatear_moneda(total_devengado):>14}  {'Total Deducciones:':<22} {_formatear_moneda(total_deducciones):>14}",
        "",
        f"  >>> TOTAL A PAGAR: {_formatear_moneda(total_pagar)}",
        sep,
        "",
    ]
    return "\n".join(lineas)


def texto_exportacion(ruta: Path | None = None) -> str:
    """Devuelve un reporte visual estructurado y tabulado de nóminas para descargar en TXT."""

    destino = asegurar_archivo(ruta)
    registros = leer_registros(destino)

    ancho = 110
    sep_doble = "=" * ancho
    sep_simple = "-" * ancho

    if not registros:
        return (
            sep_doble
            + "\n"
            + "                         TRANSCARIBE COL (TRANSCARIBECOL S.C.A.)\n"
            + "                                   NIT: 900.542.891-3\n"
            + "                                   REPORTE DE NÓMINA\n"
            + sep_doble
            + "\n\n"
            + "No hay registros de nómina para mostrar.\n"
        )

    # Cálculo de totales acumulados
    tot_ht = sum(int(r.get("horas_trabajadas", 0) or 0) for r in registros)
    tot_salario = sum(int(r.get("salario", 0) or 0) for r in registros)
    tot_he = sum(int(r.get("horas_extras", 0) or 0) for r in registros)
    tot_pago_he = sum(int(r.get("total_pago_horas_extras", 0) or 0) for r in registros)
    tot_salud = sum(int(r.get("salud", 0) or 0) for r in registros)
    tot_pension = sum(int(r.get("pension", 0) or 0) for r in registros)
    tot_arl = sum(int(r.get("arl", 0) or 0) for r in registros)
    tot_pagar = sum(int(r.get("total_pagar", 0) or 0) for r in registros)

    reporte: list[str] = [
        sep_doble,
        "                         TRANSCARIBE COL (TRANSCARIBECOL S.C.A.)",
        "                                   NIT: 900.542.891-3",
        "                         SISTEMA DE GESTIÓN Y CONTROL DE NÓMINA",
        "                                   REPORTE DE NÓMINA",
        sep_doble,
        f" Período: Nómina Mensual Ordinaria                        Total trabajadores registrados: {len(registros)}",
        f" Moneda:  Pesos Colombianos (COP)",
        sep_doble,
        "",
        sep_simple,
        "                                 PLANILLA GENERAL CONSOLIDADA",
        sep_simple,
        f"{'#':<3} {'EMPLEADO':<25} {'TIPO':<15} {'CARGO':<20} {'HT':>4} {'SALARIO':>12} {'HE':>4} {'PAGO HE':>11} {'SALUD':>9} {'PENSIÓN':>9} {'ARL':>8} {'TOTAL A PAGAR':>14}",
        sep_simple,
    ]

    for idx, reg in enumerate(registros, start=1):
        nombre = str(reg.get("nombre", "")).strip()[:25]
        tipo = str(reg.get("tipo", "")).strip()[:15]
        cargo = str(reg.get("cargo", "")).strip()[:20]
        ht = int(reg.get("horas_trabajadas", 0) or 0)
        salario = int(reg.get("salario", 0) or 0)
        he = int(reg.get("horas_extras", 0) or 0)
        pago_he = int(reg.get("total_pago_horas_extras", 0) or 0)
        salud = int(reg.get("salud", 0) or 0)
        pension = int(reg.get("pension", 0) or 0)
        arl = int(reg.get("arl", 0) or 0)
        pagar = int(reg.get("total_pagar", 0) or 0)

        reporte.append(
            f"{idx:02d}  {nombre:<25} {tipo:<15} {cargo:<20} {ht:>4} {_formatear_moneda(salario):>12} {he:>4} {_formatear_moneda(pago_he):>11} {_formatear_moneda(salud):>9} {_formatear_moneda(pension):>9} {_formatear_moneda(arl):>8} {_formatear_moneda(pagar):>14}"
        )

    reporte.extend([
        sep_simple,
        f"{'TOTALES CONSOLIDADOS (' + str(len(registros)) + ' TRABAJADORES)':<66} {tot_ht:>4} {_formatear_moneda(tot_salario):>12} {tot_he:>4} {_formatear_moneda(tot_pago_he):>11} {_formatear_moneda(tot_salud):>9} {_formatear_moneda(tot_pension):>9} {_formatear_moneda(tot_arl):>8} {_formatear_moneda(tot_pagar):>14}",
        sep_doble,
        "",
        sep_simple,
        "                               RESUMEN DE APORTES Y DESEMBOLSOS",
        sep_simple,
        f"  (+) Total Salarios Ordinarios:                                     {_formatear_moneda(tot_salario):>18}",
        f"  (+) Total Pago por Horas Extras:                                   {_formatear_moneda(tot_pago_he):>18}",
        "  " + "-" * 88,
        f"  (=) TOTAL DEVENGADO EN EL PERÍODO:                                 {_formatear_moneda(tot_salario + tot_pago_he):>18}",
        "",
        f"  (-) Total Descuentos Salud:                                        {_formatear_moneda(tot_salud):>18}",
        f"  (-) Total Descuentos Pensión:                                      {_formatear_moneda(tot_pension):>18}",
        f"  (-) Total Descuentos ARL:                                          {_formatear_moneda(tot_arl):>18}",
        "  " + "-" * 88,
        f"  (=) TOTAL DEDUCCIONES LEGALES:                                     {_formatear_moneda(tot_salud + tot_pension + tot_arl):>18}",
        "",
        "  " + "=" * 88,
        f"  (==) TOTAL A PAGAR (NETO GENERAL):                                 {_formatear_moneda(tot_pagar):>18}",
        "  " + "=" * 88,
        "",
        sep_doble,
        "                             DETALLE INDIVIDUAL DE COMPROBANTES DE PAGO",
        sep_doble,
        "",
    ])

    reporte.extend(
        _formatear_registro_exportacion(registro, indice)
        for indice, registro in enumerate(registros, start=1)
    )

    reporte.extend([
        sep_doble,
        "            Documento oficial generado por el Sistema de Nómina TransCaribeCol · Todos los derechos reservados.",
        "                                             NIT: 900.542.891-3",
        sep_doble,
        "",
    ])

    return "\n".join(reporte).rstrip() + "\n"


def ruta_publica() -> str:
    """Ruta lógica del archivo, usada solo con fines informativos."""

    return "backend/app/data/nomina.txt"
