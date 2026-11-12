import { CalendarDays, Menu, UserRound } from "lucide-react";
import { formatearFechaActual } from "../utils/format";

export default function Header({ modulo, onAbrirMenu }) {
  return (
    <header className="app-header no-print sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-stone-200/60 bg-[#f7f8f5]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="rounded-xl border border-stone-200 bg-white/80 p-2 text-stone-600 shadow-sm transition-colors hover:bg-stone-100 hover:text-stone-900 lg:hidden"
          aria-label="Abrir menú de navegación"
          aria-controls="navegacion-principal"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav
          aria-label="Ruta de navegación"
          className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-stone-500"
        >
          <span className="truncate text-stone-500">Nómina</span>
          <span aria-hidden="true" className="text-stone-300">
            /
          </span>
          <span aria-current="page" className="truncate font-semibold text-stone-700">
            {modulo}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1.5 text-emerald-700 shadow-sm md:flex">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold">Sistema operativo</span>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-2.5 py-1.5 text-stone-600 shadow-sm lg:flex">
          <CalendarDays className="h-3.5 w-3.5 text-stone-500" />
          <span className="text-[11px] font-medium">{formatearFechaActual()}</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white/80 py-1 pl-1.5 pr-3 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
            NO
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-[11px] font-semibold text-stone-800">Nómina</p>
            <p className="flex items-center gap-1 text-[10px] font-medium text-stone-500">
              <UserRound className="h-2.5 w-2.5" />
              Área de nómina
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
