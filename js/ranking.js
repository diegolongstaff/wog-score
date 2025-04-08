// Módulo para gestionar el ranking de participantes

// Referencias a elementos del DOM
let rankingContainer;
let modalParticipanteDetalle;
let participanteDetalleContenido;

// Cache para almacenar información de participantes y WOGs
let participantesDetallados = [];
let wogsCache = [];

// Inicializar módulo
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
    cargarRanking();
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-ranking') {
            cargarRanking();
        }
    });
    
    // Escuchar eventos de actualización
    document.addEventListener('wogActualizado', cargarRanking);
    document.addEventListener('participantesActualizados', cargarRanking);
    
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

// Resto del código anterior se mantiene igual...

// Nueva función global para mostrar detalle de participante
function mostrarDetalleParticipante(participante) {
    // Verificar que el participante exista
    if (!participante) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Datos del participante no disponibles', true);
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
    
    // Calcular estadísticas adicionales
    const totalWogs = wogsCache.length || 0;
    
    // Calcular porcentaje de contribución al total de puntos
    const totalPuntosGlobales = participantesDetallados.reduce(
        (sum, p) => sum + (p.puntosTotales || 0), 0
    );
    
    const porcentajeContribucionGlobal = totalPuntosGlobales > 0 
        ? Math.round(((participante.puntosTotales || 0) / totalPuntosGlobales) * 100) 
        : 0;
    
    // Encontrar la posición en el ranking
    const posicionRanking = participantesDetallados.findIndex(p => p.id === participante.id) + 1;
    
    // Generar HTML para el detalle
    participanteDetalleContenido.innerHTML = `
        <div class="participante-detalle-header">
            ${participante.imagen_url 
                ? `<img src="${participante.imagen_url}" alt="${participante.nombre}">`
                : `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 5rem; color: white;">${obtenerIniciales(participante.nombre)}</div>`}
            
            <div class="overlay">
                <h2>${participante.nombre}</h2>
                ${participante.apodo && participante.apodo !== participante.nombre 
                    ? `<div class="apodo">${participante.apodo}</div>`
                    : ''}
            </div>
        </div>
        
        <div class="participante-detalle-body">
            <div class="participante-detalle-stats">
                <div class="participante-detalle-stat">
                    <div class="valor">${(participante.puntosTotales || 0).toFixed(1)}</div>
                    <div class="etiqueta">Puntos Totales</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${posicionRanking}°</div>
                    <div class="etiqueta">Ranking</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${participante.totalAsistencias || 0}</div>
                    <div class="etiqueta">Asistencias</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${(participante.porcentajeAsistencia || 0)}%</div>
                    <div class="etiqueta">% Asistencia</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${participante.vecesSede || 0}</div>
                    <div class="etiqueta">Veces Sede</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${(participante.vecesAsador || 0) + (participante.asadorCompartido || 0)}</div>
                    <div class="etiqueta">Veces Asador</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${(participante.vecesCompras || 0) + (participante.comprasCompartido || 0)}</div>
                    <div class="etiqueta">Veces Compras</div>
                </div>
                
                <div class="participante-detalle-stat">
                    <div class="valor">${porcentajeContribucionGlobal}%</div>
                    <div class="etiqueta">% del Total</div>
                </div>
            </div>
            
            <h3 style="margin-top: 20px; margin-bottom: 15px;">Contribución por Rol</h3>
            
            <div class="participante-grafico">
                <div class="barra-grafico">
                    <div class="barra-grafico-fill" style="width: ${participante.porcentajeSede || 0}%;"></div>
                    <div class="barra-grafico-label">Sede</div>
                    <div class="barra-grafico-value">${participante.porcentajeSede || 0}%</div>
                </div>
                
                <div class="barra-grafico">
                    <div class="barra-grafico-fill" style="width: ${participante.porcentajeAsador || 0}%;"></div>
                    <div class="barra-grafico-label">Asador</div>
                    <div class="barra-grafico-value">${participante.porcentajeAsador || 0}%</div>
                </div>
                
                <div class="barra-grafico">
                    <div class="barra-grafico-fill" style="width: ${participante.porcentajeCompras || 0}%;"></div>
                    <div class="barra-grafico-label">Compras</div>
                    <div class="barra-grafico-value">${participante.porcentajeCompras || 0}%</div>
                </div>
                
                <div class="barra-grafico">
                    <div class="barra-grafico-fill" style="width: ${participante.porcentajeAsistencia || 0}%;"></div>
                    <div class="barra-grafico-label">Asistencia</div>
                    <div class="barra-grafico-value">${participante.porcentajeAsistencia || 0}%</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size: 0.9rem; color: #777; text-align: center;">
                * Los porcentajes de roles se calculan respecto al total de asistencias
            </div>
        </div>
    `;
    
    // Mostrar modal
    if (modalParticipanteDetalle) {
        modalParticipanteDetalle.style.display = 'block';
    }
}

// Exportar funciones necesarias al alcance global
window.mostrarDetalleParticipante = mostrarDetalleParticipante;