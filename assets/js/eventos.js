// Variables globales
let currentDate = new Date();
let currentView = 'mes';
let eventosData = [];
let filteredEventos = [];

// Datos simulados de eventos
const eventosSample = [
  {
    id: 'webinar-arrecifes',
    titulo: 'Crisis de los Arrecifes de Coral',
    tipo: 'webinar',
    fecha: '2025-06-15',
    hora: '19:00',
    modalidad: 'virtual',
    ubicacion: 'Zoom',
    descripcion: 'Expertos internacionales discuten las amenazas actuales a los arrecifes de coral y estrategias de conservación.',
    capacidad: 500,
    inscritos: 248,
    costo: 'gratuito',
    organizador: 'Dr. Marina López',
    region: 'global'
  },
  {
    id: 'limpieza-cancun',
    titulo: 'Gran Limpieza de Playa Cancún',
    tipo: 'limpieza',
    fecha: '2025-06-22',
    hora: '08:00',
    modalidad: 'presencial',
    ubicacion: 'Playa Delfines, Cancún',
    descripcion: 'Actividad presencial de limpieza en las playas de Cancún. Incluye equipo, refrigerio y certificado de participación.',
    capacidad: 200,
    inscritos: 156,
    costo: 'gratuito',
    organizador: 'SWAY México',
    region: 'mexico'
  },
  {
    id: 'cumbre-oceanica',
    titulo: 'Cumbre Oceánica Internacional',
    tipo: 'conferencia',
    fecha: '2025-07-08',
    hora: '09:00',
    modalidad: 'hibrido',
    ubicacion: 'Centro de Convenciones + Virtual',
    descripcion: 'Conferencia de 3 días con científicos, activistas y líderes mundiales en conservación marina.',
    capacidad: 1500,
    inscritos: 1247,
    costo: 'pago',
    organizador: 'Fundación Océanos',
    region: 'global'
  }
  // Más eventos...
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  eventosData = generarEventosCalendario();
  filteredEventos = [...eventosData];
  setupEventListeners();
  renderCalendario();
  renderAgenda();
});

// Event listeners
function setupEventListeners() {
  // Navegación del calendario
  document.getElementById('prev-month').addEventListener('click', () => cambiarMes(-1));
  document.getElementById('next-month').addEventListener('click', () => cambiarMes(1));
  
  // Cambio de vista
  document.querySelectorAll('.vista-btn').forEach(btn => {
    btn.addEventListener('click', cambiarVista);
  });
  
  // Filtros
  document.getElementById('tipo-filter').addEventListener('change', filtrarEventos);
  document.getElementById('modalidad-filter').addEventListener('change', filtrarEventos);
  document.getElementById('region-filter').addEventListener('change', filtrarEventos);
  
  // Formulario crear evento
  document.getElementById('form-crear-evento').addEventListener('submit', crearEvento);
}

// Generar eventos para el calendario
function generarEventosCalendario() {
  const eventos = [...eventosSample];
  
  // Agregar más eventos simulados para poblar el calendario
  const tiposEvento = ['webinar', 'limpieza', 'conferencia', 'taller', 'campana'];
  const modalidades = ['virtual', 'presencial', 'hibrido'];
  const regiones = ['mexico', 'centroamerica', 'sudamerica', 'global'];
  
  for (let i = 0; i < 30; i++) {
    const fecha = new Date(2025, 5, Math.floor(Math.random() * 30) + 1); // Junio 2025
    eventos.push({
      id: `evento-${i}`,
      titulo: `Evento ${i + 1}`,
      tipo: tiposEvento[Math.floor(Math.random() * tiposEvento.length)],
      fecha: fecha.toISOString().split('T')[0],
      hora: `${Math.floor(Math.random() * 12) + 8}:00`,
      modalidad: modalidades[Math.floor(Math.random() * modalidades.length)],
      ubicacion: 'Ubicación ejemplo',
      descripcion: 'Descripción del evento...',
      capacidad: Math.floor(Math.random() * 500) + 50,
      inscritos: Math.floor(Math.random() * 200),
      costo: 'gratuito',
      organizador: 'SWAY',
      region: regiones[Math.floor(Math.random() * regiones.length)]
    });
  }
  
  return eventos;
}

// Cambiar mes
function cambiarMes(direccion) {
  currentDate.setMonth(currentDate.getMonth() + direccion);
  renderCalendario();
  updateMonthYear();
}

