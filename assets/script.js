// =====================================================
// INTRANET CORPORATIVA - SCRIPT PRINCIPAL OPTIMIZADO
// =====================================================

// ==================== INICIALIZACIÓN PRINCIPAL ====================
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initThemeToggle();
  loadInitialPage();
});

// Inicializar aplicación
function initApp() {
  const links = document.querySelectorAll(".navbar a");
  const content = document.getElementById("content");

  // Manejar navegación
  links.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      await loadPage(page, content);
    });
  });
}

// Cargar página dinámica
async function loadPage(pageFile, contentElement) {
  try {
    const response = await fetch(`pages/${pageFile}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    contentElement.innerHTML = html;

    // Inicializar módulo correspondiente
    const moduleName = pageFile.replace(".html", "");
    initModule(moduleName);

  } catch (error) {
    contentElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>⚠️ Error al cargar la página</h2>
        <p>${error.message}</p>
      </div>
    `;
    console.error("Error cargando página:", error);
  }
}

// Mapear módulos a sus funciones de inicialización
function initModule(moduleName) {
  const modules = {
    accesos: () => Accesos.init(),
    masivos: () => initMasivos(),
    ticket: () => Ticket.init(),
    vips: () => initVips(),
    scripts: () => setupScriptsJS(),
    manuales: () => initManuales(),
    escalacion: () => initEscalacion()
  };

  if (modules[moduleName]) {
    modules[moduleName]();
    console.log(`✅ Módulo '${moduleName}' inicializado`);
  }
}

// Cargar página inicial
function loadInitialPage() {
  const content = document.getElementById("content");
  loadPage("ticket.html", content);
}

// ==================== THEME TOGGLE ====================
function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  
  // Cargar preferencia guardada
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  // Toggle entre dark/light
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

// ==================== MÓDULO: ACCESOS ====================
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
    if (!texto) return;
    
    texto.select();
    texto.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(texto.value)
      .then(() => this.mostrarTooltip('✅ Copiado al portapapeles', texto))
      .catch(err => console.error('Error copiando:', err));
  },

  actualizarRightPanel() {
    const campos = ['para', 'cc', 'asunto', 'ssee', 'horario', 'personal'];
    
    campos.forEach(id => {
      let elemRight = document.getElementById(id + 'Right');
      if (elemRight) {
        elemRight.style.opacity = 0;
        
        setTimeout(() => {
          if (id === 'horario') {
            const hi = document.getElementById('horaInicio')?.value || "--:--";
            const hf = document.getElementById('horaFin')?.value || "--:--";
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
    ['asunto', 'ssee', 'horaInicio', 'horaFin', 'personal', 'correoGenerado']
      .forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
      });
    this.actualizarRightPanel();
  },

  generarCorreo() {
    const ssee = document.getElementById('ssee')?.value.trim();
    const inicio = document.getElementById('horaInicio')?.value || "--:--";
    const fin = document.getElementById('horaFin')?.value || "--:--";
    const personal = document.getElementById('personal')?.value.trim();
    const fecha = new Date().toLocaleDateString('es-ES');

    if (!ssee || !personal) {
      alert("Por favor completa SSEE y Listado de Personal");
      return;
    }

    const asunto = `INGRESO EMERGENTE 0001 SSEE ${ssee} - ${fecha}`;
    const asuntoElem = document.getElementById('asunto');
    if (asuntoElem) asuntoElem.value = asunto;

    const correo = `Estimados,\n\nPor este medio solicitamos autorización de acceso a Subestación ${ssee} en el horario de ${inicio} a ${fin} horas, para realizar mediciones reflectométricas por corte de fibra reportado.\n\nListado de personal:\n${personal}\n\nQuedamos atentos a sus comentarios.`;
    
    const correoElem = document.getElementById('correoGenerado');
    if (correoElem) {
      correoElem.value = correo;
      this.copiarTexto('correoGenerado');
    }

    this.actualizarRightPanel();
  },

  init() {
    const campos = ['para', 'cc', 'ssee', 'horaInicio', 'horaFin', 'personal'];
    
    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.actualizarRightPanel());
    });

    this.actualizarRightPanel();
    console.log("✅ Módulo Accesos inicializado");
  }
};

