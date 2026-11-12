"""Configuración común de pruebas: aísla el archivo TXT en un directorio temporal."""

from pathlib import Path

import pytest

from app.services import archivo_txt


@pytest.fixture(autouse=True)
def ruta_nomina_temporal(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    ruta = tmp_path / "data" / "nomina.txt"
    monkeypatch.setattr(archivo_txt, "RUTA_NOMINA", ruta)
    return ruta
