// Módulo para gestionar el ranking de participantes

// Referencias a elementos del DOM
let rankingContainer;
let modalParticipanteDetalle;
let participanteDetalleContenido;

// Cache para almacenar información de participantes y WOGs
let participantesDetallados = [];
let wogsCache = [];

// Función separada para cargar ranking
async function cargarRankingModule() {
    console.log('Cargando ranking (función separada)...');
    
    try {
        if (!rankingContainer) {
            rankingContainer = document.getElementById('ranking-container');
        }
        
        if (!rankingContainer) {
            console.warn('Contenedor de ranking no encontrado');
            return;
        }
        
        // Mostrar loader
        rankingContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Cargar datos completos
        await cargarDatosCompletos();
        
        // Verificar si hay participantes
        if (participantesDetallados.length === 0) {
            rankingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No hay participantes activos para mostrar en el ranking</p>
                </div>
            `;
            return;
        }
        
        // Limpiar contenedor
        rankingContainer.innerHTML = '';
        
        // Crear elemento para cada participante en el ranking
        participantesDetallados.forEach((participante, index) => {
            // Solo mostrar participantes con algún punto
            if (participante.puntosTotales <= 0) return;
            
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            rankingItem.setAttribute('data-id', participante.id);
            
            // HTML del elemento
            rankingItem.innerHTML = `
                <div class="ranking-position position-${index < 3 ? index + 1 : 'other'}">${index + 1}</div>
                
                <div class="ranking-avatar">
                    ${participante.imagen_url 
                        ? `<img src="${participante.imagen_url}" alt="${participante.nombre}">` 
                        : `<div class="avatar-placeholder">${window.obtenerIniciales(participante.nombre)}</div>`}
                </div>
                
                <div class="ranking-details">
                    <div class="ranking-name">${participante.nombre}</div>
                    <div class="ranking-stats">
                        <div class="ranking-stat">
                            <i class="fas fa-home"></i> ${participante.puntos_sede || 0}
                        </div>
                        <div class="ranking-stat">
                            <i class="fas fa-fire"></i> ${(participante.puntos_asador || 0).toFixed(1)}
                        </div>
                        <div class="ranking-stat">
                            <i class="fas fa-shopping-basket"></i> ${(participante.puntos_compras || 0).toFixed(1)}
                        </div>
                    </div>
                </div>
                
                <div class="ranking-points">${participante.puntosTotales.toFixed(1)}</div>
            `;
            
            // Añadir evento al hacer clic
            rankingItem.addEventListener('click', () => {
                mostrarDetalleParticipante(participante);
            });
            
            rankingContainer.appendChild(rankingItem);
        });
        
        // Mostrar mensaje si no hay participantes con puntos
        if (rankingContainer.children.length === 0) {
            rankingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No hay participantes con puntos todavía</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error al cargar ranking:', error);
        if (rankingContainer) {
            rankingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar ranking: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Modificar la función de inicialización
function initRankingModule() {
    console.log('Inicializando módulo de ranking...');
    
    // Obtener referencias a los elementos DOM
    rankingContainer = document.getElementById('ranking-container');
    modalParticipanteDetalle = document.getElementById('modal-participante-detalle');
    participanteDetalleContenido = document.getElementById('participante-detalle-contenido');
    
    // Verificar que los elementos existen
    if (!rankingContainer) {
        console.warn('Contenedor de ranking no encontrado');
        return;
    }
    
    // Cargar ranking inmediatamente
    cargarRankingModule();
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-ranking') {
            cargarRankingModule();
        }
    });
    
    // Escuchar eventos de actualización
    document.addEventListener('wogActualizado', cargarRankingModule);
    document.addEventListener('participantesActualizados', cargarRankingModule);
    
    // Configurar cierre del modal de detalle si existe
    if (modalParticipanteDetalle) {
        const closeButton = modalParticipanteDetalle.querySelector('.close-modal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modalParticipanteDetalle.style.display = 'none';
            });
        }
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (event) => {
            if (event.target === modalParticipanteDetalle) {
                modalParticipanteDetalle.style.display = 'none';
            }
        });
    }
    
    console.log('Módulo de ranking inicializado correctamente');
}

// Resto del código (cargarDatosCompletos y otras funciones) se mantiene igual...

// Función para mostrar detalle de participante
function mostrarDetalleParticipante(participante) {
    console.log('Mostrando detalle de participante:', participante);
    
    // Verificar que el participante exista
    if (!participante) {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Datos del participante no disponibles', true);
        } else {
            console.error('Datos del participante no disponibles');
        }
        return;
    }
    
    // Verificar que el modal y su contenido existan
    if (!modalParticipanteDetalle || !participanteDetalleContenido) {
        console.error('Elementos del modal no encontrados');
        return;
    }
    
    // HTML para el detalle del participante (similar al código anterior)
    participanteDetalleContenido.innerHTML = `
        <div class="participante-detalle-header">
            ${participante.imagen_url 
                ? `<img src="${participante.imagen_url}" alt="${participante.nombre}">`
                : `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 5rem; color: white;">${window.obtenerIniciales(participante.nombre)}</div>`}
            
            <div class="overlay">
                <h2>${participante.nombre}</h2>
                ${participante.apodo && participante.apodo !== participante.nombre 
                    ? `<div class="apodo">${participante.apodo}</div>`
                    : ''}
            </div>
        </div>
        
        <!-- Resto del contenido del detalle -->
    `;
    
    // Mostrar modal
    if (modalParticipanteDetalle) {
        modalParticipanteDetalle.style.display = 'block';
    }
}

// Exportar funciones globales
window.cargarRanking = cargarRankingModule;
window.mostrarDetalleParticipante = mostrarDetalleParticipante;