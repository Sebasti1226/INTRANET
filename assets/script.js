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
    escalacion: () => initEscalacion(),
    'tipos-reporte': () => initTiposReporte()
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
      return { 
        tik: parts[0] || '', 
        id: parts[1] || '', 
        fecha: parts[2] || '', 
        raw: line 
      };
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
      return `<div class="${clase}" data-tik="${item.tik}" data-id="${item.id}" data-fecha="${item.fecha}" data-raw="${item.raw}">${item.tik} | ${item.id} | ${item.fecha}</div>`;
    }).join('');
  }

  function obtenerIngenieros() {
    return engineersInput.value
      .trim()
      .split(/\n/)
      .filter(x => x.trim() !== '')
      .map(line => {
        const [name, condicion] = line.split('|').map(p => p.trim());
        const user = name.startsWith('@') ? name : '@' + name;
        return { nombre: user, etiqueta: condicion || null };
      });
  }

  function extraerEtiquetaTik(texto) {
    if (/ca[ií]da total/i.test(texto)) return "Caída total";
    if (/degradaci/i.test(texto)) return "Degradaciones";
    if (/sin servicio afectado/i.test(texto)) return "Sin servicio afectado";
    return null;
  }

  function asignarIngeniero(tikTexto) {
    const engineers = obtenerIngenieros();
    if (engineers.length === 0) return "@"; 

    const etiquetaTik = extraerEtiquetaTik(tikTexto);

    if (etiquetaTik) {
      const match = engineers.find(e => e.etiqueta && e.etiqueta.toLowerCase() === etiquetaTik.toLowerCase());
      if (match) return `${match.nombre} (${match.etiqueta})`;
    }

    const libres = engineers.filter(e => !e.etiqueta);
    if (libres.length > 0) {
      const eng = libres[engineerIndex % libres.length];
      engineerIndex++;
      return eng.nombre;
    }

    const eng = engineers[engineerIndex % engineers.length];
    engineerIndex++;
    return eng.etiqueta ? `${eng.nombre} (${eng.etiqueta})` : eng.nombre;
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
          const eng = asignarIngeniero(item.dataset.raw);
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
        const eng = asignarIngeniero(item.dataset.raw);
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
      const texto = seleccionados
        .map(x => x.text.replace(/\s*\([^)]*\)/g, "")) // quitar etiquetas
        .join("\n");
      navigator.clipboard.writeText(texto)
        .then(() => alert("Seleccionados copiados al portapapeles ✅ (sin etiquetas)"))
        .catch(err => console.error("Error copiando:", err));
    } else {
      alert("No hay TIK seleccionados");
    }
  });

  actualizarBotonOrden();
  console.log("✅ Módulo Masivos inicializado");
}


// ==================== MÓDULO: TICKET ====================


// ==================== MÓDULO: TICKET (MEJORADO CON INGENIERO SD) ====================
const Ticket = {
  textos: {
    espanol: `Estimado cliente,

Hemos registrado su solicitud bajo el código TTT y nuestro equipo ya está trabajando en ella. Si dispone de información adicional que pueda agilizar la gestión, le agradeceremos que nos la comparta.

Recuerde que puede consultar el estado de su solicitud en nuestro portal web. Si no cuenta con credenciales, puede solicitarlas a través de este medio.

Quedamos atentos.

Saludos Cordiales,

{INGENIERO}
Customer Care`,

    ingles: `Dear customer,

We have registered your request under the code TTT and our team is already working on it. If you have any additional information that may help expedite the process, we would appreciate you sharing it with us.

Please remember that you can check the status of your request on our website. If you do not have login credentials, you can request them through this channel.

We remain at your disposal.

Best regards,

{INGENIERO}
Customer Care`,

    portugues: `Prezado cliente,

Registramos sua solicitação com o código TTT e nossa equipe já está trabalhando nela. Se você tiver informações adicionais que possam agilizar o processo, agradecemos se puder compartilhá-las conosco.

Lembre-se de que você pode acompanhar o status da sua solicitação em nosso portal. Caso não tenha credenciais de acesso, pode solicitá-las por este canal.

Permanecemos à disposição.

Atenciosamente,

{INGENIERO}
Customer Care`
  },

  init() {
    const container = document.querySelector(".ticket-container");
    if (!container) return;

    const ticketInput = container.querySelector("#ticket");
    const idiomaSelect = container.querySelector("#idioma");
    const ingenieroSelect = container.querySelector("#ingeniero");
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
      const ingeniero = ingenieroSelect.value;

      if (!ticket || !idioma) {
        alert("Por favor ingrese ticket e idioma");
        return;
      }

      // Generar mensaje
      let mensaje = this.textos[idioma].replace(/TTT/g, ticket);

      // Reemplazar el marcador de ingeniero
      if (ingeniero) {
        mensaje = mensaje.replace(/{INGENIERO}/g, ingeniero);
      } else {
        // Si no hay ingeniero seleccionado, eliminar la línea del ingeniero
        mensaje = mensaje.replace(/{INGENIERO}\n/g, "");
      }

      // Mostrar en el div con el ticket en negrilla
      const htmlConFormato = mensaje.replace(
        new RegExp(ticket, 'g'), 
        `<strong>${ticket}</strong>`
      ).replace(/\n/g, '<br>');
      
      mensajeDiv.innerHTML = htmlConFormato;
    });

    copiarBtn.addEventListener("click", async () => {
      if (!mensajeDiv.textContent) {
        alert("Primero genera un mensaje");
        return;
      }

      const ticket = ticketInput.value.trim();
      const texto = mensajeDiv.innerText || mensajeDiv.textContent;

      // Intentar copiar con formato enriquecido (HTML)
      try {
        // Crear HTML con el ticket en negrilla
        const htmlConFormato = texto.replace(
          new RegExp(ticket, 'g'), 
          `<strong>${ticket}</strong>`
        ).replace(/\n/g, '<br>');

        const blobHTML = new Blob([htmlConFormato], { type: 'text/html' });
        const blobText = new Blob([texto], { type: 'text/plain' });

        const clipboardItem = new ClipboardItem({
          'text/html': blobHTML,
          'text/plain': blobText
        });

        await navigator.clipboard.write([clipboardItem]);
        alert("✅ Texto copiado con formato (ticket en negrilla)");
      } catch (err) {
        // Fallback: copiar solo texto plano
        console.warn("No se pudo copiar con formato, usando texto plano:", err);
        navigator.clipboard.writeText(texto)
          .then(() => alert("📋 Texto copiado (sin formato)"))
          .catch(e => console.error("Error copiando:", e));
      }
    });

    borrarBtn.addEventListener("click", () => {
      ticketInput.value = "";
      idiomaSelect.value = "";
      ingenieroSelect.value = "";
      mensajeDiv.textContent = "";
      mensajeDiv.innerHTML = "";
    });

    console.log("✅ Módulo Ticket (con Ingeniero SD) inicializado");
  }
};


