// Variables globales
let especiesData = [];
let filteredEspecies = [];
let currentPage = 1;
const itemsPerPage = 12;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  cargarEspecies();
  setupEventListeners();
});

// Cargar especies desde la API
async function cargarEspecies() {
  try {
    const response = await fetch('/api/especies');
    const data = await response.json();
    especiesData = data.especies;
    filteredEspecies = [...especiesData];
    renderEspecies();
    actualizarContadorEspecies();
  } catch (error) {
    console.error('Error al cargar especies:', error);
    // Fallback a datos simulados si falla la API
    especiesData = especiesSimuladas;
    filteredEspecies = [...especiesData];
    renderEspecies();
    actualizarContadorEspecies();
  }
}

// Datos simulados de especies (fallback)
const especiesSimuladas = [
  {
    id: 'tortuga-verde',
    nombre: 'Tortuga Marina Verde',
    nombre_cientifico: 'Chelonia mydas',
    habitat: 'costero',
    estado_conservacion: 'vulnerable',
    tipo: 'reptiles',
    longitud: '1.5m',
    ubicacion: 'Océanos tropicales',
    esperanza_vida: '80 años',
    imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    descripcion: 'La tortuga verde es una de las especies de tortugas marinas más grandes...',
    amenazas: ['Contaminación plástica', 'Pérdida de playas de anidación', 'Pesca incidental'],
    poblacion: '85,000-90,000 hembras anidadoras'
  },
  {
    id: 'ballena-azul',
    nombre: 'Ballena Azul',
    nombre_cientifico: 'Balaenoptera musculus',
    habitat: 'aguas-abiertas',
    estado_conservacion: 'peligro',
    tipo: 'mamiferos',
    longitud: '30m',
    ubicacion: 'Todos los océanos',
    esperanza_vida: '90 años',
    imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    descripcion: 'El animal más grande que ha existido en la Tierra...',
    amenazas: ['Colisiones con barcos', 'Contaminación acústica', 'Cambio climático'],
    poblacion: '10,000-25,000 individuos'
  }
  // Más especies...
];

// Event listeners
function setupEventListeners() {
  // Búsqueda
  document.getElementById('search-especies').addEventListener('input', filterEspecies);
  
  // Filtros
  document.getElementById('habitat-filter').addEventListener('change', filterEspecies);
  document.getElementById('conservation-filter').addEventListener('change', filterEspecies);
  document.getElementById('type-filter').addEventListener('change', filterEspecies);
  
  // Ordenar
  document.getElementById('sort-especies').addEventListener('change', sortEspecies);
  
  // Vista
  document.querySelectorAll('.vista-btn').forEach(btn => {
    btn.addEventListener('click', changeView);
  });
  
  // Paginación
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
  document.getElementById('next-page').addEventListener('click', () => changePage(1));
}

// Filtrar especies
function filterEspecies() {
  const searchTerm = document.getElementById('search-especies').value.toLowerCase();
  const habitatFilter = document.getElementById('habitat-filter').value;
  const conservationFilter = document.getElementById('conservation-filter').value;
  const typeFilter = document.getElementById('type-filter').value;
  
  filteredEspecies = especiesData.filter(especie => {
    const matchesSearch = especie.nombre.toLowerCase().includes(searchTerm) ||
                         especie.nombre_cientifico.toLowerCase().includes(searchTerm);
    const matchesHabitat = !habitatFilter || especie.habitat === habitatFilter;
    const matchesConservation = !conservationFilter || especie.estado_conservacion === conservationFilter;
    const matchesType = !typeFilter || especie.tipo === typeFilter;
    
    return matchesSearch && matchesHabitat && matchesConservation && matchesType;
  });
  
  currentPage = 1;
  renderEspecies();
  actualizarContadorEspecies();
}

// Ordenar especies
function sortEspecies() {
  const sortBy = document.getElementById('sort-especies').value;
  
  filteredEspecies.sort((a, b) => {
    switch(sortBy) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre);
      case 'conservation':
        const conservationOrder = {
          'extincion-critica': 0,
          'peligro': 1,
          'vulnerable': 2,
          'casi-amenazada': 3,
          'preocupacion-menor': 4
        };
        return conservationOrder[a.estado_conservacion] - conservationOrder[b.estado_conservacion];
      case 'size':
        return parseFloat(a.longitud) - parseFloat(b.longitud);
      case 'habitat':
        return a.habitat.localeCompare(b.habitat);
      default:
        return 0;
    }
  });
  
  renderEspecies();
}

