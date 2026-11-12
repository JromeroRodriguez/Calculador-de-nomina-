"""Endpoints de cálculo, confirmación, historial y exportación de nómina."""

from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Response, status

from app.models.schemas import (
    CalculoNomina,
    ConfirmacionNomina,
    EstadisticasNomina,
    HistorialNomina,
    NominaRegistro,
    NominaSolicitud,
)
from app.services import archivo_txt
from app.services.calculadora_nomina import calcular_nomina
from app.services.consultas_nomina import (
    calcular_estadisticas,
    construir_historial,
    obtener_registro,
)

router = APIRouter(prefix="/api/nomina", tags=["Nómina"])


@router.post(
    "/calcular",
    response_model=CalculoNomina,
    summary="Calcular una nómina sin guardarla",
)
def calcular(solicitud: NominaSolicitud) -> CalculoNomina:
    try:
        resultado = calcular_nomina(solicitud)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    return CalculoNomina(**asdict(resultado))


@router.post(
    "/confirmar",
    response_model=ConfirmacionNomina,
    status_code=status.HTTP_201_CREATED,
    summary="Confirmar y guardar una nómina en el archivo TXT",
)
def confirmar(solicitud: NominaSolicitud) -> ConfirmacionNomina:
    try:
        resultado = calcular_nomina(solicitud)
        identificador = archivo_txt.agregar_registro(asdict(resultado))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    registro = NominaRegistro(id=identificador, **asdict(resultado))
    return ConfirmacionNomina(
        mensaje="Nómina confirmada y guardada correctamente en el historial.",
        registro=registro,
    )


@router.get(
    "",
    response_model=HistorialNomina,
    summary="Consultar el historial completo de nóminas",
)
def historial() -> HistorialNomina:
    return construir_historial()


@router.get(
    "/estadisticas",
    response_model=EstadisticasNomina,
    summary="Obtener estadísticas calculadas desde el archivo TXT",
)
def estadisticas() -> EstadisticasNomina:
    return calcular_estadisticas()


@router.get(
    "/exportar",
    summary="Descargar el archivo de nóminas formateado o en plano",
    response_class=Response,
)
def exportar(formato: str = "reporte") -> Response:
    if formato in ("plano", "csv", "raw"):
        ruta_archivo = archivo_txt.asegurar_archivo()
        contenido = ruta_archivo.read_text(encoding="utf-8")
        nombre_archivo = "nomina_plana.txt"
    else:
        contenido = archivo_txt.texto_exportacion()
        nombre_archivo = "nomina_transcaribecol.txt"

    return Response(
        content=contenido,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{nombre_archivo}"',
            "Cache-Control": "no-store",
        },
    )


@router.get(
    "/{registro_id}",
    response_model=NominaRegistro,
    summary="Consultar un volante de pago por su identificador",
)
def detalle(registro_id: int) -> NominaRegistro:
    registro = obtener_registro(registro_id)
    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el volante de pago solicitado.",
        )
    return registro
