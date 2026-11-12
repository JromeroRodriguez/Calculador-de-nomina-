import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Calculator,
  History,
  Info,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BadgeTipo from "../components/BadgeTipo";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { useApiQuery } from "../hooks/useApiQuery";
import { obtenerEmpleados } from "../services/api";
import {
  formatearNumero,
  formatearPesos,
  formatearPorcentaje,
  iniciales,
} from "../utils/format";
import { normalizarTexto } from "../utils/text";

export default function GestionNomina() {
  const consulta = useApiQuery(obtenerEmpleados);
  const [busqueda, setBusqueda] = useState("");

  const empleados = consulta.data?.empleados || [];

  const filtrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return empleados;
    return empleados.filter(
      (empleado) =>
        normalizarTexto(empleado.nombre).includes(termino) ||
        normalizarTexto(empleado.cargo).includes(termino),
    );
  }, [empleados, busqueda]);

  return (
    <>
      <PageHeader
        titulo="Gestión de nómina"
        descripcion="Consulte los empleados registrados, revise su último pago y observe su historial de volantes asociados."
        icono={Calculator}
      />

      {consulta.cargando && !consulta.data ? (
        <Loading mensaje="Cargando empleados registrados..." />
      ) : consulta.error && !consulta.data ? (
        <ErrorState
          mensaje={consulta.error.message}
          onReintentar={consulta.recargar}
        />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Empleados únicos
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(consulta.data?.total || 0)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <History className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Volantes asociados
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(
                    empleados.reduce(
                      (suma, empleado) => suma + empleado.total_volantes,
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Calculator className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Coincidencias
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(filtrados.length)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-ink-200/80 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="input-icon" />
              <input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="input pl-10 pr-10"
                placeholder="Buscar por nombre o cargo..."
                aria-label="Buscar empleado"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-sky-50/70 px-3.5 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
              <p className="max-w-md text-[11px] leading-4 text-sky-800">
                Agrupados por nombre, tipo y cargo. Se muestra el último registro
                y el total de volantes asociados.
              </p>
            </div>
          </div>

          <section className="card overflow-hidden">
            {filtrados.length === 0 ? (
              <EmptyState
                icono={Users}
                titulo={busqueda ? "Sin coincidencias" : "No hay empleados registrados"}
                descripcion={
                  busqueda
                    ? "No se encontraron empleados con ese nombre o cargo. Pruebe con otro término."
                    : "Cuando confirme una nómina, el empleado aparecerá en esta sección junto con su último pago."
                }
              >
                {!busqueda && (
                  <Link to="/registrar" className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Registrar primer empleado
                  </Link>
                )}
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base min-w-[980px]">
                  <thead>
                    <tr>
                      <th className="table-head">Empleado</th>
                      <th className="table-head">Tipo</th>
                      <th className="table-head">Cargo</th>
                      <th className="table-head text-right">Horas</th>
                      <th className="table-head">Riesgo ARL</th>
                      <th className="table-head text-center">Volantes</th>
                      <th className="table-head text-right">Último total</th>
                      <th className="table-head text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((empleado) => (
                      <tr key={empleado.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-[11px] font-bold text-brand-800">
                              {iniciales(empleado.nombre)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink-900">
                                {empleado.nombre}
                              </p>
                              <p className="text-[11px] text-ink-400">
                                Último volante N.°{" "}
                                {String(empleado.ultimo_registro.id).padStart(4, "0")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <BadgeTipo tipo={empleado.tipo} />
                        </td>
                        <td className="table-cell text-ink-600">{empleado.cargo}</td>
                        <td className="table-cell text-right tabular-nums text-ink-600">
                          {formatearNumero(empleado.horas_trabajadas)} h
                        </td>
                        <td className="table-cell">
                          <span className="text-xs font-semibold text-ink-700">
                            {empleado.nivel_riesgo}
                          </span>
                          <span className="ml-1.5 text-[11px] text-ink-400">
                            {formatearPorcentaje(empleado.porcentaje_arl)}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          <span className="badge bg-ink-100 text-ink-600">
                            {empleado.total_volantes}
                          </span>
                        </td>
                        <td className="table-cell text-right font-semibold tabular-nums text-ink-900">
                          {formatearPesos(empleado.ultimo_registro.total_pagar)}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to="/registrar"
                              state={{
                                prefill: {
                                  nombre: empleado.nombre,
                                  tipo: empleado.tipo,
                                  cargo: empleado.cargo,
                                  horas_trabajadas: empleado.horas_trabajadas,
                                },
                              }}
                              className="btn-ghost px-2 py-1.5 text-xs text-brand-700"
                              title="Registrar nueva nómina para este empleado"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Nueva
                            </Link>
                            <Link
                              to={`/historial?nombre=${encodeURIComponent(
                                empleado.nombre,
                              )}`}
                              className="btn-ghost px-2 py-1.5 text-xs"
                              title="Ver historial del empleado"
                            >
                              <History className="h-3.5 w-3.5" />
                              Historial
                            </Link>
                            <Link
                              to={`/volantes/${empleado.ultimo_registro.id}`}
                              className="btn-ghost px-2 py-1.5 text-xs text-brand-700"
                              title="Consultar último volante"
                            >
                              Volante
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
