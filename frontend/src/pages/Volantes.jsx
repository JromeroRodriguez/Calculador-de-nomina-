import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  Plus,
  ReceiptText,
  Search,
  Users,
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

export default function Volantes() {
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
    return registros.filter((registro) => {
      const coincideTermino =
        !termino ||
        normalizarTexto(registro.nombre).includes(termino) ||
        normalizarTexto(registro.cargo).includes(termino) ||
        String(registro.id).includes(termino);
      const coincideTipo = tipo === "TODOS" || registro.tipo === tipo;
      return coincideTermino && coincideTipo;
    });
  }, [registros, busqueda, tipo]);

  const totalFiltrado = filtrados.reduce(
    (suma, registro) => suma + Number(registro.total_pagar || 0),
    0,
  );

  return (
    <>
      <PageHeader
        titulo="Volantes de pago"
        descripcion="Consulte los comprobantes generados. Cada volante conserva los valores calculados y confirmados por el backend."
        icono={ReceiptText}
      />

      {consulta.cargando && !consulta.data ? (
        <Loading mensaje="Cargando volantes de pago..." />
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
                <ReceiptText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Volantes visibles
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(filtrados.length)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Historial total
                </p>
                <p className="font-display text-lg font-semibold text-ink-900 tabular-nums">
                  {formatearNumero(registros.length)}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Wallet className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Total filtrado
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
                aria-label="Buscar volante"
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
          </div>

          <section className="card overflow-hidden">
            {filtrados.length === 0 ? (
              <EmptyState
                icono={FileText}
                titulo={
                  registros.length === 0
                    ? "Aún no hay volantes generados"
                    : "Sin coincidencias"
                }
                descripcion={
                  registros.length === 0
                    ? "Confirme una nómina para generar el primer volante de pago de la empresa."
                    : "No se encontraron volantes con los filtros seleccionados."
                }
              >
                {registros.length === 0 && (
                  <Link to="/registrar" className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Registrar empleado
                  </Link>
                )}
              </EmptyState>
            ) : (
              <>
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Comprobantes emitidos</h2>
                    <p className="card-subtitle">
                      {formatearNumero(filtrados.length)} volante
                      {filtrados.length === 1 ? "" : "s"} encontrado
                      {filtrados.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="badge bg-ink-100 text-ink-600">
                    Orden por número
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table-base min-w-[820px]">
                    <thead>
                      <tr>
                        <th className="table-head">N.°</th>
                        <th className="table-head">Trabajador</th>
                        <th className="table-head">Tipo</th>
                        <th className="table-head">Cargo</th>
                        <th className="table-head text-right">Horas</th>
                        <th className="table-head text-right">Total a pagar</th>
                        <th className="table-head text-right">Comprobante</th>
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
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-[11px] font-bold text-brand-800">
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
                            <span>{formatearNumero(registro.horas_trabajadas)} h</span>
                            {registro.horas_extras > 0 && (
                              <span className="block text-[11px] font-medium text-amber-700">
                                +{formatearNumero(registro.horas_extras)} h extras
                              </span>
                            )}
                          </td>
                          <td className="table-cell text-right font-semibold tabular-nums text-ink-900">
                            {formatearPesos(registro.total_pagar)}
                          </td>
                          <td className="table-cell text-right">
                            <Link
                              to={`/volantes/${registro.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Consultar
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
