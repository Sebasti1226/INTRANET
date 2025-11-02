 document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".navbar a");
  const content = document.getElementById("content");
  const themeToggle = document.getElementById("theme-toggle");

  // --- Cargar páginas dinámicamente ---
  links.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");

      try {
        const response = await fetch(`pages/${page}`);
        const html = await response.text();
        content.innerHTML = html;

        // 👇 Aquí activamos el JS específico de cada página      
         if (page.includes("accesos")) {
          Accesos.init();
        }
        if (page.includes("masivos")) {
          initMasivos();
        }
        if (page.includes("ticket")) {
          Ticket.init();
        }
        if (page.includes("scripts")) {
          initScripts();
        }
        if (page.includes("manuales")) {
          initManuales();
        }
      } catch (error) {
        content.innerHTML = "<p>Error al cargar la página.</p>";
        console.error(error);
      }
    });
  });

  // --- Toggle Dark/Light Mode ---
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  // --- Cargar preferencia de tema guardada ---
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  // --- Cargar página inicial ---
  // (ejemplo: accesos.html de entrada, cambia a la que quieras)
  fetch("pages/accesos.html")
    .then(res => res.text())
    .then(html => {
      content.innerHTML = html;
      Accesos.init(); // inicializamos de una vez
    });
});

// ==================================================
// MODULOS DE ACCESOS
// ==================================================
const Accesos = {
  mostrarTooltip(mensaje, elemento) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerText = mensaje;
    document.body.appendChild(tooltip);

    const rect = elemento.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - 35 + window.scrollY + 'px';

    setTimeout(() => tooltip.classList.add('show'), 10);
    setTimeout(() => {
      tooltip.classList.remove('show');
      setTimeout(() => document.body.removeChild(tooltip), 300);
    }, 2000);
  },

  copiarTexto(id) {
    const texto = document.getElementById(id);
    texto.select();
    texto.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(texto.value);
    this.mostrarTooltip('✅ Copiado al portapapeles', texto);
  },

  actualizarRightPanel() {
    const campos = ['para','cc','asunto','ssee','horario','personal'];
    campos.forEach(id => {
      let elemRight = document.getElementById(id + 'Right');
      if (elemRight) {
        elemRight.style.opacity = 0;
        setTimeout(() => {
          if (id === 'horario') {
            const hi = document.getElementById('horaInicio').value || "--:--";
            const hf = document.getElementById('horaFin').value || "--:--";
            elemRight.textContent = `${hi} a ${hf}`;
          } else {
            elemRight.textContent = document.getElementById(id)?.value || "";
          }
          elemRight.style.opacity = 1;
        }, 150);
      }
    });
  },

  borrarContenido() {
    ['asunto','ssee','horaInicio','horaFin','personal','correoGenerado']
      .forEach(id => document.getElementById(id).value = '');
    this.actualizarRightPanel();
  },

  generarCorreo() {
    const ssee = document.getElementById('ssee').value.trim();
    const inicio = document.getElementById('horaInicio').value || "--:--";
    const fin = document.getElementById('horaFin').value || "--:--";
    const personal = document.getElementById('personal').value.trim();
    const fecha = new Date().toLocaleDateString('es-ES');

    const asunto = `INGRESO EMERGENTE 0001 SSEE ${ssee} - ${fecha}`;
    document.getElementById('asunto').value = asunto;

    const correo = `Estimados,\n\nPor este medio solicitamos autorización de acceso a Subestación ${ssee} en el horario de ${inicio} a ${fin} horas, para realizar mediciones reflectométricas por corte de fibra reportado.\n\nListado de personal:\n${personal}\n\nQuedamos atentos a sus comentarios.`;
    document.getElementById('correoGenerado').value = correo;

    this.copiarTexto('correoGenerado');
    this.actualizarRightPanel();
  },

  init() {
    ['para','cc','ssee','horaInicio','horaFin','personal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.actualizarRightPanel());
    });
    this.actualizarRightPanel();
  }
};

// Inicializar módulo al cargar accesos.html
document.addEventListener("page:accesos", () => {
  Accesos.init();
});