// ================= VIPs FINAL CON EDICIÓN + VALIDACIONES =================
function initVips() {

  const configs = [
    // ================= VIP UFINET =================
    {
      name: "VIP UFINET",
      input: "vip-ufinet-input",
      card: "vip-ufinet-card",
      btnLoad: "vip-ufinet-load",
      btnClear: "vip-ufinet-clear",
      btnImage: "vip-ufinet-image",
      ticketField: "vip-ticket",
      fields: [
        "vip-ticket",
        "vip-id",
        "vip-cliente-ufinet",
        "vip-cliente-final",
        "vip-n1",
        "vip-causa",
        "vip-avance",
        "vip-bandwidth"
      ]
    },

    // ================= VIP AMAZON & AT&T =================
    {
      name: "VIP AMAZON & AT&T",
      input: "vip-amazon-input",
      card: "vip-amazon-card",
      btnLoad: "vip-amazon-load",
      btnClear: "vip-amazon-clear",
      btnImage: "vip-amazon-image",
      ticketField: "vip-amz-ticket",
      offnetField: "vip-amz-red", // 👈 campo especial
      fields: [
        "vip-amz-ticket",
        "vip-amz-id",
        "vip-amz-cliente-ufinet",
        "vip-amz-cliente-final",
        "vip-amz-origen",
        "vip-amz-ticket-int",
        "vip-amz-n1",
        "vip-amz-causa",
        "vip-amz-avance",
        "vip-amz-bandwidth",
        "vip-amz-red",
        "vip-amz-proveedor"
      ]
    }
  ];


// FUNCIÓN DETECTAR BANDWIDTH DEL CRM
function normalizarBandwidthCRM(valor) {
  if (!valor) return "";

  // Convertir a número
  const numero = parseFloat(valor);
  if (isNaN(numero)) return valor;

  // Redondear correctamente
  const limpio = Math.round(numero);

  // Convertir a Gbps si aplica
  if (limpio >= 1000) {
    const gbps = limpio / 1000;
    return Number.isInteger(gbps)
      ? `${gbps} Gbps`
      : `${gbps.toFixed(2)} Gbps`;
  }

  // Default Mbps
  return `${limpio} Mbps`;
}


  configs.forEach(cfg => {
    const input = document.getElementById(cfg.input);
    const card = document.getElementById(cfg.card);
    const btnLoad = document.getElementById(cfg.btnLoad);
    const btnClear = document.getElementById(cfg.btnClear);
    const btnImage = document.getElementById(cfg.btnImage);

    if (!input || !card || !btnLoad || !btnClear || !btnImage) {
      console.warn(`⚠️ ${cfg.name} no cargado`);
      return;
    }

    const celdas = card.querySelectorAll("td");

    // ✏️ HABILITAR EDICIÓN
    celdas.forEach(td => td.setAttribute("contenteditable", "true"));

    // 📝 CARGAR DATOS
    btnLoad.onclick = () => {
      const valores = input.value
        .split(/\t|,|\n/)
        .map(v => v.trim());

      cfg.fields.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valores[index] || "";
      });

      // 🤖 VALIDACIÓN RED OFFNET
      if (cfg.offnetField) {
        const offnet = document.getElementById(cfg.offnetField);
        if (offnet && offnet.textContent.trim() === "") {
          offnet.textContent = "NO";
        }
      }
  
      const bwField = document.getElementById("vip-bandwidth");
      if (bwField && bwField.textContent.trim() !== "") {
        bwField.textContent = normalizarBandwidthCRM(bwField.textContent);
      }

      const bwAmazon = document.getElementById("vip-amz-bandwidth");
      if (bwAmazon && bwAmazon.textContent.trim() !== "") {
        bwAmazon.textContent = normalizarBandwidthCRM(bwAmazon.textContent);
      }


    };

    // 🗑️ LIMPIAR
    btnClear.onclick = () => {
      input.value = "";
      celdas.forEach(td => td.textContent = "");
    };

    // 📸 COPIAR IMAGEN + TEXTO
    btnImage.onclick = async () => {
      try {
        const ticket =
          document.getElementById(cfg.ticketField)?.textContent || "SIN_TICKET";

        const canvas = await html2canvas(card, {
          scale: 3,
          backgroundColor: "#ffffff"
        });

        const blobImagen = await new Promise(r => canvas.toBlob(r));

        const texto = `No. de Ticket: ${ticket}`;

        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blobImagen,
            "text/plain": new Blob([texto], { type: "text/plain" })
          })
        ]);

        alert(`✅ Copiado correctamente\n${texto}`);
      } catch (error) {
        console.error("❌ Error al copiar VIP:", error);
        alert("❌ No se pudo copiar la información");
      }
    };
  });

  console.log("✅ VIPs con edición + validaciones inicializados");
}


