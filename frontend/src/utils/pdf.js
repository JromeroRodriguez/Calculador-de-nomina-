import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Genera y descarga un documento PDF optimizado en dimensiones A4 estándar (Portrait o Landscape)
 * con alta resolución, márgenes estándar de imprenta (10 mm), fondo blanco puro y paginación automática.
 */
export async function descargarElementoPdf({
  elemento,
  nombreArchivo = "documento.pdf",
  titulo = "Comprobante",
  subtitulo = "TransCaribeCol",
  orientation = "portrait",
}) {
  if (!(elemento instanceof HTMLElement)) {
    throw new Error("No se encontró el contenido para exportar.");
  }

  // Dimensiones estándar A4 en puntos (pt)
  // 1 pt = 1/72 pulgada (A4 = 210 x 297 mm = 595.28 x 841.89 pt)
  const esHorizontal = orientation === "landscape";
  const pageWidth = esHorizontal ? 841.89 : 595.28;
  const pageHeight = esHorizontal ? 595.28 : 841.89;

  // Márgenes estándar de imprenta (28 pt = 9.88 mm, aprox. 1 cm)
  const marginX = 28;
  const marginY = esHorizontal ? 24 : 28;
  const printableWidth = pageWidth - 2 * marginX;
  const printableHeight = pageHeight - 2 * marginY;

  // Renderizado en canvas con fondo blanco puro y escala de alta resolución
  const canvas = await html2canvas(elemento, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    windowWidth: Math.max(
      document.documentElement.clientWidth,
      elemento.scrollWidth || 0,
      esHorizontal ? 1200 : 980,
    ),
    onclone: (clonedDoc) => {
      // Ajustar el DOM clonado para aspecto documental formal sin estilos de tarjeta web
      const clonedElement =
        clonedDoc.querySelector(".print-area") ||
        clonedDoc.querySelector(".nomina-print-sheet") ||
        clonedDoc.querySelector(elemento.id ? `#${elemento.id}` : `.${elemento.classList[0]}`);

      if (clonedElement) {
        clonedElement.style.boxShadow = "none";
        clonedElement.style.borderRadius = "0px";
        clonedElement.style.border = "1px solid #cbd5e1";
        clonedElement.style.margin = "0px";
        clonedElement.style.width = "100%";
        clonedElement.style.backgroundColor = "#ffffff";

        // Suavizar bordes redondeados internos excesivos para formato impreso
        const roundedChildren = clonedElement.querySelectorAll(".rounded-2xl, .rounded-xl");
        roundedChildren.forEach((child) => {
          if (!child.classList.contains("rounded-full")) {
            child.style.borderRadius = "4px";
          }
        });
      }
    },
  });

  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    format: "a4",
    compress: true,
  });

  pdf.setProperties({
    title: titulo,
    subject: subtitulo,
    author: "TransCaribeCol",
    creator: "Sistema de Nómina TransCaribeCol",
  });

  const scale = printableWidth / canvas.width;
  const totalScaledHeight = canvas.height * scale;

  // Si el contenido cabe en una sola página:
  if (totalScaledHeight <= printableHeight) {
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(
      imgData,
      "PNG",
      marginX,
      marginY,
      printableWidth,
      totalScaledHeight,
      undefined,
      "FAST",
    );

    // Pie de página con verificación y fecha
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `TransCaribeCol S.C.A. · ${titulo} · Generado el ${new Date().toLocaleDateString("es-CO")} | Página 1 de 1`,
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" },
    );
  } else {
    // Si el contenido excede una página, paginar ordenadamente
    const sliceCanvasHeight = printableHeight / scale;
    const totalPages = Math.ceil(canvas.height / sliceCanvasHeight);
    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const currentSliceHeight = Math.min(
        canvas.height - sourceY,
        sliceCanvasHeight,
      );

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentSliceHeight;
      const ctx = pageCanvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          canvas.width,
          currentSliceHeight,
        );
      }

      if (pageIndex > 0) {
        pdf.addPage("a4", orientation);
      }

      const sliceData = pageCanvas.toDataURL("image/png");
      const slicePdfHeight = currentSliceHeight * scale;

      pdf.addImage(
        sliceData,
        "PNG",
        marginX,
        marginY,
        printableWidth,
        slicePdfHeight,
        undefined,
        "FAST",
      );

      // Pie de página institucional con numeración
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `TransCaribeCol S.C.A. · ${titulo} · Generado el ${new Date().toLocaleDateString("es-CO")} | Página ${pageIndex + 1} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );

      sourceY += currentSliceHeight;
      pageIndex++;
    }
  }

  pdf.save(nombreArchivo);
}
