// Variables globales
let especiesData = [];
let filteredEspecies = [];
let currentPage = 1;
const itemsPerPage = 12;

// Datos simulados de especies
const especiesSimuladas = [
  {
    id: 'tortuga-verde',
    nombre: 'Tortuga Marina Verde',
    nombreCientifico: 'Chelonia mydas',
    habitat: 'costero',
    conservacion: 'vulnerable',
    tipo: 'reptiles',
    tamaño: '1.5m',
    ubicacion: 'Océanos tropicales',
    vida: '80 años',
    imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    descripcion: 'La tortuga verde es una de las especies de tortugas marinas más grandes...',
    amenazas: ['Contaminación plástica', 'Pérdida de playas de anidación', 'Pesca incidental'],
    poblacion: '85,000-90,000 hembras anidadoras'
  },
  {
    id: 'ballena-azul',
    nombre: 'Ballena Azul',
    nombreCientifico: 'Balaenoptera musculus',
    habitat: 'aguas-abiertas',
    conservacion: 'peligro',
    tipo: 'mamiferos',
    tamaño: '30m',
    ubicacion: 'Todos los océanos',
    vida: '90 años',
    imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    descripcion: 'El animal más grande que ha existido en la Tierra...',
    amenazas: ['Colisiones con barcos', 'Contaminación acústica', 'Cambio climático'],
    poblacion: '10,000-25,000 individuos'
  }
  // Más especies...
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  especiesData = especiesSimuladas;
  filteredEspecies = [...especiesData];
  renderEspecies();
  setupEventListeners();
});

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
                         especie.nombreCientifico.toLowerCase().includes(searchTerm);
    const matchesHabitat = !habitatFilter || especie.habitat === habitatFilter;
    const matchesConservation = !conservationFilter || especie.conservacion === conservationFilter;
    const matchesType = !typeFilter || especie.tipo === typeFilter;
    
    return matchesSearch && matchesHabitat && matchesConservation && matchesType;
  });
  
  currentPage = 1;
  renderEspecies();
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
        return conservationOrder[a.conservacion] - conservationOrder[b.conservacion];
      case 'size':
        return parseFloat(a.tamaño) - parseFloat(b.tamaño);
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
    <div class="especie-card" data-habitat="${especie.habitat}" data-conservation="${especie.conservacion}" data-type="${especie.tipo}">
      <div class="especie-image">
        <img src="${especie.imagen}" alt="${especie.nombre}">
        <div class="conservation-badge ${especie.conservacion}">${getConservationText(especie.conservacion)}</div>
      </div>
      <div class="especie-content">
        <h3>${especie.nombre}</h3>
        <p class="scientific-name">${especie.nombreCientifico}</p>
        <div class="especie-stats">
          <div class="stat">
            <i class="bi bi-rulers"></i>
            <span>${especie.tamaño} longitud</span>
          </div>
          <div class="stat">
            <i class="bi bi-geo-alt"></i>
            <span>${especie.ubicacion}</span>
          </div>
          <div class="stat">
            <i class="bi bi-heart-pulse"></i>
            <span>Vida: ${especie.vida}</span>
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

// Abrir detalles de especie
function openSpeciesDetail(especieId) {
  const especie = especiesData.find(e => e.id === especieId);
  if (!especie) return;
  
  const modal = document.getElementById('species-modal');
  const content = document.getElementById('species-modal-content');
  
  content.innerHTML = `
    <div class="species-detail">
      <div class="row">
        <div class="col-lg-6">
          <img src="${especie.imagen}" alt="${especie.nombre}" class="img-fluid rounded">
        </div>
        <div class="col-lg-6">
          <h2>${especie.nombre}</h2>
          <h4 class="scientific-name">${especie.nombreCientifico}</h4>
          <div class="conservation-status ${especie.conservacion}">
            <strong>Estado de Conservación:</strong> ${getConservationText(especie.conservacion)}
          </div>
          
          <h5 class="mt-4">Características</h5>
          <ul class="characteristics">
            <li><strong>Tamaño:</strong> ${especie.tamaño}</li>
            <li><strong>Hábitat:</strong> ${getHabitatText(especie.habitat)}</li>
            <li><strong>Distribución:</strong> ${especie.ubicacion}</li>
            <li><strong>Esperanza de vida:</strong> ${especie.vida}</li>
            <li><strong>Población estimada:</strong> ${especie.poblacion || 'Desconocida'}</li>
          </ul>
          
          <h5 class="mt-4">Principales Amenazas</h5>
          <ul class="threats">
            ${especie.amenazas ? especie.amenazas.map(amenaza => `<li>${amenaza}</li>`).join('') : '<li>No especificadas</li>'}
          </ul>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-12">
          <h5>Descripción Detallada</h5>
          <p>${especie.descripcion}</p>
          
          <div class="action-buttons mt-4">
            <button class="btn-primary" onclick="reportSighting('${especie.id}')">
              <i class="bi bi-camera"></i> Reportar Avistamiento
            </button>
            <button class="btn-secondary" onclick="downloadFactSheet('${especie.id}')">
              <i class="bi bi-download"></i> Descargar Ficha
            </button>
            <button class="btn-secondary" onclick="shareSpecies('${especie.id}')">
              <i class="bi bi-share"></i> Compartir
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Cerrar modal
function closeSpeciesModal() {
  document.getElementById('species-modal').style.display = 'none';
}

// Reportar avistamiento
function reportSighting(especieId) {
  // Simulación de reporte de avistamiento
  alert(`Función de reporte de avistamiento para ${especieId}. En la implementación real, esto abriría un formulario para reportar el avistamiento con ubicación, fecha, foto, etc.`);
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