// ==================== MÓDULO: MASIVOS ====================
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

  if (!dataInput || !processBtn) {
    console.warn("⚠️ Elementos del módulo Masivos no encontrados");
    return;
  }

  let ordenDesc = localStorage.getItem('ordenDesc') === null ? true : localStorage.getItem('ordenDesc') === 'true';
  let seleccionados = [];
  let engineerIndex = 0;

  function actualizarBotonOrden() {
    toggleOrdenBtn.textContent = ordenDesc ? 'Orden: Descendente ⬇️' : 'Orden: Ascendente ⬆️';
  }

  function parseExcelText(text) {
    const lines = text.trim().split(/\n|\r/).filter(l => l.trim() !== '');
    return lines.map(line => {
      const parts = line.split(/\t|,/).map(p => p.trim());
      return { tik: parts[0] || '', id: parts[1] || '', fecha: parts[2] || '' };
    });
  }

  function parseFecha(f) {
    if (!f) return 0;
    const ts = Date.parse(f);
    return isNaN(ts) ? 0 : ts;
  }

  function agruparYOrdenar(registros) {
    const agrupado = {};
    registros.forEach(r => {
      const id = (r.id || '').toString();
      if (!agrupado[id]) agrupado[id] = [];
      agrupado[id].push(r);
    });

    Object.keys(agrupado).forEach(id => {
      agrupado[id].sort((a, b) => 
        ordenDesc ? parseFecha(b.fecha) - parseFecha(a.fecha) : parseFecha(a.fecha) - parseFecha(b.fecha)
      );
    });

    return agrupado;
  }

  function agruparYMarcar(lista) {
    return lista.map((item, idx) => {
      const clase = idx === 0 ? 'tik-item destacado' : 'tik-item';
      return `<div class="${clase}" data-tik="${item.tik}" data-id="${item.id}" data-fecha="${item.fecha}">${item.tik} | ${item.id} | ${item.fecha}</div>`;
    }).join('');
  }

  function obtenerIngenieros() {
    return engineersInput.value.trim().split(/\n/).filter(x => x.trim() !== '');
  }

  function asignarIngeniero() {
    const engineers = obtenerIngenieros();
    if (engineers.length === 0) return "";
    const eng = engineers[engineerIndex % engineers.length];
    engineerIndex++;
    return eng;
  }

  function activarClickMover() {
    const items = document.querySelectorAll('.tik-item');

    items.forEach(item => {
      item.onclick = () => {
        const tik = item.dataset.tik;
        const id = item.dataset.id;
        const comboBase = `${tik} | ${id}`;
        const existente = seleccionados.find(x => x.base === comboBase);

        if (existente) {
          seleccionados = seleccionados.filter(x => x.base !== comboBase);
          item.classList.remove('seleccionado');
        } else {
          const eng = asignarIngeniero();
          seleccionados.push({ 
            base: comboBase, 
            text: eng ? comboBase + " " + eng : comboBase, 
            auto: false 
          });
          item.classList.add('seleccionado');
        }

        actualizarSeleccionados();
      };
    });

    // Auto-seleccionar destacados
    document.querySelectorAll('.tik-item.destacado').forEach(item => {
      const tik = item.dataset.tik;
      const id = item.dataset.id;
      const comboBase = `${tik} | ${id}`;
      
      if (!seleccionados.find(x => x.base === comboBase)) {
        const eng = asignarIngeniero();
        seleccionados.push({ 
          base: comboBase, 
          text: eng ? comboBase + " " + eng : comboBase, 
          auto: true 
        });
        item.classList.add('seleccionado');
      }
    });

    actualizarSeleccionados();
  }

  function actualizarSeleccionados() {
    selectedList.innerHTML = seleccionados.map(item => {
      const color = item.auto ? '#2ecc71' : '#3498db';
      return `<span style="color:${color}; font-weight:600;">${item.text}</span>`;
    }).join("\n");
    countEl.textContent = seleccionados.length;
  }

  function renderSalida(agrupado) {
    const keys = Object.keys(agrupado).sort();
    
    if (keys.length === 0) {
      outputEl.innerHTML = '<div class="muted">Sin registros.</div>';
      return;
    }

    outputEl.innerHTML = keys.map(id => {
      return `<div class="group" data-id="${id}">
        <h3>ID: ${id}</h3>
        <div class="dropzone">${agruparYMarcar(agrupado[id])}</div>
      </div>`;
    }).join('');

    activarClickMover();
  }

  // Eventos
  processBtn.addEventListener('click', () => {
    const registros = parseExcelText(dataInput.value);
    const agrupado = agruparYOrdenar(registros);
    seleccionados = [];
    engineerIndex = 0;
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
    if (seleccionados.length > 0) {
      navigator.clipboard.writeText(seleccionados.map(x => x.text).join("\n"))
        .then(() => alert("Seleccionados copiados al portapapeles ✅"))
        .catch(err => console.error("Error copiando:", err));
    } else {
      alert("No hay TIK seleccionados");
    }
  });

  actualizarBotonOrden();
  console.log("✅ Módulo Masivos inicializado");
}

