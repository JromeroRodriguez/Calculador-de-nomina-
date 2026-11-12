import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileDown,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import { useToast } from "../components/ToastProvider";
import { useApiQuery } from "../hooks/useApiQuery";
import {
  descargarNomina,
  obtenerHistorial,
  obtenerTextoNomina,
} from "../services/api";
import { formatearNumero, formatearPesos } from "../utils/format";
import { descargarElementoPdf } from "../utils/pdf";

const columnas = [
  "Nombre",
  "Tipo",
  "Cargo",
  "HT",
  "Salario",
  "HE",
  "TPHE",
  "Salud",
  "Pensión",
  "ARL",
  "Total a pagar",
];

export default function ExportarTxt() {
  const consulta = useApiQuery(obtenerHistorial);
  const { notificar } = useToast();
  const [descargando, setDescargando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [vista, setVista] = useState("documental"); // "documental" | "txt"
  const [textoReporte, setTextoReporte] = useState("");
  const [cargandoTexto, setCargandoTexto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const registros = useMemo(() => consulta.data?.registros ?? [], [consulta.data]);

  const totales = useMemo(() => {
    return registros.reduce(
      (acum, reg) => ({
        horas_trabajadas: acum.horas_trabajadas + (Number(reg.horas_trabajadas) || 0),
        salario: acum.salario + (Number(reg.salario) || 0),
        horas_extras: acum.horas_extras + (Number(reg.horas_extras) || 0),
        total_pago_horas_extras:
          acum.total_pago_horas_extras + (Number(reg.total_pago_horas_extras) || 0),
        salud: acum.salud + (Number(reg.salud) || 0),
        pension: acum.pension + (Number(reg.pension) || 0),
        arl: acum.arl + (Number(reg.arl) || 0),
        total_pagar: acum.total_pagar + (Number(reg.total_pagar) || 0),
      }),
      {
        horas_trabajadas: 0,
        salario: 0,
        horas_extras: 0,
        total_pago_horas_extras: 0,
        salud: 0,
        pension: 0,
        arl: 0,
        total_pagar: 0,
      },
    );
  }, [registros]);

  // Cargar texto formateado cuando se activa la pestaña TXT
  useEffect(() => {
    if (vista === "txt" && !textoReporte) {
      cargarTexto();
    }
  }, [vista]);

  async function cargarTexto() {
    setCargandoTexto(true);
    try {
      const txt = await obtenerTextoNomina("reporte");
      setTextoReporte(txt);
    } catch (err) {
      notificar(err.message, "error");
    } finally {
      setCargandoTexto(false);
    }
  }

  async function copiarAlPortapapeles() {
    if (!textoReporte) {
      await cargarTexto();
    }
    try {
      await navigator.clipboard.writeText(textoReporte);
      setCopiado(true);
      notificar("Texto del reporte copiado al portapapeles.", "exito");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      notificar("No se pudo copiar al portapapeles.", "error");
    }
  }

  async function manejarDescargaTxt() {
    setDescargando(true);
    try {
      const blob = await descargarNomina("reporte");
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "nomina_transcaribecol.txt";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      notificar("Reporte TXT formateado descargado correctamente.", "exito");
    } catch (error) {
      notificar(error.message, "error");
    } finally {
      setDescargando(false);
    }
  }

  async function manejarExportPdf() {
    setGenerandoPdf(true);
    try {
      const elemento = document.querySelector(".nomina-print-sheet");
      if (!elemento) {
        throw new Error("No se encontró la vista de nómina para exportar.");
      }

      await descargarElementoPdf({
        elemento,
        nombreArchivo: "nomina_transcaribecol.pdf",
        titulo: "Nómina consolidada",
        subtitulo: "TransCaribeCol",
        orientation: "landscape",
      });
      notificar("PDF descargado correctamente en orientación horizontal.", "exito");
    } catch (error) {
      notificar(error.message, "error");
    } finally {
      setGenerandoPdf(false);
    }
  }

  const acciones = (
    <>
      <button
        type="button"
        onClick={() => {
          consulta.recargar();
          if (vista === "txt") cargarTexto();
        }}
        disabled={consulta.cargando}
        className="btn-secondary"
      >
        <RefreshCw className={`h-4 w-4 ${consulta.cargando ? "animate-spin" : ""}`} />
        Actualizar
      </button>

      {vista === "documental" && (
        <>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={consulta.cargando || !consulta.data}
            className="btn-secondary"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={manejarExportPdf}
            disabled={consulta.cargando || generandoPdf || Boolean(consulta.error && !consulta.data)}
            className="btn-primary"
          >
            {generandoPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {generandoPdf ? "Generando PDF..." : "Generar PDF"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={manejarDescargaTxt}
        disabled={descargando || Boolean(consulta.error && !consulta.data)}
        className={vista === "txt" ? "btn-primary" : "btn-secondary"}
      >
        {descargando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {descargando ? "Descargando..." : "Descargar TXT"}
      </button>
    </>
  );

  return (
    <>
      <PageHeader
        titulo="Nómina consolidada"
        descripcion="Consulte la nómina en formato tabular o en el archivo TXT estructurado con reporte consolidado y volantes individuales."
        icono={FileDown}
        acciones={acciones}
      />

      {/* SELECTOR DE VISTA: TABULAR VS ARCHIVO TXT */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 pb-3 no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVista("documental")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              vista === "documental"
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Vista Documental (PDF / Impresión)
          </button>
          <button
            type="button"
            onClick={() => setVista("txt")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              vista === "txt"
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white text-ink-600 hover:bg-ink-50 border border-ink-200"
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            Vista Archivo TXT Formateado
          </button>
        </div>

        {vista === "txt" && (
          <button
            type="button"
            onClick={copiarAlPortapapeles}
            className="btn-secondary !py-1.5 !px-3 text-xs"
          >
            {copiado ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiado ? "¡Copiado!" : "Copiar texto"}
          </button>
        )}
      </div>

      {consulta.cargando && !consulta.data ? (
        <Loading mensaje="Cargando nómina para exportación..." />
      ) : consulta.error && !consulta.data ? (
        <ErrorState
          mensaje={consulta.error.message}
          onReintentar={consulta.recargar}
        />
      ) : vista === "txt" ? (
        /* VISTA PREVIA DEL ARCHIVO TXT FORMATEADO */
        <div className="space-y-4 animate-rise">
          <div className="rounded-2xl border border-ink-800 bg-ink-950 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-ink-800 pb-3 text-xs text-ink-400">
              <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                <FileCode className="h-4 w-4" /> nomina_transcaribecol.txt
              </span>
              <span>Codificación: UTF-8 · Tabulación fija</span>
            </div>

            {cargandoTexto ? (
              <div className="py-12 text-center text-ink-400">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
                <p className="mt-2 text-xs">Cargando reporte formateado...</p>
              </div>
            ) : (
              <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-300/90 whitespace-pre scrollbar-thin">
                {textoReporte || "Presione Actualizar para generar el contenido del reporte TXT."}
              </pre>
            )}
          </div>
        </div>
      ) : (
        /* VISTA TABULAR DOCUMENTAL (PDF / IMPRESIÓN) */
        <div className="space-y-6">
          <section className="nomina-print-sheet card overflow-hidden bg-white">
            {/* ENCABEZADO REPORTE CONSOLIDADO */}
            <div className="relative overflow-hidden bg-forest-900 px-6 py-6 text-white sm:px-8">
              <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-30" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">
                    TransCaribeCol · NIT 900.542.891-3
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                    Planilla de Nómina Consolidada
                  </h2>
                  <p className="mt-1 text-xs text-ink-300">
                    Período mensual ordinario activo · {registros.length} trabajador(es) liquidado(s)
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs text-lime-200">
                  <ShieldCheck className="h-4 w-4 text-lime-400" />
                  <span>Documento oficial de control y liquidación</span>
                </div>
              </div>
            </div>

            {/* TABLA DE NÓMINA CONSOLIDADA */}
            <div className="overflow-x-auto p-4 sm:p-6">
              <div className="nomina-table-wrap">
                <table className="nomina-table w-full border-collapse overflow-hidden border border-ink-200 bg-white text-left text-xs shadow-none">
                  <thead>
                    <tr className="bg-forest-900 text-white">
                      {columnas.map((columna) => (
                        <th
                          key={columna}
                          className="border border-forest-800 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap text-ink-100"
                        >
                          {columna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registros.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columnas.length}
                          className="px-4 py-12 text-center text-ink-500"
                        >
                          No hay registros para mostrar.
                        </td>
                      </tr>
                    ) : (
                      registros.map((registro, index) => (
                        <tr
                          key={`${registro.id ?? index}-${registro.nombre}`}
                          className={index % 2 === 0 ? "bg-white" : "bg-ink-50/60"}
                        >
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-ink-900 font-medium whitespace-nowrap">
                            {registro.nombre}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-center text-ink-700 whitespace-nowrap">
                            {registro.tipo}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-ink-700 whitespace-nowrap">
                            {registro.cargo}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-center tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearNumero(registro.horas_trabajadas)}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-right tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearPesos(registro.salario)}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-center tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearNumero(registro.horas_extras)}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-right tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearPesos(registro.total_pago_horas_extras)}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-right tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearPesos(registro.salud)}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-right tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearPesos(registro.pension)}
                          </td>
                          <td className="border border-ink-200 px-3 py-2.5 align-middle text-right tabular-nums text-ink-700 whitespace-nowrap">
                            {formatearPesos(registro.arl)}
                          </td>
                          <td className="border border-ink-200 bg-brand-50/70 px-3 py-2.5 align-middle text-right font-bold tabular-nums text-brand-900 whitespace-nowrap">
                            {formatearPesos(registro.total_pagar)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {registros.length > 0 && (
                    <tfoot>
                      <tr className="bg-forest-950 text-white font-bold">
                        <td
                          colSpan={3}
                          className="border border-forest-800 px-3 py-3 text-left uppercase tracking-wider text-xs text-lime-300"
                        >
                          Totales Consolidados ({registros.length} trabajadores)
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-center tabular-nums whitespace-nowrap text-xs">
                          {formatearNumero(totales.horas_trabajadas)}
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-right tabular-nums whitespace-nowrap text-xs">
                          {formatearPesos(totales.salario)}
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-center tabular-nums whitespace-nowrap text-xs">
                          {formatearNumero(totales.horas_extras)}
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-right tabular-nums whitespace-nowrap text-xs">
                          {formatearPesos(totales.total_pago_horas_extras)}
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-right tabular-nums whitespace-nowrap text-xs text-red-200">
                          {formatearPesos(totales.salud)}
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-right tabular-nums whitespace-nowrap text-xs text-red-200">
                          {formatearPesos(totales.pension)}
                        </td>
                        <td className="border border-forest-800 px-3 py-3 text-right tabular-nums whitespace-nowrap text-xs text-amber-200">
                          {formatearPesos(totales.arl)}
                        </td>
                        <td className="border border-forest-800 bg-brand-900 px-3 py-3 text-right font-extrabold tabular-nums whitespace-nowrap text-sm text-lime-300">
                          {formatearPesos(totales.total_pagar)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* SECCIÓN DE FIRMAS DE CONTROL */}
            <div className="border-t border-ink-100 bg-ink-50/40 p-6 sm:px-8">
              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-64 border-b border-ink-300 pt-8" />
                  <p className="mt-2 font-bold uppercase tracking-wider text-ink-800">
                    Elaborado por: Coordinación de Nómina
                  </p>
                  <p className="text-[11px] text-ink-500">
                    TransCaribeCol S.C.A. · Talento Humano
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-64 border-b border-ink-300 pt-8" />
                  <p className="mt-2 font-bold uppercase tracking-wider text-ink-800">
                    Aprobado por: Gerencia Administrativa y Financiera
                  </p>
                  <p className="text-[11px] text-ink-500">
                    Revisión fiscal y control presupuestal
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 border-t border-ink-200/60 pt-4 text-[10px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Reporte oficial generado por el Sistema de Nómina SENA · TransCaribeCol
                </p>
                <p className="flex items-center gap-1.5 font-medium text-ink-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                  Total desembolso neto: {formatearPesos(totales.total_pagar)}
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-xs text-ink-600 shadow-card no-print">
            <div className="flex items-center gap-2 text-ink-500">
              <FileText className="h-4 w-4 text-brand-700" />
              {registros.length} volante(s) registrados en el archivo plano
            </div>
            <div className="flex items-center gap-2 text-ink-500 font-medium">
              <span>Orientación recomendada para PDF: Horizontal (A4 Landscape)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
