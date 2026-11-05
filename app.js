/* ==========================================================
   Matriz de decisión pedagógica – ANEXO 2
   Formulario con autoguardado y generación de PDF (jsPDF)
   ========================================================== */

const CLAVE_ALMACEN = "matrizDecisionPedagogica_v1";

const ALCANCES = [
  "Visualizar", "Comparar", "Representar", "Simular",
  "Crear", "Dialogar", "Retroalimentar"
];

// Para modificar preguntas o componentes, edite esta lista.
const COMPONENTES = [
  { id: "area_grado",      componente: "Área y grado",                       pregunta: "¿Con qué estudiantes voy a trabajar?", tipo: "area_grado" },
  { id: "proposito",       componente: "Propósito de aprendizaje",            pregunta: "¿Qué quiero que aprendan?" },
  { id: "actividad",       componente: "Actividad del estudiante",            pregunta: "¿Qué tendrán que hacer para aprenderlo?" },
  { id: "condiciones",     componente: "Condiciones de implementación",       pregunta: "¿Dónde y en qué condiciones se desarrollará?" },
  { id: "mediacion",       componente: "Mediación tecnológica",               pregunta: "¿Qué función tendrá el kit?" },
  { id: "alcance",         componente: "Alcance tecnológico",                 pregunta: "¿Visualizar, comparar, representar, simular, crear, dialogar o retroalimentar?", tipo: "alcance" },
  { id: "formacion",       componente: "Formación integral",                  pregunta: "¿Qué dimensión humana contribuye a fortalecer?" },
  { id: "socioemocional",  componente: "Desarrollo socioemocional",           pregunta: "¿Qué oportunidad de bienestar, convivencia o resiliencia genera?" },
  { id: "interaccion",     componente: "Interacción y socialización",         pregunta: "¿Qué harán los estudiantes con otros?" },
  { id: "evidencia",       componente: "Evidencia",                           pregunta: "¿Cómo sabremos que aprendieron?" },
  { id: "alternativa",     componente: "Alternativa tecnológica desconectada", pregunta: "¿Qué ocurrirá si no hay conectividad o falla el equipo?" }
];

const NOTA_METODOLOGICA =
  "El Módulo 2 retomará esta decisión pedagógica para transformarla en una secuencia " +
  "didáctica contextualizada mediante principios del Pensamiento de Diseño (Design Thinking), " +
  "incorporando actividades, interacción, mediación tecnológica, formación integral y " +
  "desarrollo socioemocional.";

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

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ---------- Renderizado del formulario ---------- */
function renderizarComponentes() {
  const contenedor = $("#componentes");
  contenedor.innerHTML = COMPONENTES.map((c, i) => {
    let cuerpo;
    if (c.tipo === "area_grado") {
      cuerpo = `
        <div class="fila-doble">
          <label class="campo"><span>Área</span>
            <input type="text" name="${c.id}_area" placeholder="Ej.: Ciencias Naturales"></label>
          <label class="campo"><span>Grado</span>
            <input type="text" name="${c.id}_grado" placeholder="Ej.: Séptimo (7°)"></label>
        </div>
        <label class="campo"><span>Características del grupo</span>
          <textarea name="${c.id}_texto" placeholder="Número de estudiantes, edades, contexto, intereses, necesidades…"></textarea></label>`;
    } else if (c.tipo === "alcance") {
      cuerpo = `
        <div class="opciones" role="group" aria-label="Alcance tecnológico">
          ${ALCANCES.map(a => `
            <label class="opcion"><input type="checkbox" name="${c.id}_op" value="${a}"> ${a}</label>`).join("")}
        </div>
        <label class="campo"><span>Describa cómo se usará</span>
          <textarea name="${c.id}_texto" placeholder="Explique el alcance seleccionado…"></textarea></label>`;
    } else {
      cuerpo = `<textarea name="${c.id}_texto" aria-label="${escapar(c.pregunta)}" placeholder="Escriba su respuesta…"></textarea>`;
    }

    return `
      <article class="componente" data-id="${c.id}">
        <div class="componente-cabecera">
          <span class="componente-numero">${i + 1}</span>
          <div>
            <h3 class="componente-titulo">${escapar(c.componente)}</h3>
            <p class="componente-pregunta">${escapar(c.pregunta)}</p>
          </div>
        </div>
        <div class="componente-cuerpo">${cuerpo}</div>
      </article>`;
  }).join("");
}

/* ---------- Recolección de datos ---------- */
function obtenerDatos() {
  const form = $("#formMatriz");
  const datos = { generales: {}, respuestas: {} };

  DATOS_GENERALES.forEach(d => { datos.generales[d.id] = (form.elements[d.id]?.value || "").trim(); });

  COMPONENTES.forEach(c => {
    const r = { texto: (form.elements[`${c.id}_texto`]?.value || "").trim() };
    if (c.tipo === "area_grado") {
      r.area = (form.elements[`${c.id}_area`]?.value || "").trim();
      r.grado = (form.elements[`${c.id}_grado`]?.value || "").trim();
    }
    if (c.tipo === "alcance") {
      r.opciones = $$(`input[name="${c.id}_op"]:checked`).map(i => i.value);
    }
    datos.respuestas[c.id] = r;
  });
  return datos;
}

function componenteCompleto(c, r) {
  if (c.tipo === "area_grado") return !!(r.area && r.grado);
  if (c.tipo === "alcance") return r.opciones.length > 0 || !!r.texto;
  return !!r.texto;
}