// ==================== MÓDULO: TICKET ====================
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

    if (!ticketInput || !generarBtn) {
      console.warn("⚠️ Elementos del módulo Ticket no encontrados");
      return;
    }

    generarBtn.addEventListener("click", () => {
      const ticket = ticketInput.value.trim();
      const idioma = idiomaSelect.value;

      if (!ticket || !idioma) {
        alert("Por favor ingrese ticket e idioma");
        return;
      }

      mensajeDiv.textContent = this.textos[idioma].replace(/TTT/g, ticket);
    });

    copiarBtn.addEventListener("click", () => {
      if (!mensajeDiv.textContent) {
        alert("Primero genera un mensaje");
        return;
      }
      
      navigator.clipboard.writeText(mensajeDiv.textContent)
        .then(() => alert("Texto copiado 📋"))
        .catch(err => console.error("Error copiando:", err));
    });

    borrarBtn.addEventListener("click", () => {
      ticketInput.value = "";
      idiomaSelect.value = "";
      mensajeDiv.textContent = "";
    });

    console.log("✅ Módulo Ticket inicializado");
  }
};

// ==================== MÓDULO: VIPS ====================
function initVips() {
  const vipsInput = document.getElementById("vips-input");
  const vipsPreview = document.getElementById("vips-preview");
  const vipsTabla = document.getElementById("vips-tabla");
  const btnVipsLoad = document.getElementById("btn-vips-load");
  const btnVipsClear = document.getElementById("btn-vips-clear");
  const btnVipsCopiar = document.getElementById("btn-vips-copiar");

  if (!vipsInput || !vipsPreview || !vipsTabla) {
    console.warn("⚠️ Elementos del módulo VIPs no encontrados");
    return;
  }

  // Vista previa en tiempo real
  vipsInput.addEventListener("input", () => {
    const valores = vipsInput.value.trim().split(/\t|,|\n/).map(v => v.trim());
    const celdas = vipsPreview.querySelectorAll(".valor-celda");
    celdas.forEach((celda, i) => celda.textContent = valores[i] || "");
  });

  // Llenar tabla
  btnVipsLoad.addEventListener("click", () => {
    const celdasPreview = vipsPreview.querySelectorAll(".valor-celda");
    const filas = vipsTabla.querySelectorAll("tr");
    
    filas.forEach((fila, i) => {
      const celdaDato = fila.querySelector("td");
      if (celdaDato) celdaDato.textContent = celdasPreview[i]?.textContent || "";
    });
  });

  // Borrar todo
  btnVipsClear.addEventListener("click", () => {
    vipsInput.value = "";
    vipsPreview.querySelectorAll(".valor-celda").forEach(c => c.textContent = "");
    vipsTabla.querySelectorAll("td").forEach(td => td.textContent = "");
  });

  // Copiar como imagen + texto
  btnVipsCopiar.addEventListener("click", async () => {
    // Validar que html2canvas esté cargado
    if (typeof html2canvas === 'undefined') {
      alert("❌ Error: html2canvas no está disponible");
      return;
    }

    const ticket = vipsPreview.querySelector(".valor-celda")?.textContent || "N/A";
    const container = vipsTabla;

    try {
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff"
      });

      canvas.toBlob(async (blob) => {
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            const blobText = new Blob([`No. de Ticket: ${ticket}`], { type: "text/plain" });

            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
                "text/plain": blobText
              })
            ]);

            alert("✅ Copiado: imagen + texto del ticket");
          } catch (err) {
            console.error("Error copiando:", err);
            fallbackDownload(canvas, ticket);
          }
        } else {
          fallbackDownload(canvas, ticket);
        }
      }, "image/png");

    } catch (err) {
      console.error("Error generando imagen:", err);
      alert("❌ No se pudo generar la imagen");
    }
  });

  function fallbackDownload(canvas, ticket) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "vips.png";
    link.click();
    navigator.clipboard.writeText(`Ticket: ${ticket}`);
    alert("⚠️ Imagen descargada (texto copiado al portapapeles)");
  }

  console.log("✅ Módulo VIPs inicializado");
}