// Cambiar vista
function changeView(e) {
  const vista = e.target.dataset.vista;
  
  // Actualizar botones
  document.querySelectorAll('.vista-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  
  // Mostrar/ocultar secciones
  if (vista === 'mapa') {
    document.getElementById('especies-grid').style.display = 'none';
    document.getElementById('mapa-section').style.display = 'block';
  } else {
    document.getElementById('especies-grid').style.display = 'grid';
    document.getElementById('mapa-section').style.display = 'none';
    
    if (vista === 'list') {
      document.getElementById('especies-grid').classList.add('list-view');
    } else {
      document.getElementById('especies-grid').classList.remove('list-view');
    }
  }
}

// Renderizar especies
function renderEspecies() {
  const grid = document.getElementById('especies-grid');
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEspecies = filteredEspecies.slice(startIndex, endIndex);
  
  grid.innerHTML = currentEspecies.map(especie => `
    <div class="especie-card" data-habitat="${especie.habitat}" data-conservation="${especie.estado_conservacion}" data-type="${especie.tipo}">
      <div class="especie-image">
        <img src="${especie.imagen}" alt="${especie.nombre}" onerror="this.src='https://via.placeholder.com/400x300?text=Imagen+no+disponible'">
        <div class="conservation-badge ${especie.estado_conservacion}">${getConservationText(especie.estado_conservacion)}</div>
      </div>
      <div class="especie-content">
        <h3>${especie.nombre}</h3>
        <p class="scientific-name">${especie.nombre_cientifico}</p>
        <div class="especie-stats">
          <div class="stat">
            <i class="bi bi-rulers"></i>
            <span>${especie.longitud || 'No disponible'}</span>
          </div>
          <div class="stat">
            <i class="bi bi-geo-alt"></i>
            <span>${especie.ubicacion || 'No disponible'}</span>
          </div>
          <div class="stat">
            <i class="bi bi-heart-pulse"></i>
            <span>Vida: ${especie.esperanza_vida || 'No disponible'}</span>
          </div>
        </div>
        <p class="especie-description">${especie.descripcion}</p>
        <div class="especie-actions">
          <button class="btn-primary" onclick="openSpeciesDetail('${especie.id}')">
            Ver Detalles
          </button>
          <button class="btn-secondary" onclick="reportSighting('${especie.id}')">
            <i class="bi bi-camera"></i> Reportar Avistamiento
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  updatePagination();
}

// Actualizar paginación
function updatePagination() {
  const totalPages = Math.ceil(filteredEspecies.length / itemsPerPage);
  
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages;
  
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Cambiar página
function changePage(direction) {
  const totalPages = Math.ceil(filteredEspecies.length / itemsPerPage);
  const newPage = currentPage + direction;
  
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderEspecies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Función para manejar el formulario de newsletter
function showNewsletterConfirmation() {
  const email = document.getElementById('newsletter-email').value;
  
  if (!email) {
    alert('Por favor, ingresa tu email');
    return;
  }
  
  // Enviar a la API
  suscribirNewsletter(email).then(result => {
    if (result.success) {
      document.getElementById('newsletter-popup').style.display = 'block';
      document.getElementById('newsletter-email').value = '';
    } else {
      alert('Error: ' + result.message);
    }
  });
}

// Función para cerrar el popup de newsletter
function closeNewsletterPopup() {
  document.getElementById('newsletter-popup').style.display = 'none';
}

// Función mejorada para reportar avistamiento
function reportSighting(speciesId) {
  // Obtener nombre de la especie según el ID
  const especie = especiesData.find(e => e.id === speciesId);
  let speciesName = especie ? `${especie.nombre} (${especie.nombre_cientifico})` : 'Especie no identificada';
  
  // Crear modal dinámico si no existe
  if (!document.getElementById('reportSightingModal')) {
    createSightingModal();
  }
  
  // Establecer el nombre de la especie en el modal
  document.getElementById('species-name').value = speciesName;
  
  // Establecer fecha actual como valor predeterminado
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sighting-date').value = today;
  
  // Mostrar el modal
  const myModal = new bootstrap.Modal(document.getElementById('reportSightingModal'));
  myModal.show();
}

// Función para crear el modal de reporte de avistamiento
function createSightingModal() {
  const modalHTML = `
    <div class="modal fade" id="reportSightingModal" tabindex="-1" aria-labelledby="reportSightingModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="reportSightingModalLabel">Reportar Avistamiento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="sightingForm">
              <div class="mb-3">
                <label for="species-name" class="form-label">Especie Avistada</label>
                <input type="text" class="form-control" id="species-name" readonly>
              </div>
              <div class="mb-3">
                <label for="sighting-date" class="form-label">Fecha del Avistamiento</label>
                <input type="date" class="form-control" id="sighting-date" required>
              </div>
              <div class="mb-3">
                <label for="sighting-location" class="form-label">Ubicación</label>
                <input type="text" class="form-control" id="sighting-location" placeholder="Ej: Golfo de México, frente a Veracruz" required>
              </div>
              <div class="mb-3">
                <label for="sighting-coordinates" class="form-label">Coordenadas (opcional)</label>
                <input type="text" class="form-control" id="sighting-coordinates" placeholder="Ej: 19.2465, -96.1015">
              </div>
              <div class="mb-3">
                <label for="observer-name" class="form-label">Tu Nombre</label>
                <input type="text" class="form-control" id="observer-name" required>
              </div>
              <div class="mb-3">
                <label for="observer-email" class="form-label">Tu Email</label>
                <input type="email" class="form-control" id="observer-email" required>
              </div>
              <div class="mb-3">
                <label for="sighting-description" class="form-label">Descripción del Avistamiento</label>
                <textarea class="form-control" id="sighting-description" rows="3" placeholder="Describe lo que viste: comportamiento, número de individuos, etc."></textarea>
              </div>
              <div class="mb-3">
                <label for="sighting-photo" class="form-label">URL de Foto (opcional)</label>
                <input type="url" class="form-control" id="sighting-photo" placeholder="https://ejemplo.com/foto.jpg">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="submit-sighting">Reportar Avistamiento</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Agregar event listener para el botón de envío
  document.getElementById('submit-sighting').addEventListener('click', function() {
    const form = document.getElementById('sightingForm');
    if (form.checkValidity()) {
      const formData = {
        species_name: document.getElementById('species-name').value,
        sighting_date: document.getElementById('sighting-date').value,
        location: document.getElementById('sighting-location').value,
        coordinates: document.getElementById('sighting-coordinates').value,
        observer_name: document.getElementById('observer-name').value,
        observer_email: document.getElementById('observer-email').value,
        description: document.getElementById('sighting-description').value,
        photo_url: document.getElementById('sighting-photo').value
      };
      
      reportarAvistamiento(formData).then(success => {
        if (success) {
          const myModal = bootstrap.Modal.getInstance(document.getElementById('reportSightingModal'));
          myModal.hide();
          form.reset();
        }
      });
    } else {
      form.reportValidity();
    }
  });
}

// Función para abrir detalles de especie
async function openSpeciesDetail(specieId) {
  const especie = await obtenerDetallesEspecie(specieId);
  
  if (especie) {
    // Crear y mostrar modal con detalles
    mostrarModalDetalles(especie);
  } else {
    alert('No se pudieron cargar los detalles de la especie');
  }
}

// Función para mostrar modal de detalles
function mostrarModalDetalles(especie) {
  const modalContent = `
    <div class="species-detail-header">
      <img src="${especie.imagen}" alt="${especie.nombre}" class="species-detail-image">
      <div class="species-detail-info">
        <h2>${especie.nombre}</h2>
        <p class="scientific-name">${especie.nombre_cientifico}</p>
        <span class="conservation-badge ${especie.estado_conservacion}">${getConservationLabel(especie.estado_conservacion)}</span>
      </div>
    </div>
    <div class="species-detail-content">
      <div class="row">
        <div class="col-md-6">
          <h4>Información General</h4>
          <ul>
            <li><strong>Hábitat:</strong> ${getHabitatLabel(especie.habitat)}</li>
            <li><strong>Tamaño:</strong> ${especie.longitud || 'No disponible'}</li>
            <li><strong>Esperanza de vida:</strong> ${especie.esperanza_vida || 'No disponible'}</li>
            <li><strong>Ubicación:</strong> ${especie.ubicacion || 'No disponible'}</li>
          </ul>
        </div>
        <div class="col-md-6">
          <h4>Estado de Conservación</h4>
          <p>${especie.descripcion}</p>
          ${especie.amenazas ? `
            <h5>Principales Amenazas:</h5>
            <ul>
              ${especie.amenazas.map(amenaza => `<li>${amenaza}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('species-modal-content').innerHTML = modalContent;
  document.getElementById('species-modal').style.display = 'block';
}

// Función para obtener etiqueta de conservación
function getConservationLabel(estado) {
  const labels = {
    'extincion-critica': 'Extinción Crítica',
    'peligro': 'En Peligro',
    'vulnerable': 'Vulnerable',
    'casi-amenazada': 'Casi Amenazada',
    'preocupacion-menor': 'Preocupación Menor'
  };
  return labels[estado] || estado;
}

// Función para obtener etiqueta de hábitat
function getHabitatLabel(habitat) {
  const labels = {
    'arrecife': 'Arrecifes de Coral',
    'aguas-profundas': 'Aguas Profundas',
    'aguas-abiertas': 'Aguas Abiertas',
    'costero': 'Zona Costera',
    'polar': 'Aguas Polares',
    'manglar': 'Manglares',
    'estuario': 'Estuarios'
  };
  return labels[habitat] || habitat;
}

// Función para cerrar modal de detalles
function closeSpeciesModal() {
  document.getElementById('species-modal').style.display = 'none';
}

// Función para actualizar el contador de especies
function actualizarContadorEspecies() {
  const contador = document.getElementById('especies-count');
  if (contador) {
    contador.textContent = filteredEspecies.length;
  }
}

// Función para aplicar filtros desde la API
async function aplicarFiltros() {
  const searchTerm = document.getElementById('search-especies').value;
  const habitatFilter = document.getElementById('habitat-filter').value;
  const conservationFilter = document.getElementById('conservation-filter').value;
  const typeFilter = document.getElementById('type-filter').value;
  const regionFilter = document.getElementById('region-filter').value;
  
  // Construir parámetros de consulta
  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);
  if (habitatFilter) params.append('habitat', habitatFilter);
  if (conservationFilter) params.append('conservation', conservationFilter);
  if (typeFilter) params.append('type', typeFilter);
  if (regionFilter) params.append('region', regionFilter);
  
  try {
    const response = await fetch(`/api/especies?${params}`);
    const data = await response.json();
    filteredEspecies = data.especies;
    currentPage = 1;
    renderEspecies();
    actualizarContadorEspecies();
  } catch (error) {
    console.error('Error al filtrar especies:', error);
    // Fallback a filtrado local
    filterEspecies();
  }
}

// Función para reportar avistamiento a la API
async function reportarAvistamiento(formData) {
  try {
    const response = await fetch('/api/reportar-avistamiento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('¡Gracias por reportar este avistamiento! Tu contribución ayuda a nuestros esfuerzos de conservación.');
      return true;
    } else {
      alert('Error al reportar avistamiento: ' + result.error);
      return false;
    }
  } catch (error) {
    console.error('Error al reportar avistamiento:', error);
    alert('Error de conexión. Por favor, intenta de nuevo.');
    return false;
  }
}

// Función para suscribir al newsletter
async function suscribirNewsletter(email) {
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.error };
    }
  } catch (error) {
    console.error('Error al suscribir al newsletter:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// Función para obtener detalles de una especie
async function obtenerDetallesEspecie(especieId) {
  try {
    const response = await fetch(`/api/especies/${especieId}`);
    const especie = await response.json();
    
    if (response.ok) {
      return especie;
    } else {
      console.error('Error al obtener detalles de la especie:', especie.error);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener detalles de la especie:', error);
    return null;
  }
}

// Funciones auxiliares
function getConservationText(status) {
  const statusMap = {
    'extincion-critica': 'Extinción Crítica',
    'peligro': 'En Peligro',
    'vulnerable': 'Vulnerable',
    'casi-amenazada': 'Casi Amenazada',
    'preocupacion-menor': 'Preocupación Menor'
  };
  return statusMap[status] || status;
}

function getHabitatText(habitat) {
  const habitatMap = {
    'arrecife': 'Arrecifes de Coral',
    'aguas-profundas': 'Aguas Profundas',
    'aguas-abiertas': 'Aguas Abiertas',
    'costero': 'Zona Costera',
    'polar': 'Aguas Polares'
  };
  return habitatMap[habitat] || habitat;
}

function downloadFactSheet(especieId) {
  alert(`Descargando ficha técnica de ${especieId}...`);
}

function shareSpecies(especieId) {
  if (navigator.share) {
    navigator.share({
      title: `Especie Marina - ${especieId}`,
      text: 'Descubre esta increíble especie marina en SWAY',
      url: window.location.href
    });
  } else {
    alert('Función de compartir no disponible en este navegador');
  }
}
