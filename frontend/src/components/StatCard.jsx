import { Link } from "react-router-dom";

const tonos = {
  brand: {
    icono: "bg-brand-50 text-brand-700 ring-brand-100",
    barra: "from-brand-400 to-brand-600",
  },
  sky: {
    icono: "bg-sky-50 text-sky-700 ring-sky-100",
    barra: "from-sky-400 to-sky-600",
  },
  amber: {
    icono: "bg-amber-50 text-amber-700 ring-amber-100",
    barra: "from-amber-400 to-amber-600",
  },
  slate: {
    icono: "bg-ink-100 text-ink-600 ring-ink-200",
    barra: "from-ink-300 to-ink-500",
  },
};

export default function StatCard({
  titulo,
  valor,
  detalle,
  icono: Icono,
  tono = "brand",
  cargando = false,
  to,
}) {
  const estilo = tonos[tono] || tonos.brand;

  const contenido = (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${estilo.barra} opacity-70`}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold leading-5 text-ink-500">
          {titulo}
        </p>
        {Icono && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-105 ${estilo.icono}`}
          >
            <Icono className="h-[17px] w-[17px]" />
          </span>
        )}
      </div>
      {cargando ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-ink-100" />
      ) : (
        <p className="kpi-value mt-3">{valor}</p>
      )}
      {detalle && (
        <p className="mt-1 text-[11px] leading-5 text-ink-400">{detalle}</p>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="card group relative block overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
      >
        {contenido}
      </Link>
    );
  }

  return (
    <div className="card group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      {contenido}
    </div>
  );
}
