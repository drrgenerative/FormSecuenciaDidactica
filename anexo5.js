/* ==========================================================
   Matriz de ideación – ANEXO 5
   Formulario con autoguardado y generación de PDF (jsPDF)
   ========================================================== */

const CLAVE_ALMACEN = "matrizIdeacion_anexo5_v1";

const OPCIONES = ["Opción 1", "Opción 2", "Opción 3"];
const NIVELES_VIABILIDAD = ["Alta", "Media", "Baja"];

const DATOS_GENERALES = [
  { id: "institucion", etiqueta: "Institución educativa" },
  { id: "sede",        etiqueta: "Sede" },
  { id: "docentes",    etiqueta: "Docente(s) responsable(s)" },
  { id: "municipio",   etiqueta: "Municipio" },
  { id: "fecha",       etiqueta: "Fecha" }
];

/* ---------- Utilidades ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- Renderizado ---------- */
function renderizarOpciones() {
  $("#componentes").innerHTML = OPCIONES.map((nombre, i) => {
    const id = `op${i + 1}`;
    return `
      <article class="componente" data-id="${id}">
        <div class="componente-cabecera">
          <span class="componente-numero">${i + 1}</span>
          <div><h3 class="componente-titulo">Alternativa: ${nombre}</h3></div>
        </div>
        <div class="componente-cuerpo">
          <label class="campo"><span>Actividad principal</span>
            <textarea name="${id}_actividad" placeholder="¿Qué actividad principal realizarán los estudiantes?"></textarea></label>
          <label class="campo"><span>Uso posible del kit TIC de emergencia</span>
            <textarea name="${id}_uso" placeholder="¿Cómo se usaría el kit en esta alternativa?"></textarea></label>
          <div class="campo"><span>Viabilidad</span>
            <div class="opciones" role="radiogroup" aria-label="Viabilidad de la ${nombre}">
              ${NIVELES_VIABILIDAD.map(n => `
                <label class="opcion"><input type="radio" name="${id}_nivel" value="${n}"> ${n}</label>`).join("")}
            </div>
          </div>
          <label class="campo"><span>Justificación de la viabilidad</span>
            <textarea name="${id}_viabilidad" placeholder="Tiempo, recursos, conectividad, número de estudiantes, condiciones del aula…"></textarea></label>
        </div>
      </article>`;
  }).join("");
}

/* ---------- Datos ---------- */
function obtenerDatos() {
  const form = $("#formMatriz");
  const valor = n => (form.elements[n]?.value || "").trim();
  const datos = { generales: {}, opciones: {} };
  DATOS_GENERALES.forEach(d => { datos.generales[d.id] = valor(d.id); });
  OPCIONES.forEach((_, i) => {
    const id = `op${i + 1}`;
    datos.opciones[id] = {
      actividad: valor(`${id}_actividad`),
      uso: valor(`${id}_uso`),
      nivel: ($(`input[name="${id}_nivel"]:checked`) || {}).value || "",
      viabilidad: valor(`${id}_viabilidad`)
    };
  });
  return datos;
}

const opcionCompleta = r => !!(r.actividad && r.uso && (r.nivel || r.viabilidad));

function viabilidadComoTexto(r) {
  return [r.nivel ? `Viabilidad: ${r.nivel}` : "", r.viabilidad].filter(Boolean).join("\n");
}

/* ---------- Autoguardado ---------- */
function guardar() {
  try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(obtenerDatos())); } catch (e) { /* sin almacenamiento */ }
}

function cargar() {
  let datos;
  try { datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) || "null"); } catch (e) { datos = null; }
  if (!datos) return;
  const form = $("#formMatriz");
  Object.entries(datos.generales || {}).forEach(([k, v]) => { if (form.elements[k]) form.elements[k].value = v; });
  Object.entries(datos.opciones || {}).forEach(([id, r]) => {
    ["actividad", "uso", "viabilidad"].forEach(campo => {
      if (form.elements[`${id}_${campo}`]) form.elements[`${id}_${campo}`].value = r[campo] || "";
    });
    $$(`input[name="${id}_nivel"]`).forEach(i => { i.checked = i.value === r.nivel; });
  });
}

/* ---------- Progreso ---------- */
function actualizarProgreso() {
  const datos = obtenerDatos();
  let completas = 0;
  OPCIONES.forEach((_, i) => {
    const id = `op${i + 1}`;
    const ok = opcionCompleta(datos.opciones[id]);
    const tarjeta = $(`.componente[data-id="${id}"]`);
    tarjeta.classList.toggle("completo", ok);
    if (ok) { tarjeta.classList.remove("vacio"); completas++; }
  });
  $("#progresoTexto").textContent = `${completas} de ${OPCIONES.length} opciones diligenciadas`;
  $("#progresoRelleno").style.width = `${(completas / OPCIONES.length) * 100}%`;
  return completas;
}

