"""Pruebas de integración de la API REST con persistencia temporal."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.constantes import CABECERA_TXT
from app.main import app
from app.services import archivo_txt

ADMIN = {
    "nombre": "Ana Maria Jaimes Gonzalez",
    "tipo": "ADMINISTRATIVO",
    "cargo": "Auxiliar Administrativo",
    "horas_trabajadas": 40,
    "horas_extras": 20,
}

OPERATIVO = {
    "nombre": "Blanca Luz Iglesias Serpa",
    "tipo": "OPERATIVO",
    "cargo": "Oficios Generales",
}


def test_health():
    with TestClient(app) as cliente:
        respuesta = cliente.get("/api/health")
    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "ok"


def test_configuracion_expone_catalogos_del_backend():
    with TestClient(app) as cliente:
        respuesta = cliente.get("/api/configuracion")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["administrativo"]["valor_hora_ordinaria"] == 20000
    assert datos["administrativo"]["valor_hora_extra"] == 25000
    assert datos["administrativo"]["porcentaje_arl"] == pytest.approx(0.522)
    cargos = {cargo["nombre"]: cargo for cargo in datos["operativo"]["cargos"]}
    assert cargos["Conductor"]["horas_mensuales"] == 160
    assert cargos["Conductor"]["nivel_riesgo"] == "II"
    assert cargos["Vigilancia"]["porcentaje_arl"] == pytest.approx(4.35)


def test_calcular_administrativo_sin_guardar(ruta_nomina_temporal: Path):
    with TestClient(app) as cliente:
        respuesta = cliente.post("/api/nomina/calcular", json=ADMIN)

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["salario"] == 800000
    assert datos["total_pago_horas_extras"] == 500000
    assert datos["total_devengado"] == 1300000
    assert datos["salud"] == 52000
    assert datos["pension"] == 52000
    assert datos["arl"] == 6786
    assert datos["total_descuentos"] == 110786
    assert datos["total_pagar"] == 1189214
    assert archivo_txt.leer_registros(ruta_nomina_temporal) == []


def test_confirmar_guarda_y_sobrevive_nueva_instancia(ruta_nomina_temporal: Path):
    with TestClient(app) as cliente:
        respuesta = cliente.post("/api/nomina/confirmar", json=ADMIN)
        assert respuesta.status_code == 201
        cuerpo = respuesta.json()
        assert cuerpo["registro"]["id"] == 1
        assert cuerpo["registro"]["total_pagar"] == 1189214

        historial = cliente.get("/api/nomina").json()
        assert historial["total"] == 1
        assert historial["registros"][0]["nombre"] == ADMIN["nombre"]

    contenido = ruta_nomina_temporal.read_text(encoding="utf-8")
    assert contenido.count(CABECERA_TXT) == 1
    assert (
        "Ana Maria Jaimes Gonzalez;ADMINISTRATIVO;Auxiliar Administrativo;40;"
        "800000;20;500000;52000;52000;6786;1189214"
    ) in contenido

    # Una nueva instancia vuelve a leer el mismo archivo persistente.
    with TestClient(app) as cliente_nuevo:
        historial = cliente_nuevo.get("/api/nomina").json()
    assert historial["total"] == 1
    assert historial["registros"][0]["id"] == 1


@pytest.mark.parametrize(
    ("cargo", "horas", "total_pagar", "nivel", "arl"),
    [
        ("Conductor", 160, 5_643_674, "II", 26_726),
        ("Oficios Generales", 100, 3_535_648, "I", 8_352),
        ("Vigilancia", 336, 11_673_984, "IV", 233_856),
    ],
)
def test_confirmar_operativos(
    cargo: str, horas: int, total_pagar: int, nivel: str, arl: int
):
    with TestClient(app) as cliente:
        respuesta = cliente.post(
            "/api/nomina/confirmar",
            json={**OPERATIVO, "cargo": cargo},
        )

    assert respuesta.status_code == 201
    registro = respuesta.json()["registro"]
    assert registro["horas_trabajadas"] == horas
    assert registro["horas_extras"] == 0
    assert registro["total_pago_horas_extras"] == 0
    assert registro["nivel_riesgo"] == nivel
    assert registro["arl"] == arl
    assert registro["total_pagar"] == total_pagar


def test_estadisticas_empleados_y_volantes():
    with TestClient(app) as cliente:
        cliente.post("/api/nomina/confirmar", json=ADMIN)
        cliente.post("/api/nomina/confirmar", json=ADMIN)
        cliente.post("/api/nomina/confirmar", json=OPERATIVO)

        estadisticas = cliente.get("/api/nomina/estadisticas").json()
        empleados = cliente.get("/api/empleados").json()
        detalle = cliente.get("/api/nomina/3")

    assert estadisticas["total_empleados"] == 2
    assert estadisticas["empleados_administrativos"] == 1
    assert estadisticas["empleados_operativos"] == 1
    assert estadisticas["total_volantes"] == 3
    assert estadisticas["total_nomina_procesada"] == 5_914_076
    assert estadisticas["ultimo_volante"]["id"] == 3

    assert empleados["total"] == 2
    ana = next(e for e in empleados["empleados"] if e["nombre"] == ADMIN["nombre"])
    blanca = next(e for e in empleados["empleados"] if e["nombre"] == OPERATIVO["nombre"])
    assert ana["total_volantes"] == 2
    assert ana["ultimo_registro"]["id"] == 2
    assert blanca["total_volantes"] == 1
    assert blanca["ultimo_registro"]["total_pagar"] == 3_535_648

    assert detalle.status_code == 200
    assert detalle.json()["nombre"] == OPERATIVO["nombre"]


def test_historial_vacio_y_estadisticas_en_cero():
    with TestClient(app) as cliente:
        historial = cliente.get("/api/nomina").json()
        estadisticas = cliente.get("/api/nomina/estadisticas").json()
        empleados = cliente.get("/api/empleados").json()

    assert historial == {"total": 0, "registros": []}
    assert estadisticas["total_empleados"] == 0
    assert estadisticas["total_volantes"] == 0
    assert estadisticas["total_nomina_procesada"] == 0
    assert estadisticas["ultimo_volante"] is None
    assert empleados == {"total": 0, "empleados": []}


def test_exportar_txt():
    with TestClient(app) as cliente:
        cliente.post("/api/nomina/confirmar", json=ADMIN)
        respuesta = cliente.get("/api/nomina/exportar")

    assert respuesta.status_code == 200
    assert "TRANSCARIBE COL" in respuesta.text.upper()
    assert "Ana Maria Jaimes Gonzalez" in respuesta.text
    assert "TOTAL A PAGAR" in respuesta.text.upper()
    assert "attachment" in respuesta.headers["content-disposition"]
    assert "nomina_transcaribecol.txt" in respuesta.headers["content-disposition"]


def test_detalle_inexistente_devuelve_404():
    with TestClient(app) as cliente:
        respuesta = cliente.get("/api/nomina/99")
    assert respuesta.status_code == 404
    assert "no se encontró" in respuesta.json()["detail"].lower()


INVALIDOS = [
    ({**ADMIN, "nombre": ""}, "nombre"),
    ({**ADMIN, "nombre": "   "}, "nombre"),
    ({**ADMIN, "nombre": "Nombre;Invalido"}, "nombre"),
    ({**ADMIN, "nombre": "Nombre\nInvalido"}, "nombre"),
    ({**ADMIN, "tipo": ""}, "tipo"),
    ({**ADMIN, "tipo": "OTRO"}, "tipo"),
    ({**ADMIN, "cargo": "   "}, "cargo"),
    ({**ADMIN, "horas_trabajadas": None}, "horas"),
    ({**ADMIN, "horas_trabajadas": -1}, "negativas"),
    ({**ADMIN, "horas_extras": -1}, "negativas"),
    ({**ADMIN, "horas_trabajadas": "abc"}, "número"),
    ({**OPERATIVO, "cargo": "Gerente"}, "cargo operativo"),
    ({**OPERATIVO, "horas_trabajadas": 100}, "automáticamente"),
    ({**OPERATIVO, "horas_extras": 5}, "horas extras"),
    ({**OPERATIVO, "porcentaje_riesgo": 0.1}, "no está permitido"),
    ({**OPERATIVO, "total_pagar": 1}, "no está permitido"),
    ({**ADMIN, "salud": 1}, "no está permitido"),
]


@pytest.mark.parametrize(("payload", "fragmento"), INVALIDOS)
def test_validaciones_responden_422_con_mensaje_claro(
    payload: dict, fragmento: str, ruta_nomina_temporal: Path
):
    with TestClient(app) as cliente:
        calculo = cliente.post("/api/nomina/calcular", json=payload)
        confirmacion = cliente.post("/api/nomina/confirmar", json=payload)

    assert calculo.status_code == 422
    assert confirmacion.status_code == 422
    assert fragmento.lower() in calculo.json()["detail"].lower()
    assert fragmento.lower() in confirmacion.json()["detail"].lower()
    assert archivo_txt.leer_registros(ruta_nomina_temporal) == []


def test_operativo_puede_enviar_horas_extras_en_cero():
    with TestClient(app) as cliente:
        respuesta = cliente.post(
            "/api/nomina/calcular", json={**OPERATIVO, "horas_extras": 0}
        )
    assert respuesta.status_code == 200
    assert respuesta.json()["horas_extras"] == 0