// ==================== MÓDULO: ESCALACIÓN ====================
function initEscalacion() {
  const escalacionInput = document.getElementById("escalacion-input");
  const escalacionPreview = document.getElementById("escalacion-preview");
  const escalacionTabla = document.getElementById("escalacion-tabla");
  const btnEscalacionLoad = document.getElementById("btn-escalacion-load");
  const btnEscalacionClear = document.getElementById("btn-escalacion-clear");
  const btnEscalacionCopiar = document.getElementById("btn-escalacion-copiar");
  const escalacionIdioma = document.getElementById("escalacion-idioma");

  if (!escalacionInput || !escalacionPreview || !escalacionTabla) {
    console.warn("⚠️ Elementos del módulo Escalación no encontrados");
    return;
  }

  // Traducciones
  const traducciones = {
    es: {
      titulo: "Tabla de Escalamiento Fibra Oscura - Red Complementaria / Torre de Control",
      seccion1: "DATOS GENERALES DEL TICKET",
      seccion2: "DATOS TÉCNICOS",
      seccion3: "ESCALACION",
      numeroTicket: "Número de ticket",
      fechaCreacion: "Fecha de creación de ticket",
      origenReporte: "Origen del reporte",
      id: "ID",
      cliente: "Cliente",
      tipoServicio: "Tipo de servicio",
      problemaReportado: "Problema reportado",
      tramos: "Tramos",
      detalles: "Detalles",
      ingenieroSD: "Ingeniero SD",
      ingenieroTDC: "Ingeniero TDC"
    },
    pt: {
      titulo: "Tabela de Escalação Fibra Escura - Rede Complementar / Torre de Controle",
      seccion1: "DADOS GERAIS DO TICKET",
      seccion2: "DADOS TÉCNICOS",
      seccion3: "ESCALAÇAO",
      numeroTicket: "Número do ticket",
      fechaCreacion: "Data de criação do ticket",
      origenReporte: "Origem do relatório",
      id: "ID",
      cliente: "Cliente",
      tipoServicio: "Tipo de serviço",
      problemaReportado: "Problema relatado",
      tramos: "Trechos",
      detalles: "Detalhes",
      ingenieroSD: "Engenheiro SD",
      ingenieroTDC: "Engenheiro TDC"
    }
  };

  // Vista previa en tiempo real
  escalacionInput.addEventListener("input", () => {
    const valores = escalacionInput.value.trim().split(/\t|,|\n/).map(v => v.trim());
    const celdas = escalacionPreview.querySelectorAll(".valor-celda");
    celdas.forEach((celda, i) => celda.textContent = valores[i] || "");
  });

  // Llenar tabla (uniendo tramos automáticamente)
  btnEscalacionLoad.addEventListener("click", () => {
    const celdasPreview = escalacionPreview.querySelectorAll(".valor-celda");
    
    // Extraer valores del preview
    const valores = Array.from(celdasPreview).map(celda => celda.textContent.trim());
    
    // Obtener tramos
    const tramo1 = celdasPreview[7]?.textContent.trim() || "";
    const tramo2 = celdasPreview[8]?.textContent.trim() || "";
    
    // Combinar tramos
    let tramosUnidos = "";
    if (tramo1 && tramo2) {
      tramosUnidos = `${tramo1} - ${tramo2}`;
    } else if (tramo1) {
      tramosUnidos = tramo1;
    } else if (tramo2) {
      tramosUnidos = tramo2;
    }
    
    // Mapeo de valores a campos de la tabla (excepto ingenieros que son selects)
    const mapeo = {
      'ticket': valores[0],      // Número de Ticket
      'fecha': valores[1],       // Fecha de Creación
      'origen': valores[2],      // Origen del Reporte
      'id': valores[3],          // ID
      'cliente': valores[4],     // Cliente
      'servicio': valores[5],    // Tipo de Servicio
      'problema': valores[6],    // Problema Reportado
      'tramos': tramosUnidos,    // Tramos unidos
      'detalles': valores[9]     // Detalles
    };
    
    // Llenar campos de texto
    Object.keys(mapeo).forEach(field => {
      const celda = escalacionTabla.querySelector(`td[data-field="${field}"]`);
      if (celda) {
        celda.textContent = mapeo[field];
      }
    });

    // Llenar selects de ingenieros
    const selectIngSD = document.getElementById('select-ing-sd');
    const selectIngTDC = document.getElementById('select-ing-tdc');
    
    if (selectIngSD && valores[10]) {
      // Buscar si existe en las opciones
      const option = Array.from(selectIngSD.options).find(opt => opt.value === valores[10]);
      if (option) {
        selectIngSD.value = valores[10];
      } else {
        selectIngSD.value = ""; // Si no existe, dejar en "Seleccione una opción"
      }
    }
    
    if (selectIngTDC && valores[11]) {
      const option = Array.from(selectIngTDC.options).find(opt => opt.value === valores[11]);
      if (option) {
        selectIngTDC.value = valores[11];
      } else {
        selectIngTDC.value = "";
      }
    }
  });

  // Borrar todo
  btnEscalacionClear.addEventListener("click", () => {
    escalacionInput.value = "";
    escalacionPreview.querySelectorAll(".valor-celda").forEach(c => c.textContent = "");
    escalacionTabla.querySelectorAll("td").forEach(td => td.textContent = "");
  });

  // Copiar como texto formateado simple con idioma seleccionado
  btnEscalacionCopiar.addEventListener("click", () => {
    const tabla = escalacionTabla;
    const datos = {};
    
    // Extraer datos de campos de texto
    tabla.querySelectorAll('td[data-field]').forEach(td => {
      const field = td.getAttribute('data-field');
      
      // Si es un campo con select, obtener el valor del select
      if (field === 'ing-sd') {
        const select = document.getElementById('select-ing-sd');
        datos[field] = select ? select.value : '';
      } else if (field === 'ing-tdc') {
        const select = document.getElementById('select-ing-tdc');
        datos[field] = select ? select.value : '';
      } else {
        datos[field] = td.textContent.trim();
      }
    });

    // Validar que haya datos
    if (!datos.ticket) {
      alert("⚠️ Primero llena la tabla con datos");
      return;
    }

    // Obtener idioma seleccionado
    const idioma = escalacionIdioma.value;
    const t = traducciones[idioma];

    // Construir el texto formateado simple
    const textoFormateado = `${t.titulo}
=============================================
${t.seccion1}
=============================================
${t.numeroTicket}: ${datos.ticket || ""}
${t.fechaCreacion}: ${datos.fecha || ""}
${t.origenReporte}: ${datos.origen || ""}
${t.id}: ${datos.id || ""}
${t.cliente}: ${datos.cliente || ""}
${t.tipoServicio}: ${datos.servicio || ""}

=============================================
${t.seccion2}
=============================================
${t.problemaReportado}: ${datos.problema || ""}
${t.tramos}: ${datos.tramos || ""}
${t.detalles}: ${datos.detalles || ""}

=============================================
${t.seccion3}
=============================================
${t.ingenieroSD}: ${datos["ing-sd"] || ""}
${t.ingenieroTDC}: ${datos["ing-tdc"] || ""}`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(textoFormateado)
      .then(() => alert(`✅ Tabla de escalamiento copiada al portapapeles (${idioma === 'es' ? 'Español' : 'Português'})`))
      .catch(err => {
        console.error("Error copiando:", err);
        alert("❌ No se pudo copiar el texto");
      });
  });

  console.log("✅ Módulo Escalación inicializado");
}