// ==================================================
// MASIVOS
// ==================================================
function initMasivos() {
  const dataInput = document.getElementById('dataInput');
  const processBtn = document.getElementById('processBtn');
  const clearBtn = document.getElementById('clearBtn');
  const toggleOrdenBtn = document.getElementById('toggleOrdenBtn');
  const outputEl = document.getElementById('output');
  const selectedList = document.getElementById('selectedList');
  const countEl = document.getElementById('count');
  const copyBtn = document.getElementById('copyBtn');
  const engineersInput = document.getElementById('engineersInput');

  if (!dataInput) return; // <- seguridad: si no estamos en masivos, salir

  let ordenDesc = localStorage.getItem('ordenDesc') === null ? true : localStorage.getItem('ordenDesc') === 'true';
  let seleccionados = [];
  let engineerIndex = 0;

  function actualizarBotonOrden(){
    toggleOrdenBtn.textContent = ordenDesc ? 'Orden: Descendente ⬇️' : 'Orden: Ascendente ⬆️';
  }

  function parseExcelText(text){
    const lines = text.trim().split(/\n|\r/).filter(l => l.trim() !== '');
    return lines.map(line => {
      const parts = line.split(/\t|,/).map(p => p.trim());
      return { tik: parts[0] || '', id: parts[1] || '', fecha: parts[2] || '' };
    });
  }

  function parseFecha(f){
    if (!f) return 0;
    const ts = Date.parse(f);
    return isNaN(ts) ? 0 : ts;
  }

  function agruparYOrdenar(registros){
    const agrupado = {};
    registros.forEach(r => {
      const id = (r.id || '').toString();
      if (!agrupado[id]) agrupado[id] = [];
      agrupado[id].push(r);
    });
    Object.keys(agrupado).forEach(id => {
      agrupado[id].sort((a,b) => ordenDesc ? parseFecha(b.fecha) - parseFecha(a.fecha) : parseFecha(a.fecha) - parseFecha(b.fecha));
    });
    return agrupado;
  }

  function agruparYMarcar(lista){
    return lista.map((item, idx) => {
      const clase = idx === 0 ? 'tik-item destacado' : 'tik-item';
      return `<div class="${clase}" data-tik="${item.tik}" data-id="${item.id}" data-fecha="${item.fecha}">${item.tik} | ${item.id} | ${item.fecha}</div>`;
    }).join('');
  }

  function obtenerIngenieros(){
    return engineersInput.value.trim().split(/\n/).filter(x => x.trim() !== '');
  }

  function asignarIngeniero(){
    const engineers = obtenerIngenieros();
    if (engineers.length === 0) return "";
    const eng = engineers[engineerIndex % engineers.length];
    engineerIndex++;
    return eng;
  }

  function activarClickMover(){
    const items = document.querySelectorAll('.tik-item');

    items.forEach(item => {
      item.onclick = () => {
        const tik = item.dataset.tik;
        const id = item.dataset.id;
        const comboBase = `${tik} | ${id}`;
        const existente = seleccionados.find(x => x.base === comboBase);

        if (existente){
          seleccionados = seleccionados.filter(x => x.base !== comboBase);
          const group = document.querySelector(`.group[data-id="${id}"] .dropzone`);
          if (group){
            group.appendChild(item);
            item.classList.remove('seleccionado');
          }
        } else {
          const eng = asignarIngeniero();
          seleccionados.push({ base: comboBase, text: eng ? comboBase + " " + eng : comboBase, auto: false });
          item.classList.add('seleccionado');
        }

        actualizarSeleccionados();
      };
    });

    document.querySelectorAll('.tik-item.destacado').forEach(item => {
      const tik = item.dataset.tik;
      const id = item.dataset.id;
      const comboBase = `${tik} | ${id}`;
      if (!seleccionados.find(x => x.base === comboBase)) {
        const eng = asignarIngeniero();
        seleccionados.push({ base: comboBase, text: eng ? comboBase + " " + eng : comboBase, auto: true });
        item.classList.add('seleccionado');
      }
    });
    actualizarSeleccionados();
  }

  function actualizarSeleccionados(){
    selectedList.innerHTML = seleccionados.map(item => {
      if (item.auto) {
        return `<span style="color:#2ecc71; font-weight:600;">${item.text}</span>`;
      } else {
        return `<span style="color:#3498db; font-weight:600;">${item.text}</span>`;
      }
    }).join("\n");
    countEl.textContent = seleccionados.length;
  }

  function renderSalida(agrupado){
    const keys = Object.keys(agrupado).sort();
    if (keys.length === 0){
      outputEl.innerHTML = '<div class="muted">Sin registros.</div>';
      return;
    }
    outputEl.innerHTML = keys.map(id => {
      return `<div class="group" data-id="${id}"><h3>ID: ${id}</h3><div class="dropzone">${agruparYMarcar(agrupado[id])}</div></div>`;
    }).join('');

    activarClickMover();
  }

  // Eventos
  processBtn.addEventListener('click', () => {
    const registros = parseExcelText(dataInput.value);
    const agrupado = agruparYOrdenar(registros);
    seleccionados = [];
    engineerIndex = 0; // reset ciclo
    renderSalida(agrupado);
  });

  clearBtn.addEventListener('click', () => {
    dataInput.value = '';
    outputEl.innerHTML = '';
    seleccionados = [];
    actualizarSeleccionados();
  });

  toggleOrdenBtn.addEventListener('click', () => {
    ordenDesc = !ordenDesc;
    localStorage.setItem('ordenDesc', ordenDesc);
    actualizarBotonOrden();
    if (dataInput.value.trim() !== '') {
      const registros = parseExcelText(dataInput.value);
      const agrupado = agruparYOrdenar(registros);
      seleccionados = [];
      engineerIndex = 0;
      renderSalida(agrupado);
    }
  });

  copyBtn.addEventListener('click', () => {
    if (seleccionados.length > 0){
      navigator.clipboard.writeText(seleccionados.map(x => x.text).join("\n"));
      alert("Seleccionados copiados al portapapeles ✅");
    } else {
      alert("No hay TIK seleccionados");
    }
  });

  actualizarBotonOrden();
}


