"""Modelos Pydantic de entrada y salida de la API de nómina."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.constantes import (
    CARGOS_OPERATIVOS,
    TIPO_ADMINISTRATIVO,
    TIPO_OPERATIVO,
    TIPOS_EMPLEADO,
    capitalizar_nombre,
)

_CARACTERES_NO_PERMITIDOS = (";", "\r", "\n")


class NominaSolicitud(BaseModel):
    """Datos enviados por el frontend para calcular o confirmar una nómina.

    El porcentaje de riesgo y las horas operativas no forman parte del modelo:
    cualquier intento de enviarlos se rechaza con ``extra="forbid"``. El backend
    es la única fuente de verdad para esos valores.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    nombre: str
    tipo: str
    cargo: str
    horas_trabajadas: int | None = None
    horas_extras: int | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El nombre es obligatorio y no puede contener solo espacios.")
        if len(valor) > 120:
            raise ValueError("El nombre no puede superar los 120 caracteres.")
        if any(caracter in valor for caracter in _CARACTERES_NO_PERMITIDOS):
            raise ValueError("El nombre no puede contener punto y coma ni saltos de línea.")
        return capitalizar_nombre(valor)

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, valor: str) -> str:
        valor = valor.strip().upper()
        if valor not in TIPOS_EMPLEADO:
            raise ValueError("El tipo de empleado debe ser ADMINISTRATIVO u OPERATIVO.")
        return valor

    @field_validator("cargo")
    @classmethod
    def validar_cargo(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El cargo es obligatorio.")
        if len(valor) > 100:
            raise ValueError("El cargo no puede superar los 100 caracteres.")
        if any(caracter in valor for caracter in _CARACTERES_NO_PERMITIDOS):
            raise ValueError("El cargo no puede contener punto y coma ni saltos de línea.")
        return valor

    @model_validator(mode="after")
    def validar_reglas_por_tipo(self) -> "NominaSolicitud":
        if self.tipo == TIPO_ADMINISTRATIVO:
            if self.horas_trabajadas is None:
                raise ValueError(
                    "Las horas ordinarias son obligatorias para un empleado administrativo."
                )
            if self.horas_trabajadas < 0:
                raise ValueError("Las horas ordinarias no pueden ser negativas.")
            if self.horas_extras is not None and self.horas_extras < 0:
                raise ValueError("Las horas extras no pueden ser negativas.")
            return self

        if self.tipo == TIPO_OPERATIVO:
            if self.cargo not in CARGOS_OPERATIVOS:
                cargos = ", ".join(CARGOS_OPERATIVOS)
                raise ValueError(f"El cargo operativo debe ser uno de: {cargos}.")
            if self.horas_trabajadas is not None:
                raise ValueError(
                    "Las horas de los trabajadores operativos se asignan automáticamente "
                    "según el cargo y no pueden enviarse manualmente."
                )
            if self.horas_extras not in (None, 0):
                raise ValueError("Los trabajadores operativos no pueden registrar horas extras.")
        return self


class CalculoNomina(BaseModel):
    """Resultado completo de un cálculo de nómina (sin identificador de historial)."""

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


class NominaRegistro(CalculoNomina):
    """Registro de nómina guardado en el archivo TXT."""

    id: int


class ConfirmacionNomina(BaseModel):
    mensaje: str
    registro: NominaRegistro


class HistorialNomina(BaseModel):
    total: int
    registros: list[NominaRegistro]


class EmpleadoResumen(BaseModel):
    """Empleado único derivado del historial de nóminas."""

    id: int
    nombre: str
    tipo: str
    cargo: str
    horas_trabajadas: int
    valor_hora: int
    nivel_riesgo: str
    porcentaje_arl: float
    total_volantes: int
    ultimo_registro: NominaRegistro


class ListaEmpleados(BaseModel):
    total: int
    empleados: list[EmpleadoResumen]


class EstadisticasNomina(BaseModel):
    total_empleados: int
    empleados_administrativos: int
    empleados_operativos: int
    total_volantes: int
    total_nomina_procesada: int
    ultimo_volante: NominaRegistro | None = None


class CargoOperativoConfig(BaseModel):
    nombre: str
    horas_mensuales: int
    nivel_riesgo: str
    porcentaje_arl: float


class ConfiguracionAdministrativo(BaseModel):
    valor_hora_ordinaria: int
    valor_hora_extra: int
    porcentaje_salud: float
    porcentaje_pension: float
    porcentaje_arl: float
    nivel_riesgo: str


class ConfiguracionOperativo(BaseModel):
    valor_hora: int
    porcentaje_ibc: float
    porcentaje_salud: float
    porcentaje_pension: float
    cargos: list[CargoOperativoConfig]


class ConfiguracionNomina(BaseModel):
    moneda: str = "COP"
    administrativo: ConfiguracionAdministrativo
    operativo: ConfiguracionOperativo


class EstadoServidor(BaseModel):
    estado: str
    servicio: str
    version: str


class RespuestaError(BaseModel):
    detail: Annotated[str, Field(description="Mensaje legible para el usuario")]