/* Texto que se imprime en el PDF para cada componente */
function respuestaComoTexto(c, r) {
  if (c.tipo === "area_grado") {
    const partes = [];
    if (r.area) partes.push(`Área: ${r.area}`);
    if (r.grado) partes.push(`Grado: ${r.grado}`);
    if (r.texto) partes.push(r.texto);
    return partes.join("\n");
  }
  if (c.tipo === "alcance") {
    const partes = [];
    if (r.opciones.length) partes.push(`Seleccionado: ${r.opciones.join(", ")}`);
    if (r.texto) partes.push(r.texto);
    return partes.join("\n");
  }
  return r.texto;
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

  COMPONENTES.forEach(c => {
    const r = (datos.respuestas || {})[c.id];
    if (!r) return;
    if (form.elements[`${c.id}_texto`]) form.elements[`${c.id}_texto`].value = r.texto || "";
    if (c.tipo === "area_grado") {
      form.elements[`${c.id}_area`].value = r.area || "";
      form.elements[`${c.id}_grado`].value = r.grado || "";
    }
    if (c.tipo === "alcance" && Array.isArray(r.opciones)) {
      $$(`input[name="${c.id}_op"]`).forEach(i => { i.checked = r.opciones.includes(i.value); });
    }
  });
}

/* ---------- Progreso ---------- */
function actualizarProgreso() {
  const datos = obtenerDatos();
  let completos = 0;
  COMPONENTES.forEach(c => {
    const ok = componenteCompleto(c, datos.respuestas[c.id]);
    const tarjeta = $(`.componente[data-id="${c.id}"]`);
    tarjeta.classList.toggle("completo", ok);
    if (ok) tarjeta.classList.remove("vacio");
    if (ok) completos++;
  });
  $("#progresoTexto").textContent = `${completos} de ${COMPONENTES.length} componentes diligenciados`;
  $("#progresoRelleno").style.width = `${(completos / COMPONENTES.length) * 100}%`;
  return completos;
}

function mostrarMensaje(texto, tipo = "") {
  const m = $("#mensaje");
  m.textContent = texto;
  m.className = `mensaje ${tipo}`;
}

/* ---------- Generación del PDF ---------- */
function formatearFecha(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function nombreArchivo(datos) {
  const base = (datos.generales.docentes || "docente")
    .split(",")[0]
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "")
    .slice(0, 40) || "docente";
  const fecha = datos.generales.fecha || new Date().toISOString().slice(0, 10);
  return `Matriz_decision_pedagogica_${base}_${fecha}.pdf`;
}

function generarPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    mostrarMensaje("No se pudo cargar la librería de PDF. Revise su conexión a internet y recargue la página.", "error");
    return;
  }

  const datos = obtenerDatos();
  const completos = actualizarProgreso();

  if (completos < COMPONENTES.length) {
    COMPONENTES.forEach(c => {
      if (!componenteCompleto(c, datos.respuestas[c.id])) {
        $(`.componente[data-id="${c.id}"]`).classList.add("vacio");
      }
    });
    const faltan = COMPONENTES.length - completos;
    const seguir = confirm(`Hay ${faltan} componente(s) sin diligenciar (marcados en rojo). ¿Desea generar el PDF de todas formas?`);
    if (!seguir) {
      $(".componente.vacio")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const margen = 15;
  const azul = [31, 78, 121];
  const azulClaro = [219, 229, 241];

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("ANEXO 2 Matriz de decisión pedagógica", anchoPagina / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Para diligenciamiento por parte del equipo docente", anchoPagina / 2, 24, { align: "center" });

  // Datos generales
  doc.autoTable({
    startY: 30,
    margin: { left: margen, right: margen },
    theme: "grid",
    head: [[{ content: "Datos generales", colSpan: 2 }]],
    body: DATOS_GENERALES.map(d => [
      d.etiqueta,
      d.id === "fecha" ? formatearFecha(datos.generales.fecha) : (datos.generales[d.id] || "")
    ]),
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 2.2, lineColor: [150, 150, 150], lineWidth: 0.2, textColor: 20 },
    headStyles: { fillColor: azul, textColor: 255, halign: "center", fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold", fillColor: azulClaro } }
  });

  // Matriz
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 6,
    margin: { left: margen, right: margen, bottom: 18 },
    theme: "grid",
    head: [
      [{ content: "Matriz de decisión pedagógica", colSpan: 3, styles: { halign: "center", fillColor: azul, textColor: 255 } }],
      ["Componente", "Pregunta orientadora", "Respuesta del equipo docente"]
    ],
    body: COMPONENTES.map(c => [
      c.componente,
      c.pregunta,
      respuestaComoTexto(c, datos.respuestas[c.id]) || "—"
    ]),
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 2.5, valign: "top", lineColor: [150, 150, 150], lineWidth: 0.2, textColor: 20, overflow: "linebreak" },
    headStyles: { fillColor: azulClaro, textColor: 0, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: "bold" },
      1: { cellWidth: 52 },
      2: { cellWidth: "auto" }
    }
  });

  // Nota metodológica
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 6,
    margin: { left: margen, right: margen, bottom: 18 },
    theme: "grid",
    body: [[{ content: "NOTA METODOLÓGICA: " + NOTA_METODOLOGICA }]],
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 3, lineColor: [150, 150, 150], lineWidth: 0.2, textColor: 20, halign: "justify" },
    rowPageBreak: "avoid"
  });

  // Pie de página con numeración
  const total = doc.internal.getNumberOfPages();
  const altoPagina = doc.internal.pageSize.getHeight();
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
  renderizarComponentes();
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
