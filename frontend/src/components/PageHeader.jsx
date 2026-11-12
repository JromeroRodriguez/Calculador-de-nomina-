export default function PageHeader({
  titulo,
  descripcion,
  icono: Icono,
  acciones,
}) {
  return (
    <div className="no-print mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3.5">
        {Icono && (
          <span className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forest-800 to-brand-800 text-lime-300 shadow-soft ring-1 ring-inset ring-white/10">
            <Icono className="h-5 w-5" />
          </span>
        )}
        <div>
          <p className="eyebrow">TransCaribeCol · Nómina</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500">
              {descripcion}
            </p>
          )}
        </div>
      </div>
      {acciones && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {acciones}
        </div>
      )}
    </div>
  );
}
