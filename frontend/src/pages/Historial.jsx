import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  History,
  Plus,
  Search,
  Wallet,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BadgeTipo from "../components/BadgeTipo";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { useApiQuery } from "../hooks/useApiQuery";
import { obtenerHistorial } from "../services/api";
import { formatearNumero, formatearPesos, iniciales } from "../utils/format";
import { normalizarTexto } from "../utils/text";

const FILTROS = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "ADMINISTRATIVO", etiqueta: "Administrativos" },
  { valor: "OPERATIVO", etiqueta: "Operativos" },
];

export default function Historial() {
  const consulta = useApiQuery(obtenerHistorial);
  const [searchParams] = useSearchParams();
  const nombreParam = searchParams.get("nombre") || "";
  const tipoParam = searchParams.get("tipo") || "TODOS";

  const [busqueda, setBusqueda] = useState(nombreParam);
  const [tipo, setTipo] = useState(
    ["TODOS", "ADMINISTRATIVO", "OPERATIVO"].includes(tipoParam) ? tipoParam : "TODOS"
  );

  useEffect(() => {
    if (nombreParam) setBusqueda(nombreParam);
    if (tipoParam && ["TODOS", "ADMINISTRATIVO", "OPERATIVO"].includes(tipoParam)) {
      setTipo(tipoParam);
    }
  }, [nombreParam, tipoParam]);

  const registros = consulta.data?.registros || [];

  const filtrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    return [...registros]
      .reverse()
      .filter((registro) => {
        const coincideTermino =
          !termino ||
          normalizarTexto(registro.nombre).includes(termino) ||
          normalizarTexto(registro.cargo).includes(termino) ||
          String(registro.id).includes(termino);
        const coincideTipo = tipo === "TODOS" || registro.tipo === tipo;
        return coincideTermino && coincideTipo;
      });
  }, [registros, busqueda, tipo]);

  const hayFiltros = busqueda.trim() !== "" || tipo !== "TODOS";

  const totalFiltrado = filtrados.reduce(
    (suma, registro) => suma + Number(registro.total_pagar || 0),
    0,
  );

  function limpiarFiltros() {
    setBusqueda("");
    setTipo("TODOS");
  }

  return (
    <>
      <PageHeader
        titulo="Historial de nóminas"
        descripcion="Todos los registros confirmados y almacenados en el archivo plano. Cada fila corresponde a un volante de pago."
        icono={History}
      />

      {consulta.cargando && !consulta.data ? (
        <Loading mensaje="Cargando historial de nóminas..." />
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
                <History className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Registros totales
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(registros.length)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Visibles con filtros
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(filtrados.length)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Wallet className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Total visible
                </p>
                <p className="truncate font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearPesos(totalFiltrado)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-ink-200/80 bg-white p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="input-icon" />
              <input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="input pl-10 pr-10"
                placeholder="Buscar por nombre, cargo o número..."
                aria-label="Buscar en el historial"
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

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Filtrar por tipo de empleado"
              >
                {FILTROS.map((filtro) => (
                  <button
                    key={filtro.valor}
                    type="button"
                    onClick={() => setTipo(filtro.valor)}
                    aria-pressed={tipo === filtro.valor}
                    className={`chip ${
                      tipo === filtro.valor ? "chip-active" : ""
                    }`}
                  >
                    {filtro.etiqueta}
                  </button>
                ))}
              </div>
              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="btn-ghost px-2.5 py-2 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <section className="card overflow-hidden">
            {filtrados.length === 0 ? (
              <EmptyState
                icono={FileText}
                titulo={
                  registros.length === 0
                    ? "El historial está vacío"
                    : "Sin coincidencias"
                }
                descripcion={
                  registros.length === 0
                    ? "Cuando confirme una nómina, el registro se agregará automáticamente al archivo nomina.txt y aparecerá aquí."
                    : "No hay registros que coincidan con la búsqueda o el filtro seleccionado."
                }
              >
                {registros.length === 0 ? (
                  <Link to="/registrar" className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Registrar primer empleado
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="btn-secondary"
                  >
                    Limpiar filtros
                  </button>
                )}
              </EmptyState>
            ) : (
              <>
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Registros confirmados</h2>
                    <p className="card-subtitle">
                      Almacenados en{" "}
                      <span className="font-mono text-ink-600">nomina.txt</span>
                    </p>
                  </div>
                  <span className="badge bg-ink-100 text-ink-600">
                    Más recientes primero
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table-base min-w-[1240px]">
                    <thead>
                      <tr>
                        <th className="table-head">N.°</th>
                        <th className="table-head">Nombre</th>
                        <th className="table-head">Tipo</th>
                        <th className="table-head">Cargo</th>
                        <th className="table-head text-right">HT</th>
                        <th className="table-head text-right">Salario</th>
                        <th className="table-head text-right">HE</th>
                        <th className="table-head text-right">TPHE</th>
                        <th className="table-head text-right">Salud</th>
                        <th className="table-head text-right">Pensión</th>
                        <th className="table-head text-right">ARL</th>
                        <th className="table-head text-right">Total a pagar</th>
                        <th className="table-head text-right">Volante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((registro) => (
                        <tr key={registro.id} className="table-row">
                          <td className="table-cell">
                            <span className="font-mono text-[11px] font-semibold text-ink-400">
                              {String(registro.id).padStart(4, "0")}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-[10px] font-bold text-brand-800">
                                {iniciales(registro.nombre)}
                              </span>
                              <span className="font-semibold text-ink-900">
                                {registro.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <BadgeTipo tipo={registro.tipo} />
                          </td>
                          <td className="table-cell text-ink-600">
                            {registro.cargo}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearNumero(registro.horas_trabajadas)}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearPesos(registro.salario)}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearNumero(registro.horas_extras)}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearPesos(registro.total_pago_horas_extras)}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearPesos(registro.salud)}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearPesos(registro.pension)}
                          </td>
                          <td className="table-cell text-right tabular-nums text-ink-600">
                            {formatearPesos(registro.arl)}
                          </td>
                          <td className="table-cell text-right font-bold tabular-nums text-ink-900">
                            {formatearPesos(registro.total_pagar)}
                          </td>
                          <td className="table-cell text-right">
                            <Link
                              to={`/volantes/${registro.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                            >
                              Ver
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