// ========================
// TICKET
// ========================
const Ticket = {
  textos: {
    espanol: `Estimado cliente,\n\nHemos registrado su solicitud bajo el código TTT y nuestro equipo ya está trabajando en ella. Si dispone de información adicional que pueda agilizar la gestión, le agradeceremos que nos la comparta.\n\nRecuerde que puede consultar el estado de su solicitud en nuestro portal web. Si no cuenta con credenciales, puede solicitarlas a través de este medio.\n\nQuedamos atentos.`,
    ingles: `Dear customer,\n\nWe have registered your request under the code TTT and our team is already working on it. If you have any additional information that may help expedite the process, we would appreciate you sharing it with us.\n\nPlease remember that you can check the status of your request on our website. If you do not have login credentials, you can request them through this channel.\n\nWe remain at your disposal.`,
    portugues: `Prezado cliente,\n\nRegistramos sua solicitação com o código TTT e nossa equipe já está trabalhando nela. Se você tiver informações adicionais que possam agilizar o processo, agradecemos se puder compartilhá-las conosco.\n\nLembre-se de que você pode acompanhar o status da sua solicitação em nosso portal. Caso não tenha credenciais de acesso, pode solicitá-las por este canal.\n\nPermanecemos à disposição.`
  },

  init() {
    const container = document.querySelector(".ticket-container");
    if (!container) return;

    const ticketInput = container.querySelector("#ticket");
    const idiomaSelect = container.querySelector("#idioma");
    const mensajeDiv = container.querySelector("#mensaje");
    const generarBtn = container.querySelector("#generarBtn");
    const copiarBtn = container.querySelector("#copiarBtn");
    const borrarBtn = container.querySelector("#borrarBtn");

    generarBtn.addEventListener("click", () => {
      const ticket = ticketInput.value.trim();
      const idioma = idiomaSelect.value;

      if (!ticket || !idioma) {
        alert("Ingrese ticket e idioma");
        return;
      }

      mensajeDiv.textContent = this.textos[idioma].replace(/TTT/g, ticket);
    });

    copiarBtn.addEventListener("click", () => {
      if (!mensajeDiv.textContent) return;
      navigator.clipboard.writeText(mensajeDiv.textContent)
        .then(() => alert("Texto copiado 📋"))
        .catch(console.error);
    });

    borrarBtn.addEventListener("click", () => {
      ticketInput.value = "";
      idiomaSelect.value = "";
      mensajeDiv.textContent = "";
    });
  }
};




