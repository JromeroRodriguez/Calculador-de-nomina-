import { etiquetaTipo } from "../utils/format";

const estilos = {
  ADMINISTRATIVO: "bg-sky-50 text-sky-700 ring-sky-200/70",
  OPERATIVO: "bg-brand-50 text-brand-800 ring-brand-200/70",
};

export default function BadgeTipo({ tipo }) {
  return (
    <span
      className={`badge ring-1 ring-inset ${
        estilos[tipo] || "bg-ink-100 text-ink-600 ring-ink-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tipo === "OPERATIVO" ? "bg-brand-500" : "bg-sky-500"
        }`}
      />
      {etiquetaTipo(tipo)}
    </span>
  );
}
