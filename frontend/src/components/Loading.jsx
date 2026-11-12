import { Loader2 } from "lucide-react";

export default function Loading({ mensaje = "Cargando información..." }) {
  return (
    <div className="card flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-ink-500">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Loader2 className="h-6 w-6 animate-spin" />
      </span>
      <p className="text-sm font-medium">{mensaje}</p>
    </div>
  );
}
