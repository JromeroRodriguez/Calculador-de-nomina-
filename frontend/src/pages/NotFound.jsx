import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="card relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl"
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700">
        <Compass className="h-7 w-7" />
      </div>
      <p className="eyebrow relative mt-5">Error 404</p>
      <h1 className="relative mt-2 font-display text-2xl font-semibold text-ink-900">
        La página solicitada no existe
      </h1>
      <p className="relative mt-2 max-w-md text-sm leading-6 text-ink-500">
        Verifique la dirección o regrese al panel principal para continuar
        gestionando la nómina.
      </p>
      <Link to="/panel" className="btn-primary relative mt-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al panel principal
      </Link>
    </div>
  );
}