// Actualizar título del mes
function updateMonthYear() {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const monthYear = `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  document.getElementById('current-month-year').textContent = monthYear;
}

// Cambiar vista
function cambiarVista(e) {
  const vista = e.target.dataset.vista;
  currentView = vista;
  
  // Actualizar botones
  document.querySelectorAll('.vista-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  
  // Mostrar/ocultar vistas
  if (vista === 'agenda') {
    document.getElementById('calendario-mes').style.display = 'none';
    document.getElementById('agenda-view').style.display = 'block';
  } else {
    document.getElementById('calendario-mes').style.display = 'block';
    document.getElementById('agenda-view').style.display = 'none';
  }
}

// Filtrar eventos
function filtrarEventos() {
  const tipoFilter = document.getElementById('tipo-filter').value;
  const modalidadFilter = document.getElementById('modalidad-filter').value;
  const regionFilter = document.getElementById('region-filter').value;
  
  filteredEventos = eventosData.filter(evento => {
    const matchesTipo = !tipoFilter || evento.tipo === tipoFilter;
    const matchesModalidad = !modalidadFilter || evento.modalidad === modalidadFilter;
    const matchesRegion = !regionFilter || evento.region === regionFilter;
    
    return matchesTipo && matchesModalidad && matchesRegion;
  });
  
  renderCalendario();
  renderAgenda();
}

// Renderizar calendario
function renderCalendario() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Primer día del mes y último día
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Primer día de la semana (domingo = 0)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendarioDias = document.getElementById('calendario-dias');
  calendarioDias.innerHTML = '';
  
  // Generar 42 días (6 semanas)
  for (let i = 0; i < 42; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    const diaElement = document.createElement('div');
    diaElement.className = 'calendario-dia';
    
    // Clases especiales
    if (currentDay.getMonth() !== month) {
      diaElement.classList.add('otro-mes');
    }
    
    if (isToday(currentDay)) {
      diaElement.classList.add('hoy');
    }
    
    // Número del día
    const numeroElement = document.createElement('div');
    numeroElement.className = 'dia-numero';
    numeroElement.textContent = currentDay.getDate();
    diaElement.appendChild(numeroElement);
    
    // Eventos del día
    const eventosDelDia = getEventosDelDia(currentDay);
    eventosDelDia.forEach(evento => {
      const eventoElement = document.createElement('div');
      eventoElement.className = `evento-calendario ${evento.tipo}`;
      eventoElement.textContent = evento.titulo.substring(0, 15) + (evento.titulo.length > 15 ? '...' : '');
      eventoElement.onclick = () => openEventoDetail(evento.id);
      diaElement.appendChild(eventoElement);
    });
    
    calendarioDias.appendChild(diaElement);
  }
  
  updateMonthYear();
}

// Renderizar agenda
function renderAgenda() {
  const agendaList = document.getElementById('agenda-list');
  
  // Ordenar eventos por fecha
  const eventosFuturos = filteredEventos
    .filter(evento => new Date(evento.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 20); // Mostrar solo los próximos 20 eventos
  
  agendaList.innerHTML = eventosFuturos.map(evento => `
    <div class="agenda-item" onclick="openEventoDetail('${evento.id}')">
      <div class="agenda-fecha">${formatearFecha(evento.fecha)} - ${evento.hora}</div>
      <h4 class="agenda-titulo">${evento.titulo}</h4>
      <div class="agenda-detalles">
        <span class="evento-tipo ${evento.tipo}">${getTipoText(evento.tipo)}</span>
        <span class="info-item">
          <i class="bi bi-geo-alt"></i>
          ${evento.ubicacion}
        </span>
        <span class="info-item">
          <i class="bi bi-people"></i>
          ${evento.inscritos}/${evento.capacidad} inscritos
        </span>
      </div>
    </div>
  `).join('');
}

// Obtener eventos de un día específico
function getEventosDelDia(fecha) {
  const fechaStr = fecha.toISOString().split('T')[0];
  return filteredEventos.filter(evento => evento.fecha === fechaStr);
}

// Verificar si es hoy
function isToday(fecha) {
  const hoy = new Date();
  return fecha.toDateString() === hoy.toDateString();
}

// Formatear fecha
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return fecha.toLocaleDateString('es-ES', opciones);
}

// Obtener texto del tipo de evento
function getTipoText(tipo) {
  const tipoMap = {
    'webinar': 'Webinar',
    'limpieza': 'Limpieza',
    'conferencia': 'Conferencia',
    'taller': 'Taller',
    'campana': 'Campaña'
  };
  return tipoMap[tipo] || tipo;
}

// Abrir detalles del evento
function openEventoDetail(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  const modal = document.getElementById('evento-modal');
  const content = document.getElementById('evento-modal-content');
  
  content.innerHTML = `
    <div class="evento-detail">
      <div class="evento-header">
        <h2>${evento.titulo}</h2>
        <span class="evento-tipo ${evento.tipo}">${getTipoText(evento.tipo)}</span>
      </div>
      
      <div class="evento-info-grid">
        <div class="info-card">
          <i class="bi bi-calendar-event"></i>
          <div>
            <strong>Fecha y Hora</strong>
            <p>${formatearFecha(evento.fecha)} - ${evento.hora}</p>
          </div>
        </div>
        
        <div class="info-card">
          <i class="bi bi-geo-alt"></i>
          <div>
            <strong>Ubicación</strong>
            <p>${evento.ubicacion}</p>
          </div>
        </div>
        
        <div class="info-card">
          <i class="bi bi-people"></i>
          <div>
            <strong>Participantes</strong>
            <p>${evento.inscritos}/${evento.capacidad} inscritos</p>
          </div>
        </div>
        
        <div class="info-card">
          <i class="bi bi-person"></i>
          <div>
            <strong>Organizador</strong>
            <p>${evento.organizador}</p>
          </div>
        </div>
      </div>
      
      <div class="evento-descripcion">
        <h4>Descripción</h4>
        <p>${evento.descripcion}</p>
      </div>
      
      <div class="evento-acciones">
        <button class="btn-primary" onclick="registrarEvento('${evento.id}')">
          <i class="bi bi-calendar-plus"></i> Registrarse
        </button>
        <button class="btn-secondary" onclick="compartirEvento('${evento.id}')">
          <i class="bi bi-share"></i> Compartir
        </button>
        <button class="btn-secondary" onclick="agregarCalendario('${evento.id}')">
          <i class="bi bi-calendar2-plus"></i> Agregar a mi calendario
        </button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Cerrar modal
function closeEventoModal() {
  document.getElementById('evento-modal').style.display = 'none';
}

// Registrar en evento
function registrarEvento(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  // Simulación de registro
  alert(`¡Te has registrado exitosamente para "${evento.titulo}"!\n\nRecibirás un email de confirmación con todos los detalles.`);
  
  // Incrementar contador de inscritos
  evento.inscritos++;
  renderCalendario();
  renderAgenda();
}

// Compartir evento
function compartirEvento(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  if (navigator.share) {
    navigator.share({
      title: evento.titulo,
      text: `Únete a: ${evento.titulo} - ${formatearFecha(evento.fecha)}`,
      url: window.location.href
    });
  } else {
    const texto = `Únete a: ${evento.titulo} - ${formatearFecha(evento.fecha)} ${evento.hora}`;
    navigator.clipboard.writeText(texto).then(() => {
      alert('Enlace del evento copiado al portapapeles');
    });
  }
}

// Agregar a calendario
function agregarCalendario(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  const startDate = new Date(`${evento.fecha}T${evento.hora}`);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas
  
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.titulo)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(evento.descripcion)}&location=${encodeURIComponent(evento.ubicacion)}`;
  
  window.open(googleCalendarUrl, '_blank');
}

// Crear evento
function crearEvento(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const nuevoEvento = {
    id: `evento-user-${Date.now()}`,
    titulo: formData.get('titulo'),
    tipo: formData.get('tipo'),
    fecha: formData.get('fecha'),
    hora: formData.get('hora'),
    modalidad: formData.get('modalidad'),
    ubicacion: formData.get('ubicacion'),
    descripcion: formData.get('descripcion'),
    capacidad: parseInt(formData.get('capacidad')) || 50,
    inscritos: 0,
    costo: formData.get('costo'),
    organizador: 'Usuario',
    region: 'mexico'
  };
  
  // Validaciones básicas
  if (!nuevoEvento.titulo || !nuevoEvento.fecha || !nuevoEvento.hora) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }
  
  // Agregar a la lista de eventos
  eventosData.push(nuevoEvento);
  filteredEventos = [...eventosData];
  
  // Renderizar de nuevo
  renderCalendario();
  renderAgenda();
  
  // Limpiar formulario
  e.target.reset();
  
  // Mostrar confirmación
  alert('¡Evento creado exitosamente!\n\nTu evento será revisado y publicado en las próximas 24 horas.');
}

// Inicializar fecha actual
updateMonthYear();
