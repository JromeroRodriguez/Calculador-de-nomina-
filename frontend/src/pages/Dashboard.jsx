import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Calculator,
  HardHat,
  Plus,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import BadgeTipo from "../components/BadgeTipo";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { useApiQuery } from "../hooks/useApiQuery";
import { obtenerEstadisticas, obtenerHistorial } from "../services/api";
import { formatearNumero, formatearPesos, iniciales } from "../utils/format";

export default function Dashboard() {
  const estadisticas = useApiQuery(obtenerEstadisticas);
  const historial = useApiQuery(obtenerHistorial);

  const error = estadisticas.error || historial.error;

  const reintentar = () => {
    estadisticas.recargar();
    historial.recargar();
  };

  const datos = estadisticas.data;
  const registros = historial.data?.registros || [];
  const recientes = [...registros].slice(-5).reverse();

  const totalEmpleados = datos?.total_empleados || 0;
  const administrativos = datos?.empleados_administrativos || 0;
  const operativos = datos?.empleados_operativos || 0;
  const porcentajeAdmin = totalEmpleados
    ? Math.round((administrativos / totalEmpleados) * 100)
    : 0;
  const porcentajeOperativo = totalEmpleados ? 100 - porcentajeAdmin : 0;

  const graficoPlanta = totalEmpleados
    ? `conic-gradient(#0ea5e9 0% ${porcentajeAdmin}%, #3f960f ${porcentajeAdmin}% 100%)`
    : "conic-gradient(#dce2d7 0% 100%)";

  return (
    <>
      <PageHeader
        titulo="Panel principal"
        descripcion="Resumen general de la nómina de TransCaribeCol, calculado a partir de los registros guardados en el archivo TXT."
        icono={Calculator}
      />

      {error && !datos ? (
        <ErrorState mensaje={error.message} onReintentar={reintentar} />
      ) : (
        <>
          {/* Hero */}
          <section className="animate-rise relative overflow-hidden rounded-3xl bg-forest-900 text-white shadow-lift">
            <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-40" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl"
            />

            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:p-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-lime-300">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-lime-400" />
                  Resumen operativo
                </span>
                <h2 className="mt-4 max-w-xl font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
                  La nómina del mes, <span className="text-lime-300">bajo control</span>.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-ink-300">
                  Registre trabajadores, revise el cálculo del backend y emita
                  volantes de pago con trazabilidad completa en un único archivo
                  plano.
                </p>
              </div>

              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-3 rounded-[28px] border border-white/[0.08]"
                />
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                    Total nómina procesada
                  </p>
                  <p className="mt-2 font-display text-[28px] font-semibold tracking-tight text-white tabular-nums sm:text-[34px]">
                    {formatearPesos(datos?.total_nomina_procesada)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-300">
                        Volantes
                      </p>
                      <p className="mt-0.5 font-display text-lg font-semibold text-white tabular-nums">
                        {formatearNumero(datos?.total_volantes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-300">
                        Empleados
                      </p>
                      <p className="mt-0.5 font-display text-lg font-semibold text-white tabular-nums">
                        {formatearNumero(totalEmpleados)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-ink-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-lime-400" />
                    Cálculos validados por el backend
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KPIs */}
          <div className="stagger mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              titulo="Empleados registrados"
              valor={formatearNumero(totalEmpleados)}
              detalle="Empleados únicos en el historial"
              icono={Users}
              tono="brand"
              cargando={estadisticas.cargando && !datos}
              to="/nomina"
            />
            <StatCard
              titulo="Administrativos"
              valor={formatearNumero(administrativos)}
              detalle="Personal administrativo"
              icono={BriefcaseBusiness}
              tono="sky"
              cargando={estadisticas.cargando && !datos}
              to="/historial?tipo=ADMINISTRATIVO"
            />
            <StatCard
              titulo="Operativos"
              valor={formatearNumero(operativos)}
              detalle="Trabajadores oficiales"
              icono={HardHat}
              tono="amber"
              cargando={estadisticas.cargando && !datos}
              to="/historial?tipo=OPERATIVO"
            />
            <StatCard
              titulo="Volantes generados"
              valor={formatearNumero(datos?.total_volantes)}
              detalle="Nóminas confirmadas"
              icono={ReceiptText}
              tono="slate"
              cargando={estadisticas.cargando && !datos}
              to="/volantes"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Últimos volantes */}
            <section className="animate-rise card overflow-hidden lg:col-span-2">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Últimos volantes</h2>
                  <p className="card-subtitle">
                    Los cinco registros más recientes del historial.
                  </p>
                </div>
                <Link
                  to="/historial"
                  className="btn-ghost shrink-0 text-xs"
                  aria-label="Ver historial completo"
                >
                  Ver historial
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {historial.cargando && registros.length === 0 ? (
                <div className="space-y-3 p-5">
                  {[0, 1, 2].map((fila) => (
                    <div
                      key={fila}
                      className="h-12 animate-pulse rounded-xl bg-ink-100"
                    />
                  ))}
                </div>
              ) : recientes.length === 0 ? (
                <EmptyState
                  icono={ReceiptText}
                  titulo="Aún no hay volantes generados"
                  descripcion="Registre un empleado, calcule su nómina y confirme el volante para comenzar el historial."
                >
                  <Link to="/registrar" className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Registrar primer empleado
                  </Link>
                </EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base min-w-[660px]">
                    <thead>
                      <tr>
                        <th className="table-head">Trabajador</th>
                        <th className="table-head">Tipo</th>
                        <th className="table-head text-right">Total a pagar</th>
                        <th className="table-head text-right">Volante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recientes.map((registro) => (
                        <tr key={registro.id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-[11px] font-bold text-brand-800">
                                {iniciales(registro.nombre)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-ink-900">
                                  {registro.nombre}
                                </p>
                                <p className="text-[11px] text-ink-400">
                                  N.° {String(registro.id).padStart(4, "0")} ·{" "}
                                  {registro.cargo}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <BadgeTipo tipo={registro.tipo} />
                          </td>
                          <td className="table-cell text-right font-semibold tabular-nums text-ink-900">
                            {formatearPesos(registro.total_pagar)}
                          </td>
                          <td className="table-cell text-right">
                            <Link
                              to={`/volantes/${registro.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                            >
                              Consultar
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Columna lateral */}
            <aside className="space-y-6">
              <section className="animate-rise card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="card-title">Composición de la planta</h2>
                    <p className="card-subtitle">Distribución por tipo</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                    <Users className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-5">
                  <div
                    className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                    style={{ background: graficoPlanta }}
                    role="img"
                    aria-label={`Planta: ${administrativos} administrativos y ${operativos} operativos`}
                  >
                    <div className="flex h-[70px] w-[70px] flex-col items-center justify-center rounded-full bg-white">
                      <span className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                        {formatearNumero(totalEmpleados)}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">
                        Total
                      </span>
                    </div>
                  </div>

                  <dl className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-2 text-[11px] font-medium text-ink-600">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        Administrativos
                      </dt>
                      <dd className="text-[11px] font-bold text-ink-900 tabular-nums">
                        {porcentajeAdmin}%
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-2 text-[11px] font-medium text-ink-600">
                        <span className="h-2 w-2 rounded-full bg-brand-600" />
                        Operativos
                      </dt>
                      <dd className="text-[11px] font-bold text-ink-900 tabular-nums">
                        {porcentajeOperativo}%
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink-50 px-3.5 py-3">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <p className="text-[10px] leading-4 text-ink-500">
                    Las estadísticas se calculan sobre empleados únicos; los
                    volantes contabilizan cada nómina confirmada.
                  </p>
                </div>
              </section>

            </aside>
          </div>

          {error && datos && (
            <p className="no-print mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Algunos datos no pudieron actualizarse: {error.message}
            </p>
          )}
        </>
      )}
    </>
  );
}