// ========================
// VIPS
// ========================


// ===================== LOADER SPA =====================
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".navbar a");
  const content = document.getElementById("content");

  // Función para cargar secciones desde /pages
  async function loadSection(pageFile) {
    try {
      const res = await fetch(`pages/${pageFile}`);
      const html = await res.text();
      content.innerHTML = html;

      // Detectar qué sección se cargó y ejecutar su init
      const name = pageFile.replace(".html", "");
      if (name === "vips") initVips();
      if (name === "accesos") Accesos.init?.();
      if (name === "masivos") initMasivos?.();
      if (name === "ticket") Ticket.init?.();
    } catch (err) {
      content.innerHTML = "<p>Error cargando sección</p>";
      console.error("Error en loadSection:", err);
    }
  }

  // Navbar clicks → carga dinámica
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const pageFile = link.dataset.page; // ej: "vips.html"
      if (pageFile) loadSection(pageFile);
    });
  });

  // Cargar sección por defecto (ejemplo: ticket)
  loadSection("ticket.html");
});

// ===================== INIT VIPS =====================
function initVips() {
  const vipsInput = document.getElementById("vips-input");
  const vipsPreview = document.getElementById("vips-preview");
  const vipsTabla = document.getElementById("vips-tabla");
  const btnVipsLoad = document.getElementById("btn-vips-load");
  const btnVipsClear = document.getElementById("btn-vips-clear");
  const btnVipsCopiar = document.getElementById("btn-vips-copiar");

  if (!vipsInput || !vipsPreview || !vipsTabla) {
    console.warn("initVips: elementos no encontrados");
    return;
  }

  // Vista previa en tiempo real
  vipsInput.addEventListener("input", () => {
    const valores = vipsInput.value.trim().split(/\t|,|\n/).map(v => v.trim());
    const celdas = vipsPreview.querySelectorAll(".valor-celda");
    celdas.forEach((celda, i) => celda.textContent = valores[i] || "");
  });

  // Botón: Llenar tabla
  btnVipsLoad.addEventListener("click", () => {
    const celdasPreview = vipsPreview.querySelectorAll(".valor-celda");
    const filas = vipsTabla.querySelectorAll("tr");
    filas.forEach((fila, i) => {
      const celdaDato = fila.querySelector("td");
      if (celdaDato) celdaDato.textContent = celdasPreview[i]?.textContent || "";
    });
  });

  // Botón: Borrar todo
  btnVipsClear.addEventListener("click", () => {
    vipsInput.value = "";
    vipsPreview.querySelectorAll(".valor-celda").forEach(c => c.textContent = "");
    vipsTabla.querySelectorAll("td").forEach(td => td.textContent = "");
  });

  // Botón: Copiar recuadro VIPS completo como imagen + ticket como texto
  btnVipsCopiar.addEventListener("click", async () => {
    const ticket = vipsPreview.querySelector(".valor-celda")?.textContent || "N/A";
    const container = document.querySelector("#vips-tabla"); // 👈 capturamos TODO el recuadro VIPS

    try {
      await new Promise(r => setTimeout(r, 100)); // opcional: esperar render

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff"
      });

      canvas.toBlob(async (blob) => {
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            // 🔑 Copiar imagen + texto en un solo paso
            const blobText = new Blob([`No. de Ticket: ${ticket}`], { type: "text/plain" });

            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
                "text/plain": blobText
              })
            ]);

            alert("✅ Copiado: recuadro VIPS como imagen + ticket como texto.");
          } catch (err) {
            console.error("Error copiando:", err);
            alert("❌ No se pudo copiar. Descargando...");
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "vips.png";
            link.click();
            navigator.clipboard.writeText(`Ticket: ${ticket}`);
          }
        } else {
          // Fallback → descarga + copiar ticket
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "vips.png";
          link.click();
          navigator.clipboard.writeText(`Ticket: ${ticket}`);
          alert("⚠️ Imagen descargada (texto copiado al portapapeles).");
        }
      }, "image/png");

    } catch (err) {
      console.error("Error generando imagen:", err);
      alert("❌ No se pudo generar la imagen.");
    }
  });

  console.log("initVips ✅ inicializado");
}