// ==================== MÓDULO: MANUALES ====================
function initManuales() {
  const lista = document.getElementById("lista-manuales");
  const buscador = document.getElementById("buscador-manuales");
  const visorContainer = document.getElementById("visor-container");
  const visorPdf = document.getElementById("visor-pdf");

  if (!lista) {
    console.warn("⚠️ Elementos del módulo Manuales no encontrados");
    return;
  }

  // Cargar índice de manuales
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

    // Eventos para botón "Ver"
    document.querySelectorAll(".btn-ver").forEach(btn => {
      btn.addEventListener("click", () => {
        const archivo = btn.dataset.archivo;
        
        if (archivo.toLowerCase().endsWith(".pdf")) {
          visorContainer.style.display = "block";
          visorPdf.src = `manuales/${archivo}`;
          visorPdf.focus();
        } else {
          window.open(`manuales/${archivo}`, "_blank");
        }
      });
    });
  }

  console.log("✅ Módulo Manuales inicializado");
}

// ==================== MÓDULO: SCRIPTS ====================
function setupScriptsJS() {
  const optionCards = document.querySelectorAll(".option-card");
  const output = document.getElementById("scriptOutput");
  const copyBtn = document.getElementById("copyBtn");

  if (!output || !copyBtn || optionCards.length === 0) {
    console.warn("⚠️ Elementos del módulo Scripts no encontrados");
    return;
  }

  const textos = {
    torre: `<p>Estimado cliente, buen día.</p><p>Le informamos que su solicitud ha sido escalada al personal de mantenimiento...</p>`,
    redComp: `<p>Estimado cliente, buen día.</p><p>Nos permitimos informar que según nuestra base de datos el servicio corresponde a RED COMPLEMENTARIA...</p>`,
    solicitarId: `<p>Estimado cliente,</p><p>Solicitamos su amable apoyo nos pueda brindar mayor información...</p>`,
    validarId: `<p>Estimado cliente, agradecemos su comunicación.</p><p>Le informamos que, al validar en nuestro sistema, hemos encontrado que el ID IDIDIDID no se registra en nuestro sistema. Por favor, solicitamos que verifiquen que el ID del servicio sea el correcto o un ticket antiguo, para así proceder con la apertura de ticket y resolución del mismo. Si no conoce el Id, favor avocarse con el área comercial encargados de brindar dicha información.</p>`,
    rfo: `<p>Estimado cliente,</p><p>En seguimiento del caso, le informamos que se está solicitando el RFO al área encargada para poder compartírselos, tenga en cuenta que se tiene de 48 a 72 horas hábiles para hacer entrega del mismo.</p><p>Quedamos pendientes a sus comentarios,</p>`,
    baja: `<p>Estimado cliente, agradecemos su comunicación.</p><p>Le informamos que, al validar en nuestro sistema, hemos encontrado que el ID IDIDIDID está en estado Cancelado. Por favor, solicitamos que verifiquen que el ID sea el correcto o que se pongan en contacto con el área comercial.</p>`,
    construccion: `<p>Estimado cliente, agradecemos su comunicación.</p><p>Al validar en nuestro sistema, hemos detectado que el ID IDIDIDIDID actualmente se encuentra en estado de construcción. Favor ponerse en contacto con el Project Manager para obtener más información sobre el enlace y validar el estado del servicio. Puede comunicarse directamente a través del correo CCCCCCCCCC.</p>`,
    adm: `<p>Estimado cliente,</p><p>Le deseamos un excelente día,</p><p>Solicitamos por favor dirigirse directamente al área Comercial o a su Project Manager designado. Ellos son los responsables de este tipo de solicitudes y podrán brindarle la asistencia adecuada y la información necesaria.</p><p>Procederemos con el cierre del ticket.</p><p>Quedamos a su disposición para cualquier otra solicitud o consulta adicional.</p>`,
    graficas: `<p>Estimado cliente, agradecemos su comunicación.</p><p>En seguimiento a su petición, le informamos que hemos creado las gráficas de consumo correspondientes a . Adjunto encontrará el archivo solicitado.</p><p>Quedamos atentos a sus comentarios.</p>`,
    operatividad: `<p>Estimado cliente, buen día.</p><p>Solicitamos su apoyo validando el estado actual del servicio reportado y, en caso de que se encuentre operativo, por favor indicarnos si podemos proceder con el cierre de ticket.</p><p>Quedamos atentos.</p>`,
    descarte: `<p>Estimado IFX, buen día.</p><p>En seguimiento a su solicitud, le informamos que, al validar la información suministrada, no encontramos descarte fotográfico del equipo. Requerimos de su colaboración para enviarnos el descarte fotográfico para poder escalar con el área correspondiente.</p>`,
    duplicado: `<p>Estimado cliente. Buen día,</p><p>Se está llevando a cabo la revisión del enlace reportado con el siguiente ticket xxxx, le estaremos brindando los avances a la brevedad posible.</p><p>Procederemos a cerrar el ticket correspondiente. Sin embargo, quedamos a su disposición para cualquier otra solicitud o consulta adicional.</p>`,
    accesos: `<p>Estimado cliente, buen día.</p><p>En seguimiento a su petición, le informamos que los accesos han sido autorizados. A continuación, encontrará la información correspondiente:</p>`,
    credenciales: `<p>Estimado cliente, agradecemos su comunicación.</p><p>Hemos validado en nuestro sistema y su empresa ya cuenta con credenciales para generar el reporte de su incidencia a través del portal web. Para acceder a nuestro portal, por favor, visite el enlace:</p><p>👉 <a href="https://gestionticketing.ufinet.com/auth" target="_blank">Acceda aquí al portal</a></p><p>Las credenciales asignadas son multiusuario:<br>Correo electrónico:<br>Contraseña:</p><p>Para facilitar su uso, puede consultar nuestros videos tutoriales aquí:<br>🎥 <a href="https://www.youtube.com/playlist?list=PLxXmjSUZ9n3ZG4hyG-0ZVVqXF_ngyvn2f" target="_blank">Ver tutoriales en YouTube</a></p><p>Queremos asegurarnos de que su experiencia con nosotros sea lo más satisfactoria posible.</p>`,
    crearCredenciales: `<p>Estimado cliente, cordial saludo.</p><p>Agradecemos su comunicación y queremos informarle que hemos recibido su solicitud. Para llevar a cabo las configuraciones necesarias, requeriremos un plazo de 72 horas, durante el cual realizaremos todo el proceso de gestión de acceso al portal web.</p><p>Cualquier inquietud, puede responder a través de este correo y/o comunicarse a nuestras líneas de atención y con gusto lo atenderemos.</p>`,
    solicitaCredenciales: `<p>Buena tarde estimados,</p><p>Agradecemos su comunicación y queremos informarle que hemos recibido su solicitud. Para llevar a cabo las configuraciones necesarias, requeriremos un plazo de 72 horas, durante el cual realizaremos todo el proceso de gestión de acceso al portal web, pero antes se requiere la siguiente información para seguir con el proceso:</p><p>ID de servicio: (Puede ser cualquiera)<br>Nombre de la empresa:<br>Razón Social:<br>Correo electrónico:<br>Teléfono:<br>Nombre del solicitante:</p><p>Cualquier inquietud, puede respondernos a través de este correo y/o comunicarse a nuestras líneas de atención y con gusto lo atenderemos.</p>`,
    cerrado: `<p>Estimado cliente,</p><p>Cordial saludo,</p><p>Actualmente el ticket TTTTTT se encuentra cerrado de nuestra parte.</p><p>Si presenta algún tipo de afectación o novedad en el servicio, por favor indicarnos el tipo de falla y los debidos descartes para proceder con la creación de un nuevo caso.</p><p>Quedamos atentos a los comentarios.</p>`,
    info: `<p>Estimado cliente,</p><p>Cordial saludo,</p><p>Para proceder con la creación del caso y garantizar una gestión adecuada, agradecemos nos indique el motivo específico por el cual se requiere abrir esta solicitud.</p><p>Quedamos atentos a su amable confirmación para continuar con el debido proceso.</p>`,
    panama: `<p>Buenos días/tardes/noches a todos,</p><p>Estimado cliente, gracias por su comunicación, procederemos a gestionar su solicitud y en breve estaremos informándole el resultado de la misma.</p><p>Seguimos en comunicación.</p>`,
    reporte: `<p>Estimados, buena tarde,</p><p>Notificamos que para la siguiente solicitud, requerimos de los siguientes datos para proceder con la revisión de lo reportado:</p><p>Descripción de la solicitud:<br>Fecha:<br>Nombre:<br>Dirección:<br>Contacto:<br>País:<br>Ciudad:</p><p>Y confirmarnos si realiza la solicitud como cliente o no cliente, quedamos atentos a la respuesta para proceder con lo solicitado.</p>`,
    suspendido: `<p>Estimado cliente, agradecemos su comunicación.</p><p>Al validar en nuestro sistema, hemos detectado que el ID IDIDIDIDID actualmente se encuentra en estado Suspendido. Favor ponerse en contacto con el área de Cartera para obtener más información sobre el enlace y validar el estado del servicio. Puede comunicarse directamente por medio de las líneas telefónicas o por vía correo electrónico, que se encuentra en el archivo adjunto.</p>`
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

  // Copiar al portapapeles (convierte HTML a texto plano con formato)
  copyBtn.addEventListener("click", () => {
    const textoFormateado = convertirHTMLaTexto(output.innerHTML);
    
    navigator.clipboard.writeText(textoFormateado)
      .then(() => alert("Texto copiado al portapapeles ✅"))
      .catch(() => {
        // Fallback para navegadores antiguos
        const tempText = document.createElement("textarea");
        tempText.value = textoFormateado;
        document.body.appendChild(tempText);
        tempText.select();
        document.execCommand("copy");
        document.body.removeChild(tempText);
        alert("Texto copiado al portapapeles ✅");
      });
  });

  console.log("✅ Módulo Scripts inicializado");
}

// ==================== UTILIDAD: Convertir HTML a texto plano ====================
function convertirHTMLaTexto(html) {
  // Crear un elemento temporal para parsear el HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Reemplazar <p> por saltos de línea
  temp.querySelectorAll('p').forEach(p => {
    p.insertAdjacentText('afterend', '\n\n');
  });
  
  // Reemplazar <br> por saltos de línea
  temp.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n');
  });
  
  // Obtener texto plano
  let texto = temp.textContent || temp.innerText;
  
  // Limpiar múltiples espacios en blanco pero mantener saltos de línea
  texto = texto.replace(/[ \t]+/g, ' '); // Múltiples espacios → un espacio
  texto = texto.replace(/\n\s+\n/g, '\n\n'); // Limpiar líneas vacías con espacios
  texto = texto.trim(); // Eliminar espacios al inicio/final
  
  return texto;
}

// ==================== UTILIDADES GLOBALES ====================
console.log("🚀 Sistema de Intranet cargado correctamente");