"""Pruebas del servicio de persistencia en archivo plano."""

from pathlib import Path

import pytest

from app.constantes import CABECERA_TXT
from app.services import archivo_txt

REGISTRO = {
    "nombre": "Ana María Jaimes González",
    "tipo": "ADMINISTRATIVO",
    "cargo": "Auxiliar Administrativo",
    "horas_trabajadas": 40,
    "salario": 800000,
    "horas_extras": 20,
    "total_pago_horas_extras": 500000,
    "salud": 52000,
    "pension": 52000,
    "arl": 6786,
    "total_pagar": 1189214,
}

LINEA_ESPERADA = (
    "Ana María Jaimes González;ADMINISTRATIVO;Auxiliar Administrativo;40;"
    "800000;20;500000;52000;52000;6786;1189214"
)


def test_crea_directorio_y_cabecera_una_sola_vez(tmp_path: Path):
    ruta = tmp_path / "nueva" / "carpeta" / "nomina.txt"

    archivo_txt.asegurar_archivo(ruta)
    archivo_txt.asegurar_archivo(ruta)

    contenido = ruta.read_text(encoding="utf-8")
    assert contenido == CABECERA_TXT + "\n"
    assert contenido.count(CABECERA_TXT) == 1


def test_agrega_registros_sin_sobrescribir_y_lee_tipos(tmp_path: Path):
    ruta = tmp_path / "nomina.txt"

    id_1 = archivo_txt.agregar_registro(REGISTRO, ruta)
    segundo = {**REGISTRO, "nombre": "Blanca Luz Iglesias Serpa", "horas_extras": 0}
    id_2 = archivo_txt.agregar_registro(segundo, ruta)

    assert (id_1, id_2) == (1, 2)
    lineas = ruta.read_text(encoding="utf-8").splitlines()
    assert lineas[0] == CABECERA_TXT
    assert lineas[1] == LINEA_ESPERADA
    assert len(lineas) == 3

    registros = archivo_txt.leer_registros(ruta)
    assert len(registros) == 2
    assert registros[0]["nombre"] == "Ana María Jaimes González"
    assert registros[0]["salario"] == 800000
    assert isinstance(registros[0]["salario"], int)
    assert registros[1]["horas_extras"] == 0


def test_formato_exacto_de_linea(tmp_path: Path):
    ruta = tmp_path / "nomina.txt"
    archivo_txt.agregar_registro(REGISTRO, ruta)
    lineas = ruta.read_text(encoding="utf-8").splitlines()
    assert lineas[1] == LINEA_ESPERADA


def test_rechaza_punto_y_coma_en_campos():
    registro = {**REGISTRO, "nombre": "Nombre;Invalido"}
    with pytest.raises(ValueError, match="punto y coma"):
        archivo_txt.formatear_linea(registro)


def test_omite_lineas_invalidas_sin_perder_registros(tmp_path: Path):
    ruta = tmp_path / "nomina.txt"
    archivo_txt.asegurar_archivo(ruta)
    with ruta.open("a", encoding="utf-8") as archivo:
        archivo.write("linea corrupta\n")
        archivo.write("Nombre;TIPO;CARGO;no-es-numero;1;2;3;4;5;6;7\n")
    archivo_txt.agregar_registro(REGISTRO, ruta)

    registros = archivo_txt.leer_registros(ruta)
    assert len(registros) == 1
    assert registros[0]["nombre"] == REGISTRO["nombre"]


def test_texto_exportacion_conserva_cabecera(tmp_path: Path):
    ruta = tmp_path / "nomina.txt"
    archivo_txt.agregar_registro(REGISTRO, ruta)

    contenido = archivo_txt.texto_exportacion(ruta)
    assert "TRANSCARIBE COL" in contenido.upper()
    assert "ANA MARÍA JAIMES GONZÁLEZ" in contenido.upper()
    assert "TOTAL A PAGAR" in contenido.upper()
    assert "$1.189.214" in contenido.replace(" ", "") or "1189214" in contenido
    assert "ADMINISTRATIVO" in contenido.upper()
    assert "AUXILIAR ADMINISTRATIVO" in contenido.upper()


def test_agregar_registro_seguro_sin_salto_de_linea_previo(tmp_path: Path):
    ruta = tmp_path / "nomina.txt"
    archivo_txt.asegurar_archivo(ruta)
    with ruta.open("a", encoding="utf-8") as archivo:
        archivo.write("linea corrupta")
    archivo_txt.agregar_registro(REGISTRO, ruta)
    registros = archivo_txt.leer_registros(ruta)
    assert len(registros) == 1
    assert registros[0]["nombre"] == REGISTRO["nombre"]

