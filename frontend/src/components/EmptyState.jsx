import { Inbox } from "lucide-react";

export default function EmptyState({
  icono: Icono = Inbox,
  titulo = "No hay información",
  descripcion,
  children,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-200 bg-gradient-to-b from-white to-ink-50 text-ink-400 shadow-card">
        <Icono className="h-7 w-7" />
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-lime-400"
        />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-ink-900">
        {titulo}
      </h3>
      {descripcion && (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-ink-500">
          {descripcion}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