// ===================== INIT MANUALES =====================
function initManuales() {
  const lista = document.getElementById("lista-manuales");
  const buscador = document.getElementById("buscador-manuales");
  const visorContainer = document.getElementById("visor-container");
  const visorPdf = document.getElementById("visor-pdf");

  if (!lista) return; // Si no estamos en la página de manuales, no hace nada

  // Cargar índice de manuales desde JSON
  fetch("manuales/manuales.json")
    .then(res => res.json())
    .then(data => {
      renderLista(data);

      // Filtro de búsqueda
      buscador.addEventListener("input", () => {
        const q = buscador.value.toLowerCase();
        const filtrados = data.filter(m => m.nombre.toLowerCase().includes(q));
        renderLista(filtrados);
      });
    })
    .catch(err => {
      lista.innerHTML = "<li>⚠️ Error cargando manuales</li>";
      console.error("Error cargando manuales:", err);
    });

  // Renderizar lista de manuales
  function renderLista(items) {
    lista.innerHTML = "";
    if (items.length === 0) {
      lista.innerHTML = "<li>❌ No se encontraron manuales</li>";
      return;
    }
    items.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${m.nombre}</span>
        <div class="acciones">
          <a href="manuales/${m.archivo}" download>⬇️ Descargar</a>
          <button class="btn-ver" data-archivo="${m.archivo}">👁️ Ver</button>
        </div>
      `;
      lista.appendChild(li);
    });

    // Eventos para "Ver"
    document.querySelectorAll(".btn-ver").forEach(btn => {
      btn.addEventListener("click", () => {
        const archivo = btn.dataset.archivo;
        if (archivo.toLowerCase().endsWith(".pdf")) {
          visorContainer.style.display = "block";
          visorPdf.src = `manuales/${archivo}`;
          visorPdf.focus();
        } else {
          // Para DOCX, TXT u otros → abrir en pestaña nueva
          window.open(`manuales/${archivo}`, "_blank");
        }
      });
    });
  }

  console.log("📘 initManuales ✅ inicializado");
}



// ===================== SCRIPT =====================
// Esta función inicializa toda la lógica de la sección "scripts"
function setupScriptsJS() {
  const optionCards = document.querySelectorAll(".option-card");
  const output = document.getElementById("scriptOutput");
  const copyBtn = document.getElementById("copyBtn");

  if (!output || !copyBtn || optionCards.length === 0) {
    console.warn("⚠️ No se encontraron los elementos necesarios en la página.");
    return;
  }

  const textos = {
    torre: `<p>Estimado cliente, buen día.</p>
<p>Le informamos que su solicitud ha sido escalada al personal de mantenimiento...</p>`,
    redComp: `<p>Estimado cliente, buen día.</p>
<p>Nos permitimos informar que según nuestra base de datos el servicio corresponde a RED COMPLEMENTARIA...</p>`,
    solicitarId: `<p>Estimado cliente,</p>
<p>Solicitamos su amable apoyo nos pueda brindar mayor información...</p>`,    
      validarId: `<p>Estimado cliente, agradecemos su comunicación.</p>
<p>Le informamos que, al validar en nuestro sistema, hemos encontrado que el ID IDIDIDID no se registra en nuestro sistema. Por favor, solicitamos que verifiquen que el ID del servicio sea el correcto o un ticket antiguo, para así proceder con la apertura de ticket y resolución del mismo. Si no conoce el Id, favor avocarse con el área comercial encargados de brindar dicha información.</p>`,
      rfo: `<p>Estimado cliente,</p>
<p>En seguimiento del caso, le informamos que se está solicitando el RFO al área encargada para poder compartírselos, tenga en cuenta que se tiene de 48 a 72 horas hábiles para hacer entrega del mismo.</p>
<p>Quedamos pendientes a sus comentarios,</p>`,
      baja: `<p>Estimado cliente, agradecemos su comunicación.</p>
<p>Le informamos que, al validar en nuestro sistema, hemos encontrado que el ID IDIDIDID está en estado Cancelado. Por favor, solicitamos que verifiquen que el ID sea el correcto o que se pongan en contacto con el área comercial.</p>`,
      construccion: `<p>Estimado cliente, agradecemos su comunicación.</p>
<p>Al validar en nuestro sistema, hemos detectado que el ID IDIDIDIDID actualmente se encuentra en estado de construcción. Favor ponerse en contacto con el Project Manager para obtener más información sobre el enlace y validar el estado del servicio. Puede comunicarse directamente a través del correo CCCCCCCCCC.</p>`,
      adm: `<p>Estimado cliente,</p>
<p>Le deseamos un excelente día,</p>
<p>Solicitamos por favor dirigirse directamente al área Comercial o a su Project Manager designado. Ellos son los responsables de este tipo de solicitudes y podrán brindarle la asistencia adecuada y la información necesaria.</p>
<p>Procederemos con el cierre del ticket.</p>
<p>Quedamos a su disposición para cualquier otra solicitud o consulta adicional.</p>`,
      graficas: `<p>Estimado cliente, agradecemos su comunicación.</p>
<p>En seguimiento a su petición, le informamos que hemos creado las gráficas de consumo correspondientes a . Adjunto encontrará el archivo solicitado.</p>
<p>Quedamos atentos a sus comentarios.</p>`,
      operatividad: `<p>Estimado cliente, buen día.</p>
<p>Solicitamos su apoyo validando el estado actual del servicio reportado y, en caso de que se encuentre operativo, por favor indicarnos si podemos proceder con el cierre de ticket.</p>
<p>Quedamos atentos.</p>`,
      descarte: `<p>Estimado IFX, buen día.</p>
<p>En seguimiento a su solicitud, le informamos que, al validar la información suministrada, no encontramos descarte fotográfico del equipo. Requerimos de su colaboración para enviarnos el descarte fotográfico para poder escalar con el área correspondiente.</p>`,
      duplicado: `<p>Estimado cliente. Buen día,</p>
<p>Se está llevando a cabo la revisión del enlace reportado con el siguiente ticket xxxx, le estaremos brindando los avances a la brevedad posible.</p>
<p>Procederemos a cerrar el ticket correspondiente. Sin embargo, quedamos a su disposición para cualquier otra solicitud o consulta adicional.</p>`,
      accesos: `<p>Estimado cliente, buen día.</p>
<p>En seguimiento a su petición, le informamos que los accesos han sido autorizados. A continuación, encontrará la información correspondiente:</p>`,
      credenciales: `<p>Estimado cliente, agradecemos su comunicación.</p>
<p>Hemos validado en nuestro sistema y su empresa ya cuenta con credenciales para generar el reporte de su incidencia a través del portal web. Para acceder a nuestro portal, por favor, visite el enlace:</p>
<p>👉 <a href="https://gestionticketing.ufinet.com/auth" target="_blank">Acceda aquí al portal</a></p>
<p>Las credenciales asignadas son multiusuario:<br>Correo electrónico:<br>Contraseña:</p>
<p>Para facilitar su uso, puede consultar nuestros videos tutoriales aquí:<br>
🎥 <a href="https://www.youtube.com/playlist?list=PLxXmjSUZ9n3ZG4hyG-0ZVVqXF_ngyvn2f" target="_blank">Ver tutoriales en YouTube</a></p>
<p>Queremos asegurarnos de que su experiencia con nosotros sea lo más satisfactoria posible.</p>`,
      crearCredenciales: `<p>Estimado cliente, cordial saludo.</p>
<p>Agradecemos su comunicación y queremos informarle que hemos recibido su solicitud. Para llevar a cabo las configuraciones necesarias, requeriremos un plazo de 72 horas, durante el cual realizaremos todo el proceso de gestión de acceso al portal web.</p>
<p>Cualquier inquietud, puede responder a través de este correo y/o comunicarse a nuestras líneas de atención y con gusto lo atenderemos.</p>`,
      solicitaCredenciales: `<p>Buena tarde estimados,</p>
<p>Agradecemos su comunicación y queremos informarle que hemos recibido su solicitud. Para llevar a cabo las configuraciones necesarias, requeriremos un plazo de 72 horas, durante el cual realizaremos todo el proceso de gestión de acceso al portal web, pero antes se requiere la siguiente información para seguir con el proceso:</p>
<p>ID de servicio: (Puede ser cualquiera)<br>
Nombre de la empresa:<br>
Razón Social:<br>
Correo electrónico:<br>
Teléfono:<br>
Nombre del solicitante:</p>
<p>Cualquier inquietud, puede respondernos a través de este correo y/o comunicarse a nuestras líneas de atención y con gusto lo atenderemos.</p>`,
      cerrado: `<p>Estimado cliente,</p>
<p>Cordial saludo,</p>
<p>Actualmente el ticket TTTTTT se encuentra cerrado de nuestra parte.</p>
<p>Si presenta algún tipo de afectación o novedad en el servicio, por favor indicarnos el tipo de falla y los debidos descartes para proceder con la creación de un nuevo caso.</p>
<p>Quedamos atentos a los comentarios.</p>`,
      info: `<p>Estimado cliente,</p>
<p>Cordial saludo,</p>
<p>Para proceder con la creación del caso y garantizar una gestión adecuada, agradecemos nos indique el motivo específico por el cual se requiere abrir esta solicitud.</p>
<p>Quedamos atentos a su amable confirmación para continuar con el debido proceso.</p>`,
      panama: `<p>Buenos días/tardes/noches a todos,</p>
<p>Estimado cliente, gracias por su comunicación, procederemos a gestionar su solicitud y en breve estaremos informándole el resultado de la misma.</p>
<p>Seguimos en comunicación.</p>`,
      reporte: `<p>Estimados, buena tarde,</p>
<p>Notificamos que para la siguiente solicitud, requerimos de los siguientes datos para proceder con la revisión de lo reportado:</p>
<p>Descripción de la solicitud:<br>Fecha:<br>Nombre:<br>Dirección:<br>Contacto:<br>País:<br>Ciudad:</p>
<p>Y confirmarnos si realiza la solicitud como cliente o no cliente, quedamos atentos a la respuesta para proceder con lo solicitado.</p>`,
      suspendido: `<p>Estimado cliente, agradecemos su comunicación.</p>
<p>Al validar en nuestro sistema, hemos detectado que el ID IDIDIDIDID actualmente se encuentra en estado Suspendido. Favor ponerse en contacto con el área de Cartera para obtener más información sobre el enlace y validar el estado del servicio. Puede comunicarse directamente por medio de las líneas telefónicas o por vía correo electrónico, que se encuentra en el archivo adjunto.</p>`
  };

// Manejo de clic en las tarjetas
  optionCards.forEach(card => {
    card.addEventListener("click", () => {
      optionCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const valor = card.getAttribute("data-value");
      output.innerHTML = textos[valor] || "<p>Texto no definido.</p>";
    });
  });

  // Copiar al portapapeles
  copyBtn.addEventListener("click", () => {
    const tempText = document.createElement("textarea");
    tempText.value = output.textContent;
    document.body.appendChild(tempText);
    tempText.select();
    document.execCommand("copy");
    document.body.removeChild(tempText);
    alert("Texto copiado al portapapeles ✅");
  });
}

// 👇 Alias para compatibilidad (si en tu HTML aún llamas initScripts)
window.initScripts = setupScriptsJS;

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  setupScriptsJS();
});
