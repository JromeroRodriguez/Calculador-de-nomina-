import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock,
  DollarSign,
  HardHat,
  Info,
  Loader2,
  ReceiptText,
  RotateCcw,
  Shield,
  UserPlus,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import { useToast } from "../components/ToastProvider";
import { useApiQuery } from "../hooks/useApiQuery";
import { confirmarNomina, obtenerConfiguracion } from "../services/api";
import { formatearPorcentaje, formatearPesos, capitalizarNombre } from "../utils/format";

const FORMULARIO_INICIAL = {
  nombre: "",
  tipo: "",
  cargo: "",
  horas_trabajadas: "",
  horas_extras: "0",
};

const HORAS_COMUNES = [40, 48, 56];
const EXTRAS_COMUNES = [0, 5, 10];

function CampoError({ children }) {
  if (!children) return null;
  return (
    <p className="field-error" role="alert">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      {children}
    </p>
  );
}

function EncabezadoSeccion({ paso, titulo, descripcion, icono: Icono, tono = "brand" }) {
  const tonos = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return (
    <div className="card-header">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${tonos[tono]}`}
        >
          <Icono className="h-4 w-4" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-ink-400">
              {paso}
            </span>
            <h2 className="card-title">{titulo}</h2>
          </div>
          <p className="card-subtitle">{descripcion}</p>
        </div>
      </div>
    </div>
  );
}

export default function RegistrarEmpleado() {
  const configuracion = useApiQuery(obtenerConfiguracion);
  const { notificar } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState("");

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;

    setFormulario({
      nombre: prefill.nombre || "",
      tipo: prefill.tipo || "",
      cargo: prefill.cargo || "",
      horas_trabajadas:
        prefill.tipo === "ADMINISTRATIVO"
          ? String(prefill.horas_trabajadas ?? "")
          : "",
      horas_extras: "0",
    });
    setErrores({});
    setErrorServidor("");
  }, [location.key]);

  const config = configuracion.data;
  const cargosOperativos = config?.operativo?.cargos || [];
  const cargoOperativo = cargosOperativos.find(
    (cargo) => cargo.nombre === formulario.cargo,
  );

  function actualizarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      });
    }
    setErrorServidor("");
  }

  function cambiarTipo(tipo) {
    setFormulario((actual) => ({
      ...actual,
      tipo,
      cargo: "",
      horas_trabajadas: "",
      horas_extras: tipo === "ADMINISTRATIVO" ? "0" : "",
    }));
    setErrores({});
    setErrorServidor("");
  }

  function validarFormulario() {
    const nuevosErrores = {};
    const nombre = formulario.nombre.trim();

    if (!nombre) {
      nuevosErrores.nombre = "El nombre completo es obligatorio.";
    } else if (nombre.length > 120) {
      nuevosErrores.nombre = "El nombre no puede superar los 120 caracteres.";
    }
    if (nombre.includes(";")) {
      nuevosErrores.nombre = "El nombre no puede contener punto y coma (;).";
    }

    if (!formulario.tipo) {
      nuevosErrores.tipo = "Seleccione el tipo de empleado (Administrativo u Operativo).";
      return nuevosErrores;
    }

    if (formulario.tipo === "ADMINISTRATIVO") {
      const cargo = formulario.cargo.trim();
      if (!cargo) {
        nuevosErrores.cargo = "El cargo administrativo es obligatorio.";
      } else if (cargo.includes(";")) {
        nuevosErrores.cargo = "El cargo no puede contener punto y coma (;).";
      }

      const horas = Number(formulario.horas_trabajadas);
      if (
        String(formulario.horas_trabajadas).trim() === "" ||
        !Number.isInteger(horas) ||
        horas < 0
      ) {
        nuevosErrores.horas_trabajadas =
          "Ingrese las horas ordinarias como un entero mayor o igual a 0.";
      }

      const textoExtras = String(formulario.horas_extras).trim();
      const extras = textoExtras === "" ? 0 : Number(textoExtras);
      if (!Number.isInteger(extras) || extras < 0) {
        nuevosErrores.horas_extras =
          "Ingrese las horas extras como un entero mayor o igual a 0.";
      }
    } else {
      if (!cargoOperativo) {
        nuevosErrores.cargo =
          "Seleccione uno de los cargos operativos disponibles.";
      }
    }

    return nuevosErrores;
  }

  function construirPayload() {
    const base = {
      nombre: capitalizarNombre(formulario.nombre),
      tipo: formulario.tipo,
      cargo:
        formulario.tipo === "OPERATIVO"
          ? formulario.cargo
          : formulario.cargo.trim(),
    };

    if (formulario.tipo === "ADMINISTRATIVO") {
      return {
        ...base,
        horas_trabajadas: Number(formulario.horas_trabajadas),
        horas_extras:
          String(formulario.horas_extras).trim() === ""
            ? 0
            : Number(formulario.horas_extras),
      };
    }
    return base;
  }

  async function manejarGuardar(evento) {
    evento.preventDefault();
    const nuevosErrores = validarFormulario();
    setErrores(nuevosErrores);
    setErrorServidor("");

    if (Object.keys(nuevosErrores).length > 0) {
      const primerError = Object.keys(nuevosErrores)[0];
      const el = document.getElementById(primerError);
      if (el) el.focus();
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await confirmarNomina(construirPayload());
      notificar(
        respuesta.mensaje || "Empleado registrado y volante generado correctamente.",
        "exito",
      );
      if (respuesta.registro?.id) {
        navigate(`/volantes/${respuesta.registro.id}`);
      } else {
        limpiarFormulario();
      }
    } catch (error) {
      setErrorServidor(error.message);
      notificar(error.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  function limpiarFormulario() {
    setFormulario({ ...FORMULARIO_INICIAL });
    setErrores({});
    setErrorServidor("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (configuracion.error && !config) {
    return (
      <>
        <PageHeader
          titulo="Registrar empleado"
          descripcion="Registre los datos del trabajador y genere su volante de pago."
          icono={UserPlus}
        />
        <ErrorState
          mensaje={configuracion.error.message}
          onReintentar={configuracion.recargar}
        />
      </>
    );
  }

  if (!config) {
    return (
      <>
        <PageHeader
          titulo="Registrar empleado"
          descripcion="Registre los datos del trabajador y genere su volante de pago."
          icono={UserPlus}
        />
        <Loading mensaje="Cargando tarifas y catálogos de nómina..." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Registrar empleado"
        descripcion="Complete la información del trabajador. El backend calculará devengados, aportes a seguridad social y el valor neto a pagar."
        icono={UserPlus}
        acciones={
          <Link to="/nomina" className="btn-secondary">
            <ReceiptText className="h-4 w-4" />
            Gestión de nómina
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <form onSubmit={manejarGuardar} noValidate className="space-y-6">
          {/* SECCIÓN 1: DATOS DEL EMPLEADO */}
          <section className="card">
            <EncabezadoSeccion
              paso="01"
              titulo="Datos del empleado"
              descripcion="Información general y tipo de trabajador."
              icono={UserPlus}
            />

            <div className="card-body space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="nombre" className="label">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={(evento) =>
                      actualizarCampo("nombre", evento.target.value)
                    }
                    onBlur={() => {
                      if (formulario.nombre.trim()) {
                        actualizarCampo("nombre", capitalizarNombre(formulario.nombre));
                      }
                    }}
                    className={`input h-11 px-3.5 ${errores.nombre ? "input-error" : ""}`}
                    placeholder="Ej. Ana María Jaimes González"
                    maxLength={120}
                    autoComplete="off"
                  />
                  <CampoError>{errores.nombre}</CampoError>
                </div>

                <div className="md:col-span-2">
                  <p className="label">
                    Tipo de empleado <span className="text-red-500">*</span>
                  </p>
                  <div
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label="Tipo de empleado"
                  >
                    {[
                      {
                        valor: "ADMINISTRATIVO",
                        titulo: "Administrativo",
                        descripcion: "Personal administrativo con horas ordinarias y extras",
                        Icono: BriefcaseBusiness,
                      },
                      {
                        valor: "OPERATIVO",
                        titulo: "Operativo",
                        descripcion: "Trabajador oficial con horas y riesgo fijos según cargo",
                        Icono: HardHat,
                      },
                    ].map(({ valor, titulo, descripcion, Icono }) => {
                      const activo = formulario.tipo === valor;
                      return (
                        <button
                          key={valor}
                          type="button"
                          role="radio"
                          aria-checked={activo}
                          onClick={() => cambiarTipo(valor)}
                          className={`group relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                            activo
                              ? "border-brand-600 bg-brand-50/70 shadow-sm ring-1 ring-brand-200"
                              : "border-ink-200/80 bg-white hover:-translate-y-px hover:border-ink-300 hover:bg-ink-50"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              activo
                                ? "bg-gradient-to-br from-brand-800 to-brand-700 text-brand-100"
                                : "bg-ink-100 text-ink-500"
                            }`}
                          >
                            <Icono className="h-[18px] w-[18px]" />
                          </span>
                          <span className="min-w-0 pr-4">
                            <span
                              className={`block text-sm font-semibold ${
                                activo ? "text-brand-900" : "text-ink-800"
                              }`}
                            >
                              {titulo}
                            </span>
                            <span className="block text-[11px] text-ink-500">
                              {descripcion}
                            </span>
                          </span>
                          <span
                            className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                              activo
                                ? "border-brand-700 bg-brand-700 text-white"
                                : "border-ink-300 bg-white"
                            }`}
                          >
                            {activo && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <CampoError>{errores.tipo}</CampoError>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="cargo" className="label">
                    Cargo <span className="text-red-500">*</span>
                  </label>
                  {formulario.tipo === "OPERATIVO" ? (
                    <select
                      id="cargo"
                      value={formulario.cargo}
                      onChange={(evento) =>
                        actualizarCampo("cargo", evento.target.value)
                      }
                      className={`input h-11 px-3.5 ${errores.cargo ? "input-error" : ""}`}
                    >
                      <option value="">Seleccione un cargo operativo</option>
                      {cargosOperativos.map((cargo) => (
                        <option key={cargo.nombre} value={cargo.nombre}>
                          {cargo.nombre} · {cargo.horas_mensuales} h mensuales
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="cargo"
                      type="text"
                      value={formulario.cargo}
                      onChange={(evento) =>
                        actualizarCampo("cargo", evento.target.value)
                      }
                      className={`input h-11 px-3.5 ${errores.cargo ? "input-error" : ""}`}
                      placeholder={
                        formulario.tipo
                          ? "Ej. Auxiliar Administrativo"
                          : "Seleccione primero el tipo de empleado"
                      }
                      maxLength={100}
                      disabled={!formulario.tipo}
                      autoComplete="off"
                    />
                  )}
                  <CampoError>{errores.cargo}</CampoError>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: CONDICIONES ADMINISTRATIVAS */}
          {formulario.tipo === "ADMINISTRATIVO" && (
            <section className="card animate-rise">
              <EncabezadoSeccion
                paso="02"
                titulo="Condiciones administrativas"
                descripcion="Tarifas fijas y reporte de horas para el período."
                icono={BriefcaseBusiness}
                tono="sky"
              />

              <div className="card-body space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="info-tile">
                    <div className="flex items-center gap-1.5 text-ink-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em]">
                        Valor hora ordinaria
                      </p>
                    </div>
                    <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800">
                      {formatearPesos(config.administrativo.valor_hora_ordinaria)}
                    </p>
                  </div>
                  <div className="info-tile">
                    <div className="flex items-center gap-1.5 text-ink-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em]">
                        Valor hora extra
                      </p>
                    </div>
                    <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800">
                      {formatearPesos(config.administrativo.valor_hora_extra)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-ink-200/70 bg-ink-50/70 px-3.5 py-2.5 text-[11px] text-ink-600">
                  <span className="flex items-center gap-1.5 font-medium text-ink-700">
                    <Shield className="h-3.5 w-3.5 text-ink-400" />
                    Riesgo ARL {config.administrativo.nivel_riesgo}
                  </span>
                  <span>
                    ARL {formatearPorcentaje(config.administrativo.porcentaje_arl)}
                  </span>
                  <span>
                    Salud {formatearPorcentaje(config.administrativo.porcentaje_salud)}
                  </span>
                  <span>
                    Pensión {formatearPorcentaje(config.administrativo.porcentaje_pension)}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="horas_trabajadas" className="label">
                      Horas ordinarias <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="horas_trabajadas"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={formulario.horas_trabajadas}
                      onChange={(evento) =>
                        actualizarCampo("horas_trabajadas", evento.target.value)
                      }
                      className={`input ${
                        errores.horas_trabajadas ? "input-error" : ""
                      }`}
                      placeholder="Ej. 40"
                    />
                    <CampoError>{errores.horas_trabajadas}</CampoError>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {HORAS_COMUNES.map((hora) => (
                        <button
                          key={hora}
                          type="button"
                          onClick={() =>
                            actualizarCampo("horas_trabajadas", String(hora))
                          }
                          className={`chip !min-h-[30px] px-2.5 text-[11px] ${
                            String(formulario.horas_trabajadas) === String(hora)
                              ? "chip-active"
                              : ""
                          }`}
                        >
                          {hora} h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="horas_extras" className="label">
                      Horas extras
                    </label>
                    <input
                      id="horas_extras"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={formulario.horas_extras}
                      onChange={(evento) =>
                        actualizarCampo("horas_extras", evento.target.value)
                      }
                      className={`input ${
                        errores.horas_extras ? "input-error" : ""
                      }`}
                      placeholder="0"
                    />
                    <CampoError>{errores.horas_extras}</CampoError>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {EXTRAS_COMUNES.map((extra) => (
                        <button
                          key={extra}
                          type="button"
                          onClick={() =>
                            actualizarCampo("horas_extras", String(extra))
                          }
                          className={`chip !min-h-[30px] px-2.5 text-[11px] ${
                            String(formulario.horas_extras) === String(extra)
                              ? "chip-active"
                              : ""
                          }`}
                        >
                          {extra} h
                        </button>
                      ))}
                    </div>
                    <p className="help-text">
                      Las horas extras hacen parte de la base de liquidación y descuentos.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECCIÓN 2: CONDICIONES OPERATIVAS */}
          {formulario.tipo === "OPERATIVO" && (
            <section className="card animate-rise">
              <EncabezadoSeccion
                paso="02"
                titulo="Condiciones del cargo operativo"
                descripcion="Horas mensuales y nivel de riesgo ARL asignados automáticamente."
                icono={HardHat}
                tono="amber"
              />

              <div className="card-body space-y-4">
                {cargoOperativo ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="info-tile">
                      <div className="flex items-center gap-1.5 text-ink-400">
                        <Clock className="h-3.5 w-3.5" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em]">
                          Horas mensuales
                        </p>
                      </div>
                      <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800">
                        {cargoOperativo.horas_mensuales} h
                      </p>
                    </div>
                    <div className="info-tile">
                      <div className="flex items-center gap-1.5 text-ink-400">
                        <DollarSign className="h-3.5 w-3.5" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em]">
                          Valor de hora
                        </p>
                      </div>
                      <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800">
                        {formatearPesos(config.operativo.valor_hora)}
                      </p>
                    </div>
                    <div className="info-tile">
                      <div className="flex items-center gap-1.5 text-ink-400">
                        <Shield className="h-3.5 w-3.5" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em]">
                          Nivel de riesgo ARL
                        </p>
                      </div>
                      <p className="mt-1 font-display text-base font-semibold text-ink-800">
                        {cargoOperativo.nivel_riesgo}
                      </p>
                    </div>
                    <div className="info-tile">
                      <div className="flex items-center gap-1.5 text-ink-400">
                        <Shield className="h-3.5 w-3.5" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em]">
                          Porcentaje ARL
                        </p>
                      </div>
                      <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800">
                        {formatearPorcentaje(cargoOperativo.porcentaje_arl)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-ink-300 bg-ink-50 p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                    <p className="text-xs leading-5 text-ink-600">
                      Seleccione un cargo en el paso anterior para consultar las horas mensuales,
                      el nivel de riesgo y la tarifa ARL aplicable.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2.5 rounded-xl border border-brand-200/70 bg-brand-50/60 px-3.5 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <p className="text-xs leading-5 text-brand-900">
                    Los trabajadores operativos no registran horas extras. Las horas
                    mensuales dependen exclusivamente del cargo y la seguridad social
                    (Salud 4%, Pensión 4% y ARL) se calcula sobre el ingreso base.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* MENSAJE DE ERROR DEL SERVIDOR */}
          {errorServidor && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="min-w-0">
                <p className="font-semibold text-red-900">Error al registrar nómina</p>
                <p className="mt-0.5 leading-5 text-red-700">{errorServidor}</p>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN DEL FORMULARIO */}
          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="btn-secondary"
              disabled={guardando}
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar formulario
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={guardando}
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4" />
              )}
              {guardando ? "Guardando y liquidando..." : "Guardar y generar volante"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
