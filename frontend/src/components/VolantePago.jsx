import {
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import BadgeTipo from "./BadgeTipo";
import {
  etiquetaTipo,
  formatearNumero,
  formatearPesos,
  formatearPorcentaje,
  iniciales,
} from "../utils/format";

function FilaConcepto({ etiqueta, valor, destacada = false, nota }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <dt
          className={`text-sm ${
            destacada ? "font-semibold text-ink-900" : "text-ink-600"
          }`}
        >
          {etiqueta}
        </dt>
        {nota && <p className="mt-0.5 text-[11px] text-ink-400">{nota}</p>}
      </div>
      <dd
        className={`shrink-0 text-right text-sm tabular-nums whitespace-nowrap ${
          destacada ? "font-bold text-ink-900" : "font-medium text-ink-700"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

export default function VolantePago({ registro }) {
  if (!registro) return null;

  const numeroVolante = String(registro.id).padStart(4, "0");
  const esOperativo = registro.tipo === "OPERATIVO";

  return (
    <article className="print-area card overflow-hidden bg-white">
      {/* ENCABEZADO INSTITUCIONAL */}
      <div className="relative overflow-hidden bg-forest-900 px-6 py-6 text-white sm:px-8">
        <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-25" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-base font-bold tracking-tight text-white shadow-glow ring-1 ring-white/20">
              TC
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">
                TransCaribeCol
              </p>
              <p className="text-xs font-medium leading-5 text-ink-200">
                Transportes del Gran Caribe Colombiano S.C.A.
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-300">
                <Building2 className="h-3.5 w-3.5 text-lime-400" />
                NIT: 900.542.891-3 · Sistema de Gestión de Nómina
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="badge border border-white/15 bg-white/10 text-lime-300">
              <FileText className="h-3.5 w-3.5" />
              Comprobante de nómina
            </span>
            <p className="mt-2.5 font-display text-base font-semibold text-white">
              Volante de pago
            </p>
            <p className="font-mono text-sm font-semibold tracking-[0.18em] text-lime-300">
              N.° {numeroVolante}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-ink-300 sm:justify-end">
              <BadgeCheck className="h-3.5 w-3.5 text-lime-400" />
              Guardado en el historial
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* METADATOS DEL PERÍODO Y CONTRATO */}
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-ink-200/80 bg-ink-50/70 p-3.5 sm:grid-cols-4 text-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Período liquidado
            </p>
            <p className="mt-0.5 font-medium text-ink-800">Nómina mensual ordinaria</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Moneda
            </p>
            <p className="mt-0.5 font-medium text-ink-800">Pesos Colombianos (COP)</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Forma de pago
            </p>
            <p className="mt-0.5 font-medium text-ink-800">Transferencia electrónica</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Estado liquidación
            </p>
            <p className="mt-0.5 font-medium text-brand-700 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Aprobada y conciliada
            </p>
          </div>
        </div>

        {/* SECCIÓN 1: DATOS DEL TRABAJADOR */}
        <section className="grid gap-x-6 gap-y-5 border-b border-ink-100 pb-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="eyebrow">Trabajador</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-bold text-brand-800">
                {iniciales(registro.nombre)}
              </span>
              <div>
                <p className="font-display text-lg font-semibold leading-6 text-ink-900">
                  {registro.nombre}
                </p>
                <div className="mt-1">
                  <BadgeTipo tipo={registro.tipo} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow">Tipo de trabajador</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">
              {etiquetaTipo(registro.tipo)}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">
              {esOperativo ? "Trabajador oficial" : "Personal administrativo"}
            </p>
          </div>
          <div>
            <p className="eyebrow">Cargo</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">
              {registro.cargo}
            </p>
            <p className="mt-0.5 text-xs text-ink-400 whitespace-nowrap">
              Valor hora: {formatearPesos(registro.valor_hora)}
            </p>
          </div>
          <div>
            <p className="eyebrow">Horas liquidadas</p>
            <p className="mt-1 text-sm font-semibold text-ink-800 tabular-nums">
              {formatearNumero(registro.horas_trabajadas)} h
            </p>
          </div>
          <div>
            <p className="eyebrow">Riesgo ARL</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">
              Nivel {registro.nivel_riesgo} ·{" "}
              {formatearPorcentaje(registro.porcentaje_arl)}
            </p>
          </div>
          {esOperativo && registro.ibc !== null && (
            <div>
              <p className="eyebrow">Base de cotización (IBC)</p>
              <p className="mt-1 text-sm font-semibold text-ink-800 tabular-nums whitespace-nowrap">
                {formatearPesos(registro.ibc)}
              </p>
            </div>
          )}
        </section>

        {/* SECCIÓN 2: DEVENGOS Y DEDUCCIONES */}
        <section className="grid gap-6 py-6 lg:grid-cols-2">
          <div className="rounded-xl border border-ink-100 bg-white p-4">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500 pb-2 border-b border-ink-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <FileText className="h-3.5 w-3.5" />
              </span>
              Conceptos devengados
            </h3>
            <dl className="mt-2 divide-y divide-ink-100">
              <FilaConcepto
                etiqueta="Salario básico ordinario"
                valor={formatearPesos(registro.salario)}
              />
              <FilaConcepto
                etiqueta="Horas extras reportadas"
                valor={`${formatearNumero(registro.horas_extras)} h`}
              />
              <FilaConcepto
                etiqueta="Pago por horas extras"
                valor={formatearPesos(registro.total_pago_horas_extras)}
              />
              <FilaConcepto
                etiqueta="Total devengado"
                valor={formatearPesos(registro.total_devengado)}
                destacada
              />
            </dl>
          </div>

          <div className="rounded-xl border border-ink-100 bg-white p-4">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500 pb-2 border-b border-ink-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              Deducciones legales de seguridad social
            </h3>
            <dl className="mt-2 divide-y divide-ink-100">
              <FilaConcepto
                etiqueta={esOperativo ? "Aporte Salud (12.5% s/ IBC)" : "Aporte Salud (4%)"}
                valor={formatearPesos(registro.salud)}
              />
              <FilaConcepto
                etiqueta={esOperativo ? "Aporte Pensión (16% s/ IBC)" : "Aporte Pensión (4%)"}
                valor={formatearPesos(registro.pension)}
              />
              <FilaConcepto
                etiqueta="Aporte ARL"
                valor={formatearPesos(registro.arl)}
                nota={`Nivel ${registro.nivel_riesgo} · ${formatearPorcentaje(
                  registro.porcentaje_arl,
                )}`}
              />
              <FilaConcepto
                etiqueta="Total deducciones"
                valor={formatearPesos(registro.total_descuentos)}
                destacada
              />
            </dl>
          </div>
        </section>

        {/* SECCIÓN 3: TOTALES Y NETO A PAGAR */}
        <section className="grid gap-3 border-t border-ink-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3.5">
            <p className="eyebrow">Total devengado</p>
            <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800 whitespace-nowrap">
              {formatearPesos(registro.total_devengado)}
            </p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3.5">
            <p className="eyebrow">Total descuentos</p>
            <p className="mt-1 font-display text-base font-semibold tabular-nums text-ink-800 whitespace-nowrap">
              {formatearPesos(registro.total_descuentos)}
            </p>
          </div>
          <div className="rounded-xl border border-brand-700/20 bg-forest-900 px-4 py-3.5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lime-300">
              Neto pagado al trabajador
            </p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-white whitespace-nowrap">
              {formatearPesos(registro.total_pagar)}
            </p>
          </div>
        </section>

        {/* SECCIÓN 4: ESPACIO DE FIRMAS Y CONFORMIDAD */}
        <section className="mt-8 border-t border-ink-200 pt-8">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-56 border-b border-ink-300 pt-10" />
              <p className="mt-2.5 text-xs font-bold uppercase tracking-wider text-ink-800">
                Firma del Trabajador
              </p>
              <p className="text-[11px] text-ink-500">
                C.C. ________________________
              </p>
              <p className="text-[10px] text-ink-400 mt-0.5">
                Recibí a entera conformidad
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-56 border-b border-ink-300 pt-10" />
              <p className="mt-2.5 text-xs font-bold uppercase tracking-wider text-ink-800">
                Firma Autorizada
              </p>
              <p className="text-[11px] text-ink-500">
                TransCaribeCol S.C.A.
              </p>
              <p className="text-[10px] text-ink-400 mt-0.5">
                Gestión de Talento Humano y Nómina
              </p>
            </div>
          </div>
        </section>

        {/* PIE DE PÁGINA */}
        <footer className="mt-8 flex flex-col gap-4 border-t border-ink-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <p className="text-[10px] font-semibold text-ink-600">
              TransCaribeCol S.C.A. · NIT 900.542.891-3
            </p>
            <p className="mt-0.5 text-[9px] leading-4 text-ink-400">
              Documento expedido por el Sistema de Nómina TransCaribeCol para soporte de pago laboral.
              Los porcentajes de seguridad social y riesgos son liquidados conforme a la normativa vigente.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0" />
            Registro verificado en sistema
          </div>
        </footer>
      </div>
    </article>
  );
}
