import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  mensaje = "No fue posible cargar la información.",
  onReintentar,
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 p-8 text-center sm:p-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h2 className="font-display text-base font-semibold text-ink-900">
          Ocurrió un problema
        </h2>
        <p className="mt-1 max-w-lg text-sm leading-6 text-ink-500">{mensaje}</p>
      </div>
      {onReintentar && (
        <button type="button" onClick={onReintentar} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}