// ==================== MÓDULO: ESCALACIÓN ====================
function initEscalacion() {
  console.log("📄 Inicializando módulo Escalación ajustado...");

  const escalacionInput = document.getElementById("escalacion-input");
  const btnEscalacionLoad = document.getElementById("btn-escalacion-load");
  const btnEscalacionClear = document.getElementById("btn-escalacion-clear");
  const btnEscalacionCopiar = document.getElementById("btn-escalacion-copiar");
  const escalacionIdioma = document.getElementById("escalacion-idioma");

  if (!escalacionInput || !btnEscalacionLoad) {
    console.warn("⚠️ Elementos del módulo Escalación no encontrados");
    return;
  }

  // ==================== TRADUCCIONES ====================
  const traducciones = {
    es: {
      titulo: "Tabla de Escalamiento Fibra Oscura - Red Complementaria / Torre de Control",
      datosGenerales: "DATOS GENERALES",
      datosTecnicos: "DATOS TÉCNICOS",
      escalacion: "ESCALACIÓN",
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
      datosGenerales: "DADOS GERAIS",
      datosTecnicos: "DADOS TÉCNICOS",
      escalacion: "ESCALAÇÃO",
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

  // ==================== LLENAR FORMULARIO ====================
  btnEscalacionLoad.addEventListener("click", () => {
    const valores = escalacionInput.value
      .trim()
      .split(/\t|,|\n/)
      .map(v => v.trim());

    const mapeo = {
      ticket: valores[0] || "",
      id: valores[1] || "",
      fecha: valores[2] || "",
      origen: valores[3] || "",
      cliente: valores[4] || "",
      servicio: valores[5] || "",
      problema: valores[6] || "",
      tramos: valores[7] && valores[8]
        ? `${valores[7]} | ${valores[8]}`
        : valores[7] || valores[8] || "",
      detalles: "",
      "ing-sd": valores[10] || "",
      "ing-tdc": ""
    };

    document.querySelectorAll("[data-field]").forEach(elem => {
      const field = elem.getAttribute("data-field");
      if (!(field in mapeo)) return;

      if (elem.tagName === "SELECT") {
        const opt = Array.from(elem.options).find(o =>
          o.value.toLowerCase() === mapeo[field].toLowerCase()
        );
        elem.value = opt ? opt.value : "";
      } else {
        elem.value = mapeo[field];
      }
    });
  });

  // ==================== LIMPIAR TODO ====================
  btnEscalacionClear.addEventListener("click", () => {
    escalacionInput.value = "";
    document.querySelectorAll("[data-field]").forEach(elem => {
      elem.value = "";
    });
  });

  // ==================== COPIAR DATOS FORMATEADOS ====================
  btnEscalacionCopiar.addEventListener("click", () => {
    const datos = {};

    document.querySelectorAll("#escalacion [data-field]").forEach(el => {
      datos[el.getAttribute("data-field")] = el.value || "";
    });

    if (!datos.ticket) {
      alert("⚠️ Primero llena el formulario");
      return;
    }

    // ---------- CONDICIONALES TIPO SERVICIO ----------
let tipoServicio = datos.servicio || "";

const clienteNormalizado = (datos.cliente || "")
  .toLowerCase()
  .trim();

const textoGlobal = Object.values(datos)
  .join(" ")
  .toLowerCase();

// 1️⃣ PRIORIDAD ALTA – CLIENTES ESPECIALES
if (
  clienteNormalizado.includes("redes y telecomunicaciones") ||
  clienteNormalizado.includes("ifx networks")
) {
  tipoServicio = "Red Complementaria";
}

// 2️⃣ PRIORIDAD MEDIA – PALABRAS CLAVE (solo si no se definió antes)
else if (textoGlobal.includes("accesos")) {
  tipoServicio = "Accesos";
}
else if (textoGlobal.includes("alarma")) {
  tipoServicio = "Alarma IFX";
}
else if (textoGlobal.includes("proactivo")) {
  tipoServicio = "Proactivo O&M";
}


    const idioma = escalacionIdioma?.value || "es";
    const t = traducciones[idioma];
    const sep = "=============================================";

    const textoFormateado = `
${t.titulo}
${sep}
              ${t.datosGenerales}
${sep}
${t.numeroTicket}: ${datos.ticket}
${t.fechaCreacion}: ${datos.fecha}
${t.origenReporte}: ${datos.origen}
${t.id}: ${datos.id}
${t.cliente}: ${datos.cliente}
${t.tipoServicio}: ${tipoServicio}
${sep}
              ${t.datosTecnicos}
${sep}
${t.problemaReportado}: ${datos.problema}
${t.tramos}: ${datos.tramos}
${t.detalles}: ${datos.detalles}
${sep}
                ${t.escalacion}
${sep}
${t.ingenieroSD}: ${datos["ing-sd"]}
${t.ingenieroTDC}: ${datos["ing-tdc"]}
`.trim();

    navigator.clipboard.writeText(textoFormateado).then(() => {
      const txt = btnEscalacionCopiar.textContent;
      btnEscalacionCopiar.textContent = "✅ Copiado";
      btnEscalacionCopiar.style.background = "#28a745";

      setTimeout(() => {
        btnEscalacionCopiar.textContent = txt;
        btnEscalacionCopiar.style.background = "";
      }, 2000);
    }).catch(() => {
      alert("❌ No se pudo copiar el texto");
    });
  });

  console.log("✅ Módulo Escalación ajustado correctamente");
}



// ==================== MÓDULO: MANUALES ====================
function initManuales() {
  const lista = document.getElementById("lista-manuales");
  const buscador = document.getElementById("buscador-manuales");
  const visorContainer = document.getElementById("visor-container");
  const btnCerrarVisor = document.getElementById("btn-cerrar-visor");
  const visorTitulo = document.getElementById("visor-titulo");

  if (!lista) {
    console.warn("⚠️ Elementos del módulo Manuales no encontrados");
    return;
  }

  let todosLosManuales = [];

  // Cargar índice de manuales
  fetch("../manuales/manuales.json")
    .then(res => {
      if (!res.ok) throw new Error(`Error cargando manuales: ${res.status}`);
      return res.json();
    })
    .then(data => {
      todosLosManuales = data;
      renderLista(data);

      // Filtro de búsqueda
      buscador.addEventListener("input", () => {
        const q = buscador.value.toLowerCase();
        const filtrados = data.filter(m => m.nombre.toLowerCase().includes(q));
        renderLista(filtrados);
      });
    })
    .catch(err => {
      lista.innerHTML = "<li class='error'>⚠️ Error cargando manuales</li>";
      console.error("Error cargando manuales:", err);
    });

  // Cerrar visor
  btnCerrarVisor.addEventListener("click", () => {
    visorContainer.style.display = "none";
    limpiarVisores();
  });

  function renderLista(items) {
    lista.innerHTML = "";
    
    if (items.length === 0) {
      lista.innerHTML = "<li class='empty'>❌ No se encontraron manuales</li>";
      return;
    }

    items.forEach(m => {
      const li = document.createElement("li");
      const iconoTipo = getIconoTipo(m.tipo);
      li.innerHTML = `
        <div class="manual-info">
          <span class="tipo-icono">${iconoTipo}</span>
          <span class="manual-nombre">${m.nombre}</span>
          <span class="manual-tipo">${m.tipo.toUpperCase()}</span>
        </div>
        <div class="acciones">
          <a href="manuales/${m.archivo}" download class="btn-descargar">⬇️ Descargar</a>
          <button class="btn-ver" data-archivo="${m.archivo}" data-nombre="${m.nombre}" data-tipo="${m.tipo}">👁️ Ver</button>
        </div>
      `;
      lista.appendChild(li);
    });

    // Eventos para botón "Ver"
    document.querySelectorAll(".btn-ver").forEach(btn => {
      btn.addEventListener("click", () => {
        const archivo = btn.dataset.archivo;
        const nombre = btn.dataset.nombre;
        const tipo = btn.dataset.tipo;
        visorTitulo.textContent = `📖 ${nombre}`;
        abrirVisor(archivo, tipo);
      });
    });
  }

  function getIconoTipo(tipo) {
    const iconos = {
      pdf: "📄",
      xlsx: "📊",
      xls: "📊",
      docx: "📝",
      doc: "📝"
    };
    return iconos[tipo] || "📎";
  }

  function abrirVisor(archivo, tipo) {
    limpiarVisores();
    visorContainer.style.display = "block";

    // Convertir a minúsculas para comparar
    const tipoNormalizado = tipo.toLowerCase();

    switch(tipoNormalizado) {
      case "pdf":
        abrirPDF(archivo);
        break;
      case "xlsx":
      case "xls":
        abrirExcel(archivo);
        break;
      case "docx":
      case "doc":
        abrirWord(archivo);
        break;
      default:
        console.warn(`Tipo de archivo no soportado: ${tipo}`);
    }
  }

  function abrirPDF(archivo) {
    const visorPdf = document.getElementById("visor-pdf-wrapper");
    const iframe = document.getElementById("visor-pdf");
    visorPdf.style.display = "block";
    
    // Detectar si es URL externa o ruta relativa
    let url = archivo.startsWith('http') ? archivo : `../manuales/${archivo}`;
    
    // Si es SharePoint, usar proxy CORS
    if (url.includes('sharepoint.com')) {
      url = `https://cors-anywhere.herokuapp.com/${url}`;
    }
    
    iframe.src = url;
  }

  function abrirExcel(archivo) {
    if (typeof XLSX === 'undefined') {
      alert("⚠️ La librería XLSX no está disponible. Descargando...");
      window.location.reload();
      return;
    }

    const visorExcel = document.getElementById("visor-excel-wrapper");
    visorExcel.style.display = "block";

    // Detectar si es URL externa o ruta relativa
    let url = archivo.startsWith('http') ? archivo : `../manuales/${archivo}`;
    
    // Si es SharePoint, usar proxy CORS
    if (url.includes('sharepoint.com')) {
      url = `https://cors-anywhere.herokuapp.com/${url}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(data => {
        try {
          const workbook = XLSX.read(data, { type: 'array' });
          const tabs = document.getElementById("visor-excel-tabs");
          const contenido = document.getElementById("visor-excel-contenido");
          
          tabs.innerHTML = "";
          contenido.innerHTML = "";

          if (workbook.SheetNames.length === 0) {
            contenido.innerHTML = "<p style='color:orange;'>El archivo Excel está vacío</p>";
            return;
          }

          workbook.SheetNames.forEach((sheetName, index) => {
            const tab = document.createElement("button");
            tab.className = index === 0 ? "excel-tab active" : "excel-tab";
            tab.textContent = sheetName;
            tab.addEventListener("click", () => {
              document.querySelectorAll(".excel-tab").forEach(t => t.classList.remove("active"));
              tab.classList.add("active");
              renderSheet(workbook, sheetName, contenido);
            });
            tabs.appendChild(tab);
          });

          // Renderizar primera hoja
          renderSheet(workbook, workbook.SheetNames[0], contenido);
        } catch (parseErr) {
          console.error("Error parseando Excel:", parseErr);
          document.getElementById("visor-excel-contenido").innerHTML = "<p style='color:red;'>Error analizando el archivo Excel</p>";
        }
      })
      .catch(err => {
        console.error("Error cargando Excel:", err);
        document.getElementById("visor-excel-contenido").innerHTML = "<p style='color:red;'>Error cargando archivo Excel: " + err.message + "</p>";
      });
  }

  function renderSheet(workbook, sheetName, contenido) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    let html = "<table class='tabla-excel'><tbody>";
    data.forEach((row, i) => {
      html += "<tr>";
      row.forEach((cell, j) => {
        const tag = i === 0 ? "th" : "td";
        html += `<${tag}>${cell || ""}</${tag}>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    
    contenido.innerHTML = html;
  }

  function abrirWord(archivo) {
    if (typeof mammoth === 'undefined') {
      alert("⚠️ La librería Mammoth no está disponible. Descargando...");
      window.location.reload();
      return;
    }

    const visorWord = document.getElementById("visor-word-wrapper");
    visorWord.style.display = "block";

    // Detectar si es URL externa o ruta relativa
    let url = archivo.startsWith('http') ? archivo : `../manuales/${archivo}`;
    
    // Si es SharePoint, usar proxy CORS
    if (url.includes('sharepoint.com')) {
      url = `https://cors-anywhere.herokuapp.com/${url}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(data => {
        try {
          return mammoth.convertToHtml({ arrayBuffer: data });
        } catch (err) {
          throw new Error("Error al procesar el archivo Word: " + err.message);
        }
      })
      .then(result => {
        const contenido = document.getElementById("visor-word-contenido");
        if (result.value) {
          contenido.innerHTML = result.value;
        } else {
          contenido.innerHTML = "<p style='color:orange;'>El documento Word está vacío o no se pudo procesar</p>";
        }
      })
      .catch(err => {
        console.error("Error cargando Word:", err);
        document.getElementById("visor-word-contenido").innerHTML = "<p style='color:red;'>Error cargando archivo Word: " + err.message + "</p>";
      });
  }

  function limpiarVisores() {
    document.getElementById("visor-pdf-wrapper").style.display = "none";
    document.getElementById("visor-excel-wrapper").style.display = "none";
    document.getElementById("visor-word-wrapper").style.display = "none";
    document.getElementById("visor-pdf").src = "";
  }

  console.log("✅ Módulo Manuales (mejorado) inicializado");
}

// ==================== MÓDULO: SCRIPTS ====================
function setupScriptsJS() {
  const optionCards = document.querySelectorAll(".option-card");
  const output = document.getElementById("scriptOutput");
  const copyBtn = document.getElementById("copyBtn");
  const idiomaSelect = document.getElementById("scripts-idioma");

  if (!output || !copyBtn || optionCards.length === 0) {
    console.warn("⚠️ Elementos del módulo Scripts no encontrados");
    return;
  }

  // Traducciones en 3 idiomas
  const textos = {
    es: {
      torre: `<p>Estimado cliente, buen día.</p><p>Le informamos que su solicitud ha sido escalada al personal de mantenimiento. Tan pronto como tengamos más información sobre el avance, se la haremos saber.</p><p>Le mantendremos informado/a sobre cualquier actualización relevante y nos pondremos en contacto con usted si necesitamos información adicional.</p><p>Agradecemos su comprensión y colaboración.</p><p>Atentamente,</p>`,
      redComp: `<p>Estimado cliente, buen día.</p><p>Nos permitimos informar que según nuestra base de datos el servicio corresponde a RED COMPLEMENTARIA, por lo que es necesario nos compartan la plantilla correctamente diligenciada, la cual se comparte en el siguiente Excel, adicional adjuntar las pruebas realizadas por parte de IFX y registro fotográfico TVR  para poder proceder con la escalación del ticket.</p>`,
      solicitarId: `<p>Estimado cliente,</p><p>Solicitamos su amable apoyo nos pueda brindar mayor información de su requerimiento, ID del servicio o un ticket antiguo, para así proceder con la apertura de ticket y resolución del mismo, si no conoce el Id favor avocarse con el área comercial encargados de brindar dicha información</p>`,
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
    },
    en: {
      torre: `<p>Dear customer, good day.</p><p>We are writing to inform you that your request has been escalated to the maintenance team. We will let you know as soon as we have any updates.</p><p>We will keep you informed of any relevant developments and will contact you if we need any further information.</p><p>Thank you for your understanding and cooperation.</p><p>Sincerely,</p>`,
      redComp: `<p>Dear customer, good day.</p><p>We would like to inform you that according to our database, the service corresponds to the COMPLEMENTARY NETWORK. Therefore, it is necessary that you share the correctly completed template, which is shared in the following Excel file. Additionally, please attach the tests performed by IFX and the TVR photographic record so that we can proceed with escalating the ticket.</p>`,
      solicitarId: `<p>Dear customer,</p><p>We kindly request your support in providing us with more information about your request, such as the service ID or an old ticket, so that we can proceed with opening a new ticket and resolving your issue. If you do not know the ID, please contact the sales department, who are responsible for providing this information.</p>`,
      validarId: `<p>Dear customer, we appreciate your communication.</p><p>We inform you that, after validating in our system, we found that ID IDIDIDID is not registered in our system. Please verify that the service ID is correct or check if it is an old ticket to proceed with opening a new ticket and resolution. If you do not know the ID, please contact the commercial area responsible for providing this information.</p>`,
      rfo: `<p>Dear customer,</p><p>Following up on your case, we inform you that we are requesting the RFO from the responsible area to share it with you. Please note that we have 48 to 72 business hours to deliver it.</p><p>We remain attentive to your comments.</p>`,
      baja: `<p>Dear customer, we appreciate your communication.</p><p>We inform you that, after validating in our system, we found that ID IDIDIDID is in Cancelled status. Please verify that the ID is correct or contact the commercial area.</p>`,
      construccion: `<p>Dear customer, we appreciate your communication.</p><p>After validating in our system, we detected that ID IDIDIDIDID is currently in construction status. Please contact the Project Manager for more information about the link and to validate the service status. You can communicate directly via email CCCCCCCCCC.</p>`,
      adm: `<p>Dear customer,</p><p>We wish you an excellent day.</p><p>We kindly request you to contact the Commercial area or your designated Project Manager. They are responsible for this type of request and will be able to provide you with the appropriate assistance and information.</p><p>We will proceed with ticket closure.</p><p>We remain available for any other request or additional inquiry.</p>`,
      graficas: `<p>Dear customer, we appreciate your communication.</p><p>Following up on your request, we inform you that we have created the consumption graphs corresponding to . You will find the requested file attached.</p><p>We remain attentive to your comments.</p>`,
      operatividad: `<p>Dear customer, good day.</p><p>We request your support in validating the current status of the reported service and, if it is operating, please let us know if we can proceed with ticket closure.</p><p>We remain attentive.</p>`,
      descarte: `<p>Dear IFX, good day.</p><p>Following up on your request, we inform you that, after validating the information provided, we did not find photographic evidence of the equipment. We require your collaboration to send us the photographic evidence so we can escalate to the corresponding area.</p>`,
      duplicado: `<p>Dear customer, good day.</p><p>We are reviewing the reported link with the following ticket xxxx. We will provide updates as soon as possible.</p><p>We will proceed to close the corresponding ticket. However, we remain available for any other request or additional inquiry.</p>`,
      accesos: `<p>Dear customer, good day.</p><p>Following up on your request, we inform you that access has been authorized. Below you will find the corresponding information:</p>`,
      credenciales: `<p>Dear customer, we appreciate your communication.</p><p>We have validated in our system and your company already has credentials to generate your incident report through our web portal. To access our portal, please visit the link:</p><p>👉 <a href="https://gestionticketing.ufinet.com/auth" target="_blank">Access the portal here</a></p><p>The assigned credentials are multi-user:<br>Email:<br>Password:</p><p>To facilitate your use, you can view our tutorial videos here:<br>🎥 <a href="https://www.youtube.com/playlist?list=PLxXmjSUZ9n3ZG4hyG-0ZVVqXF_ngyvn2f" target="_blank">View tutorials on YouTube</a></p><p>We want to ensure that your experience with us is as satisfactory as possible.</p>`,
      crearCredenciales: `<p>Dear customer, greetings.</p><p>We appreciate your communication and want to inform you that we have received your request. To carry out the necessary configurations, we will require 72 hours, during which we will complete the entire access management process for the web portal.</p><p>For any questions, you can reply through this email and/or contact our support lines and we will be happy to assist you.</p>`,
      solicitaCredenciales: `<p>Good afternoon everyone,</p><p>We appreciate your communication and want to inform you that we have received your request. To carry out the necessary configurations, we will require 72 hours, during which we will complete the entire access management process for the web portal. However, we need the following information to proceed:</p><p>Service ID: (Can be any)<br>Company Name:<br>Legal Name:<br>Email:<br>Phone:<br>Requestor Name:</p><p>For any questions, you can reply through this email and/or contact our support lines and we will be happy to assist you.</p>`,
      cerrado: `<p>Dear customer,</p><p>Greetings,</p><p>Currently, ticket TTTTTT is closed on our end.</p><p>If you experience any issues or notice any changes in your service, please let us know the type of failure and the relevant evidence so we can proceed with creating a new case.</p><p>We remain attentive to your comments.</p>`,
      info: `<p>Dear customer,</p><p>Greetings,</p><p>To proceed with case creation and ensure proper management, we kindly request that you specify the reason for which you need to open this request.</p><p>We remain attentive to your kind confirmation to proceed with the due process.</p>`,
      panama: `<p>Good morning/afternoon/evening everyone,</p><p>Dear customer, thank you for your communication. We will proceed to manage your request and will shortly inform you of the results.</p><p>We remain in contact.</p>`,
      reporte: `<p>Dear colleagues, good afternoon,</p><p>We notify you that for the following request, we need the following information to proceed with the review of what was reported:</p><p>Request Description:<br>Date:<br>Name:<br>Address:<br>Contact:<br>Country:<br>City:</p><p>And please confirm whether you are making this request as a client or non-client. We remain attentive to your response to proceed accordingly.</p>`,
      suspendido: `<p>Dear customer, we appreciate your communication.</p><p>After validating in our system, we detected that ID IDIDIDIDID is currently in Suspended status. Please contact the Collections area for more information about the link and to validate the service status. You can communicate directly through our telephone lines or via email, which you will find in the attached file.</p>`
    },
    pt: {
      torre: `<p><p>Prezado cliente, bom dia.</p><p>Gostaríamos de informar que, de acordo com nosso banco de dados, o serviço corresponde à REDE COMPLEMENTAR. Portanto, é necessário que nos envie o formulário devidamente preenchido, que está disponível no arquivo Excel a seguir. Além disso, anexe os testes realizados pela IFX e o registro fotográfico da TVR para que possamos dar prosseguimento ao seu chamado.</p></p>`,
      redComp: `<p>Prezado cliente, bom dia.</p><p>Estamos escrevendo para informar que sua solicitação foi encaminhada para a equipe de manutenção. Entraremos em contato assim que tivermos novidades. Manteremos você informado sobre qualquer desenvolvimento relevante e entraremos em contato caso precisemos de mais informações. Agradecemos a sua compreensão e cooperação. Atenciosamente,</p>`,
      solicitarId: `<p>Prezado(a) cliente,</p><p>Solicitamos gentilmente sua colaboração para que nos forneça mais informações sobre sua solicitação, como o ID do serviço ou um ticket antigo, para que possamos abrir um novo ticket e resolver seu problema. Caso não saiba o ID, entre em contato com o departamento de vendas, responsável por fornecer essa informação.</p>`,
      validarId: `<p>Prezado cliente, agradecemos sua comunicação.</p><p>Informamos que, ao validar em nosso sistema, descobrimos que o ID IDIDIDID não está registrado em nosso sistema. Favor verificar se o ID do serviço está correto ou se é um ticket antigo para proceder com a abertura de um novo ticket e sua resolução. Se você não conhecer o ID, favor entrar em contato com a área comercial responsável por fornecer essas informações.</p>`,
      rfo: `<p>Prezado cliente,</p><p>Acompanhando seu caso, informamos que estamos solicitando o RFO à área responsável para compartilhá-lo com você. Observe que temos 48 a 72 horas úteis para entregá-lo.</p><p>Permanecemos atentos aos seus comentários.</p>`,
      baja: `<p>Prezado cliente, agradecemos sua comunicação.</p><p>Informamos que, ao validar em nosso sistema, descobrimos que o ID IDIDIDID está no status Cancelado. Favor verificar se o ID está correto ou entrar em contato com a área comercial.</p>`,
      construccion: `<p>Prezado cliente, agradecemos sua comunicação.</p><p>Após validar em nosso sistema, detectamos que o ID IDIDIDIDID está atualmente em status de construção. Favor entrar em contato com o Gerente de Projeto para obter mais informações sobre o link e validar o status do serviço. Você pode se comunicar diretamente via email CCCCCCCCCC.</p>`,
      adm: `<p>Prezado cliente,</p><p>Desejamos um excelente dia.</p><p>Solicitamos que você entre em contato diretamente com a área Comercial ou com seu Gerente de Projeto designado. Eles são responsáveis por este tipo de solicitação e poderão fornecer-lhe a assistência apropriada e as informações necessárias.</p><p>Procederemos com o fechamento do ticket.</p><p>Permanecemos disponíveis para qualquer outra solicitação ou consulta adicional.</p>`,
      graficas: `<p>Prezado cliente, agradecemos sua comunicação.</p><p>Acompanhando sua solicitação, informamos que criamos os gráficos de consumo correspondentes a . Você encontrará o arquivo solicitado em anexo.</p><p>Permanecemos atentos aos seus comentários.</p>`,
      operatividad: `<p>Prezado cliente, bom dia.</p><p>Solicitamos seu apoio validando o status atual do serviço reportado e, caso esteja operacional, favor nos informar se podemos proceder com o fechamento do ticket.</p><p>Permanecemos atentos.</p>`,
      descarte: `<p>Prezado IFX, bom dia.</p><p>Acompanhando sua solicitação, informamos que, ao validar as informações fornecidas, não encontramos descarte fotográfico do equipamento. Requeremos sua colaboração para nos enviar a descarte fotográfico para que possamos escalar para a área correspondente.</p>`,
      duplicado: `<p>Prezado cliente, bom dia.</p><p>Estamos realizando a revisão do link reportado com o seguinte ticket xxxx. Forneceremos atualizações o mais breve possível.</p><p>Procederemos para fechar o ticket correspondente. No entanto, permanecemos disponíveis para qualquer outra solicitação ou consulta adicional.</p>`,
      accesos: `<p>Prezado cliente, bom dia.</p><p>Acompanhando sua solicitação, informamos que os acessos foram autorizados. Abaixo você encontrará as informações correspondentes:</p>`,
      credenciales: `<p>Prezado cliente, agradecemos sua comunicação.</p><p>Validamos em nosso sistema e sua empresa já possui credenciais para gerar relatórios de seus incidentes através do portal web. Para acessar nosso portal, favor visitar o link:</p><p>👉 <a href="https://gestionticketing.ufinet.com/auth" target="_blank">Acesse o portal aqui</a></p><p>As credenciais atribuídas são multi-usuário:<br>Email:<br>Senha:</p><p>Para facilitar seu uso, você pode consultar nossos vídeos tutoriais aqui:<br>🎥 <a href="https://www.youtube.com/playlist?list=PLxXmjSUZ9n3ZG4hyG-0ZVVqXF_ngyvn2f" target="_blank">Ver tutoriais no YouTube</a></p><p>Queremos garantir que sua experiência conosco seja a mais satisfatória possível.</p>`,
      crearCredenciales: `<p>Prezado cliente, cordiais cumprimentos.</p><p>Agradecemos sua comunicação e queremos informar que recebemos sua solicitação. Para realizar as configurações necessárias, exigiremos um prazo de 72 horas, durante o qual completaremos todo o processo de gerenciamento de acesso ao portal web.</p><p>Para qualquer dúvida, você pode responder através deste email e/ou contactar nossas linhas de atendimento e teremos prazer em ajudá-lo.</p>`,
      solicitaCredenciales: `<p>Boa tarde a todos,</p><p>Agradecemos sua comunicação e queremos informar que recebemos sua solicitação. Para realizar as configurações necessárias, exigiremos um prazo de 72 horas, durante o qual completaremos todo o processo de gerenciamento de acesso ao portal web. No entanto, precisamos das seguintes informações para proceder:</p><p>ID do serviço: (Pode ser qualquer um)<br>Nome da Empresa:<br>Razão Social:<br>Email:<br>Telefone:<br>Nome do Solicitante:</p><p>Para qualquer dúvida, você pode responder através deste email e/ou contactar nossas linhas de atendimento e teremos prazer em ajudá-lo.</p>`,
      cerrado: `<p>Prezado cliente,</p><p>Cordiais cumprimentos,</p><p>Atualmente o ticket TTTTTT está fechado por nossa parte.</p><p>Se você enfrentar algum tipo de afetação ou novidade no serviço, favor informar-nos o tipo de falha e os respectivos descartes para que possamos proceder com a criação de um novo caso.</p><p>Permanecemos atentos aos seus comentários.</p>`,
      info: `<p>Prezado cliente,</p><p>Cordiais cumprimentos,</p><p>Para proceder com a criação do caso e garantir uma gestão adequada, solicitamos que você nos indique o motivo específico para o qual precisa abrir esta solicitação.</p><p>Permanecemos atentos à sua gentil confirmação para prosseguir com o devido processo.</p>`,
      panama: `<p>Bom dia/tarde/noite a todos,</p><p>Prezado cliente, obrigado pela sua comunicação. Procederemos a gerenciar sua solicitação e em breve estaremos informando-lhe o resultado.</p><p>Permanecemos em contato.</p>`,
      reporte: `<p>Prezados colegas, boa tarde,</p><p>Notificamos que para a seguinte solicitação, precisamos das seguintes informações para proceder com a revisão do reportado:</p><p>Descrição da Solicitação:<br>Data:<br>Nome:<br>Endereço:<br>Contato:<br>País:<br>Cidade:</p><p>E favor confirmar se você está fazendo a solicitação como cliente ou não cliente. Permanecemos atentos à sua resposta para proceder conforme o devido.</p>`,
      suspendido: `<p>Prezado cliente, agradecemos sua comunicação.</p><p>Após validar em nosso sistema, detectamos que o ID IDIDIDIDID está atualmente em status Suspenso. Favor entrar em contato com a área de Cobrança para obter mais informações sobre o link e validar o status do serviço. Você pode se comunicar diretamente através de nossas linhas telefônicas ou via email, que você encontrará no arquivo anexado.</p>`
    }
  };

  // Manejo de clic en las tarjetas
  optionCards.forEach(card => {
    card.addEventListener("click", () => {
      optionCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const valor = card.getAttribute("data-value");
      const idioma = idiomaSelect.value || 'es';
      output.innerHTML = textos[idioma][valor] || "<p>Texto no definido.</p>";
    });
  });

  // Cambiar idioma
  idiomaSelect.addEventListener("change", () => {
    const cardActivo = document.querySelector(".option-card.active");
    if (cardActivo) {
      const valor = cardActivo.getAttribute("data-value");
      const idioma = idiomaSelect.value;
      output.innerHTML = textos[idioma][valor] || "<p>Texto no definido.</p>";
    }
  });

  // Copiar al portapapeles
  copyBtn.addEventListener("click", () => {
    const textoFormateado = convertirHTMLaTexto(output.innerHTML);
    
    navigator.clipboard.writeText(textoFormateado)
      .then(() => alert("Texto copiado al portapapeles ✅"))
      .catch(() => {
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
}{
      torre; "Estimado cliente, le informamos que su solicitud ha sido escalada al personal de mantenimiento.",
      redComp; "Estimado cliente, según nuestra base de datos el servicio corresponde a RED COMPLEMENTARIA.",
      solicitarId; "Estimado cliente, solicitamos su apoyo para brindar mayor información.",
      validarId; "Estimado cliente, el ID IDIDIDID no se registra en nuestro sistema.",
      rfo; "Estimado cliente, se está solicitando el RFO. Se tienen 48 a 72 horas hábiles para entrega.",
      baja; "Estimado cliente, el ID IDIDIDID está en estado Cancelado.",
      construccion; "Estimado cliente, el ID está en estado de construcción.",
      adm; "Estimado cliente, solicitamos contacte al área Comercial o su Project Manager.",
      graficas; "Estimado cliente, hemos creado las gráficas de consumo solicitadas.",
      operatividad; "Estimado cliente, solicitamos validar el estado actual del servicio.",
      descarte; "Estimado IFX, no encontramos descarte fotográfico del equipo.",
      duplicado; "Estimado cliente, se está revisando el enlace reportado con ticket xxxx.",
      accesos; "Estimado cliente, los accesos han sido autorizados.",
      credenciales; "Estimado cliente, su empresa cuenta con credenciales para el portal.",
      crearCredenciales; "Estimado cliente, requeriremos 72 horas para completar el proceso.",
      solicitaCredenciales; "Estimado cliente, necesitamos los siguientes datos para proceder.",
      cerrado; "Estimado cliente, el ticket se encuentra cerrado de nuestra parte.",
      info; "Estimado cliente, necesitamos más información sobre su solicitud.",
      panama; "Estimado cliente, procederemos a gestionar su solicitud.",
      reporte; "Estimados, necesitamos los siguientes datos para proceder.",
      suspendido; "Estimado cliente, el ID se encuentra en estado Suspendido."
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
    const textoFormateado = convertirHTMLaTexto(output.innerHTML);
    
    navigator.clipboard.writeText(textoFormateado)
      .then(() => alert("Texto copiado al portapapeles ✅"))
      .catch(() => {
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


// ==================== UTILIDAD: Convertir HTML a texto plano ====================
function convertirHTMLaTexto(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  temp.querySelectorAll('p').forEach(p => {
    p.insertAdjacentText('afterend', '\n\n');
  });
  
  temp.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n');
  });
  
  let texto = temp.textContent || temp.innerText;
  
  texto = texto.replace(/[ \t]+/g, ' ');
  texto = texto.replace(/\n\s+\n/g, '\n\n');
  texto = texto.trim();
  
  return texto;
}

// ==================== UTILIDADES GLOBALES ====================
console.log("🚀 Sistema de Intranet cargado correctamente");




// ==================== MÓDULO: TIPOS DE REPORTE (COMPLETO) ====================
function initTiposReporte() {
  const buscarInput = document.getElementById("buscar-tipo");
  const categoriaCards = document.querySelectorAll(".categoria-card");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (!buscarInput) {
    console.warn("⚠️ Elementos del módulo Tipos de Reporte no encontrados");
    return;
  }

  // ==================== FUNCIÓN DE BÚSQUEDA ====================
  buscarInput.addEventListener("input", (e) => {
    const textoBusqueda = e.target.value.toLowerCase().trim();

    // Buscar en todas las pestañas
    const todasLasSecciones = document.querySelectorAll(".tab-content");
    
    todasLasSecciones.forEach(seccion => {
      const elementos = seccion.querySelectorAll(".categoria-card, .correo-item, .estado-card, .dc-section, .cierre-card, .kam-pm-card, .nota-importante");
      
      elementos.forEach(elemento => {
        const contenido = elemento.textContent.toLowerCase();
        const keywords = elemento.getAttribute("data-categoria")?.toLowerCase() || "";
        
        if (contenido.includes(textoBusqueda) || keywords.includes(textoBusqueda)) {
          elemento.style.display = "";
          if (textoBusqueda.length > 0) {
            elemento.style.border = "2px solid var(--primary)";
            elemento.style.transform = "scale(1.02)";
          } else {
            elemento.style.border = "";
            elemento.style.transform = "";
          }
        } else {
          elemento.style.display = "none";
        }
      });
    });

    // Mensaje si no hay resultados
    let mensajeNoResultados = document.getElementById("no-resultados-msg");
    
    const elementosVisibles = document.querySelectorAll(".categoria-card:not([style*='display: none']), .correo-item:not([style*='display: none']), .estado-card:not([style*='display: none'])");
    
    if (elementosVisibles.length === 0 && textoBusqueda.length > 0) {
      if (!mensajeNoResultados) {
        mensajeNoResultados = document.createElement("div");
        mensajeNoResultados.id = "no-resultados-msg";
        mensajeNoResultados.className = "no-resultados";
        mensajeNoResultados.innerHTML = `
          <p>😕 No se encontraron resultados para "<strong>${textoBusqueda}</strong>"</p>
          <p>Intenta con otros términos como: correo, estado, datacenter, degradación, etc.</p>
        `;
        const activeTab = document.querySelector(".tab-content.active");
        if (activeTab) {
          activeTab.appendChild(mensajeNoResultados);
        }
      }
    } else if (mensajeNoResultados) {
      mensajeNoResultados.remove();
    }
  });

  // ==================== SISTEMA DE TABS ====================
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      // Remover active de todos
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      // Activar el seleccionado
      btn.classList.add("active");
      const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
      if (targetContent) {
        targetContent.classList.add("active");
      }

      // Limpiar búsqueda al cambiar de tab
      buscarInput.value = "";
      const todosLosElementos = document.querySelectorAll(".categoria-card, .correo-item, .estado-card, .dc-section, .cierre-card, .kam-pm-card, .nota-importante");
      todosLosElementos.forEach(el => {
        el.style.display = "";
        el.style.border = "";
        el.style.transform = "";
      });
      
      const mensajeNoResultados = document.getElementById("no-resultados-msg");
      if (mensajeNoResultados) {
        mensajeNoResultados.remove();
      }
    });
  });

  // ==================== BOTONES COPIAR CORREOS ====================
  document.querySelectorAll(".btn-copy-correo").forEach(btn => {
    btn.addEventListener("click", () => {
      const correo = btn.getAttribute("data-correo");
      navigator.clipboard.writeText(correo)
        .then(() => {
          const textoOriginal = btn.textContent;
          btn.textContent = "✅";
          btn.style.background = "#28a745";
          setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = "";
          }, 2000);
        })
        .catch(err => {
          console.error("Error copiando:", err);
          alert("Error al copiar. Intenta de nuevo.");
        });
    });
  });

  // ==================== BOTONES COPIAR SCRIPTS ====================
  document.querySelectorAll(".btn-copy-script").forEach(btn => {
    btn.addEventListener("click", () => {
      const scriptBox = btn.previousElementSibling;
      const texto = scriptBox.textContent.trim();
      navigator.clipboard.writeText(texto)
        .then(() => {
          const textoOriginal = btn.textContent;
          btn.textContent = "✅ Copiado";
          btn.style.background = "#28a745";
          setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = "";
          }, 2000);
        })
        .catch(err => {
          console.error("Error copiando:", err);
          alert("Error al copiar. Intenta de nuevo.");
        });
    });
  });

  // ==================== BOTONES COPIAR CUADROS DE CIERRE ====================
  document.querySelectorAll(".btn-copy-cierre").forEach(btn => {
    btn.addEventListener("click", async () => {
      const causa = btn.getAttribute("data-causa");
      const solucion = btn.getAttribute("data-solucion");
      const imputable = btn.getAttribute("data-imputable");
      
      // Texto plano (fallback)
      const textoPlano = `Causa: ${causa}
Solución: ${solucion}
Imputabilidad: ${imputable}`;

      // HTML con negrillas
      const textoHTML = `<strong>Causa:</strong> ${causa}<br><strong>Solución:</strong> ${solucion}<br><strong>Imputabilidad:</strong> ${imputable}`;
      
      try {
        // Intentar copiar con formato enriquecido
        const blobHTML = new Blob([textoHTML], { type: 'text/html' });
        const blobText = new Blob([textoPlano], { type: 'text/plain' });

        const clipboardItem = new ClipboardItem({
          'text/html': blobHTML,
          'text/plain': blobText
        });

        await navigator.clipboard.write([clipboardItem]);
        
        const textoOriginal = btn.textContent;
        btn.textContent = "✅ Copiado";
        btn.style.background = "#28a745";
        setTimeout(() => {
          btn.textContent = textoOriginal;
          btn.style.background = "";
        }, 2000);
      } catch (err) {
        // Fallback a texto plano
        console.warn("No se pudo copiar con formato, usando texto plano:", err);
        navigator.clipboard.writeText(textoPlano)
          .then(() => {
            const textoOriginal = btn.textContent;
            btn.textContent = "✅ Copiado";
            btn.style.background = "#28a745";
            setTimeout(() => {
              btn.textContent = textoOriginal;
              btn.style.background = "";
            }, 2000);
          })
          .catch(e => {
            console.error("Error copiando:", e);
            alert("Error al copiar. Intenta de nuevo.");
          });
      }
    });
  });

  // ==================== EFECTO HOVER EN TARJETAS ====================
  categoriaCards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      if (!buscarInput.value) {
        card.style.transform = "translateY(-5px)";
      }
    });

    card.addEventListener("mouseleave", () => {
      if (!buscarInput.value) {
        card.style.transform = "translateY(0)";
      }
    });
  });


// ==================== LLAMADAS DE PRUEBA ====================

// Copiar SOLO el número
document.querySelectorAll(".numero-copiable").forEach(numero => {
  numero.addEventListener("click", () => {
    const numeroTexto = numero.getAttribute("data-numero");

    navigator.clipboard.writeText(numeroTexto).then(() => {
      const bg = numero.style.background;
      const color = numero.style.color;

      numero.style.background = "#28a745";
      numero.style.color = "white";

      setTimeout(() => {
        numero.style.background = bg;
        numero.style.color = color;
      }, 1200);
    });
  });
});

// Copiar tabla COMPLETA en formato EXCEL
const btnCopiarTablaLlamadas = document.getElementById("btn-copiar-tabla-llamadas");

if (btnCopiarTablaLlamadas) {
  btnCopiarTablaLlamadas.addEventListener("click", () => {
    const tablas = document.querySelectorAll(".tabla-llamadas");
    let html = "";

    tablas.forEach(tabla => {
      const titulo = tabla.previousElementSibling?.outerHTML || "";
      html += titulo;
      html += tabla.outerHTML;
      html += "<br>";
    });

    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([html.replace(/<[^>]*>/g, "")], { type: "text/plain" })
      })
    ]).then(() => {
      const original = btnCopiarTablaLlamadas.textContent;
      btnCopiarTablaLlamadas.textContent = "✅ Copiado (Excel)";
      btnCopiarTablaLlamadas.style.background = "#28a745";

      setTimeout(() => {
        btnCopiarTablaLlamadas.textContent = original;
        btnCopiarTablaLlamadas.style.background = "";
      }, 2000);
    });
  });
}

// Limpiar resultados
const btnLimpiarLlamadas = document.getElementById("btn-limpiar-llamadas");

if (btnLimpiarLlamadas) {
  btnLimpiarLlamadas.addEventListener("click", () => {
    if (confirm("¿Estás seguro de limpiar todos los resultados y observaciones?")) {
      document.querySelectorAll(".celda-editable").forEach(celda => {
        celda.textContent = "";
      });
    }
  });
}


  console.log("✅ Módulo Tipos de Reporte (completo) inicializado");
}