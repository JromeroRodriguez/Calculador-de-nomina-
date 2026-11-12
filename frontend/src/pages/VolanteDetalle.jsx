import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Printer,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import VolantePago from "../components/VolantePago";
import { useToast } from "../components/ToastProvider";
import { useApiQuery } from "../hooks/useApiQuery";
import { obtenerNomina } from "../services/api";
import { descargarElementoPdf } from "../utils/pdf";

export default function VolanteDetalle() {
  const { id } = useParams();
  const identificador = Number(id);
  const identificadorValido = Number.isInteger(identificador) && identificador > 0;
  const { notificar } = useToast();
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const consulta = useApiQuery(
    () =>
      identificadorValido
        ? obtenerNomina(identificador)
        : Promise.reject(new Error("El identificador del volante no es válido.")),
    [identificador],
  );

  return (
    <>
      <div className="no-print">
        <PageHeader
          titulo="Volante de pago"
          descripcion={
            identificadorValido
              ? `Comprobante N.° ${String(identificador).padStart(4, "0")}`
              : "Consulta del comprobante de nómina"
          }
          icono={ReceiptText}
          acciones={
            <>
              <Link to="/volantes" className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!consulta.data}
                className="btn-secondary"
              >
                <Printer className="h-4 w-4" />
                Imprimir volante
              </button>
              <button
                type="button"
                onClick={async () => {
                  setGenerandoPdf(true);
                  try {
                    const elemento = document.querySelector(".print-area");
                    if (!elemento) {
                      throw new Error("No se encontró el volante para exportar.");
                    }

                    await descargarElementoPdf({
                      elemento,
                      nombreArchivo: `volante_pago_${identificador}.pdf`,
                      titulo: "Volante de pago",
                      subtitulo: "TransCaribeCol",
                    });
                    notificar("PDF descargado correctamente.", "exito");
                  } catch (error) {
                    notificar(error.message, "error");
                  } finally {
                    setGenerandoPdf(false);
                  }
                }}
                disabled={!consulta.data || generandoPdf}
                className="btn-primary"
              >
                {generandoPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {generandoPdf ? "Descargando..." : "Descargar PDF"}
              </button>
            </>
          }
        />
      </div>

      {consulta.cargando && !consulta.data ? (
        <Loading mensaje="Consultando volante de pago..." />
      ) : consulta.error && !consulta.data ? (
        <ErrorState
          mensaje={consulta.error.message}
          onReintentar={consulta.recargar}
        />
      ) : (
        <>
          <div className="animate-rise">
            <VolantePago registro={consulta.data} />
          </div>

          <div className="no-print mt-5 flex flex-col gap-3 rounded-2xl border border-brand-200/70 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
                  Documento guardado
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-brand-800">
                  Este volante ya se encuentra en el historial y en el archivo
                  plano <code className="font-mono">nomina.txt</code>. La
                  información proviene del backend.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/historial" className="btn-secondary px-3 py-2 text-xs">
                Ver historial
              </Link>
              <Link to="/registrar" className="btn-primary px-3 py-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Nueva nómina
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
