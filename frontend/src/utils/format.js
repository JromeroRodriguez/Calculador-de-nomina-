const formatoPesos = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const formatoNumero = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const formatoPorcentaje = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatearPesos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "$ 0";
  return `$ ${formatoPesos.format(numero)}`;
}

export function formatearNumero(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0";
  return formatoNumero.format(numero);
}

export function formatearPorcentaje(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0 %";
  return `${formatoPorcentaje.format(numero)} %`;
}

export function formatearFechaActual(fecha = new Date()) {
  const texto = fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaTipo(tipo) {
  if (tipo === "ADMINISTRATIVO") return "Administrativo";
  if (tipo === "OPERATIVO") return "Operativo";
  return tipo || "Sin tipo";
}

export function iniciales(nombre = "") {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

export function capitalizarNombre(nombre = "") {
  const partes = String(nombre || "").trim().split(/\s+/);
  if (!partes.length || !partes[0]) return "";
  const conectores = new Set(["de", "del", "la", "las", "los", "y", "e"]);
  return partes
    .map((p, i) => {
      const pLow = p.toLowerCase();
      if (i > 0 && conectores.has(pLow)) return pLow;
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join(" ");
}