function mostrarMensaje(texto, tipo = "") {
  const m = $("#mensaje");
  m.textContent = texto;
  m.className = `mensaje ${tipo}`;
}

/* ---------- PDF ---------- */
function formatearFecha(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function nombreArchivo(datos) {
  const base = (datos.generales.docentes || "docente")
    .split(",")[0]
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "")
    .slice(0, 40) || "docente";
  const fecha = datos.generales.fecha || new Date().toISOString().slice(0, 10);
  return `Matriz_ideacion_${base}_${fecha}.pdf`;
}

function generarPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    mostrarMensaje("No se pudo cargar la librería de PDF. Revise su conexión a internet y recargue la página.", "error");
    return;
  }

  const datos = obtenerDatos();
  const completas = actualizarProgreso();

  if (completas < OPCIONES.length) {
    OPCIONES.forEach((_, i) => {
      const id = `op${i + 1}`;
      if (!opcionCompleta(datos.opciones[id])) $(`.componente[data-id="${id}"]`).classList.add("vacio");
    });
    const faltan = OPCIONES.length - completas;
    if (!confirm(`Hay ${faltan} opción(es) incompleta(s) (marcadas en rojo). ¿Desea generar el PDF de todas formas?`)) {
      $(".componente.vacio")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "landscape" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const margen = 15;
  const azul = [31, 78, 121];
  const azulClaro = [219, 229, 241];
  const gris = [230, 230, 230];
  const estiloBase = { font: "helvetica", fontSize: 9.5, cellPadding: 2.5, lineColor: [120, 120, 120], lineWidth: 0.2, textColor: 20 };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("ANEXO 5 Matriz de ideación", anchoPagina / 2, 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Para diligenciamiento por parte del equipo docente", anchoPagina / 2, 22, { align: "center" });

  // Datos generales
  doc.autoTable({
    startY: 28,
    margin: { left: margen, right: margen },
    theme: "grid",
    head: [[{ content: "Datos generales", colSpan: 2 }]],
    body: DATOS_GENERALES.map(d => [
      d.etiqueta,
      d.id === "fecha" ? formatearFecha(datos.generales.fecha) : (datos.generales[d.id] || "")
    ]),
    styles: estiloBase,
    headStyles: { fillColor: azul, textColor: 255, halign: "center", fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 60, fontStyle: "bold", fillColor: azulClaro } }
  });

  // Matriz de ideación
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 6,
    margin: { left: margen, right: margen, bottom: 16 },
    theme: "grid",
    head: [["ALTERNATIVA", "ACTIVIDAD PRINCIPAL", "USO POSIBLE DEL KIT TIC DE EMERGENCIA", "VIABILIDAD"]],
    body: OPCIONES.map((nombre, i) => {
      const r = datos.opciones[`op${i + 1}`];
      return [nombre, r.actividad || "—", r.uso || "—", viabilidadComoTexto(r) || "—"];
    }),
    styles: { ...estiloBase, valign: "top", overflow: "linebreak" },
    headStyles: { fillColor: gris, textColor: 0, fontStyle: "bold", halign: "center", valign: "middle" },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold", halign: "center", valign: "middle" },
      1: { cellWidth: 82 },
      2: { cellWidth: 82 },
      3: { cellWidth: "auto" }
    }
  });

  // Pie de página
  const total = doc.internal.getNumberOfPages();
  const generado = new Date().toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(`Generado: ${generado}`, margen, altoPagina - 8);
    doc.text(`Página ${p} de ${total}`, anchoPagina - margen, altoPagina - 8, { align: "right" });
  }

  doc.save(nombreArchivo(datos));
  mostrarMensaje("PDF generado correctamente.", "ok");
}

/* ---------- Inicio ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderizarOpciones();
  cargar();

  const fecha = $("#fecha");
  if (!fecha.value) fecha.value = new Date().toISOString().slice(0, 10);

  actualizarProgreso();

  const form = $("#formMatriz");
  form.addEventListener("input", () => { guardar(); actualizarProgreso(); mostrarMensaje(""); });
  form.addEventListener("change", () => { guardar(); actualizarProgreso(); });

  $("#btnPdf").addEventListener("click", generarPDF);

  $("#btnLimpiar").addEventListener("click", () => {
    if (!confirm("¿Seguro que desea borrar todas las respuestas? Esta acción no se puede deshacer.")) return;
    form.reset();
    try { localStorage.removeItem(CLAVE_ALMACEN); } catch (e) { /* nada */ }
    fecha.value = new Date().toISOString().slice(0, 10);
    $$(".componente").forEach(el => el.classList.remove("vacio", "completo"));
    actualizarProgreso();
    mostrarMensaje("Formulario limpio.", "ok");
  });
});
