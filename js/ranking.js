// Módulo para gestionar el ranking de participantes

// Referencias a elementos del DOM
let rankingContainer;
let modalParticipanteDetalle;
let participanteDetalleContenido;

// Cache para almacenar información de participantes y WOGs
let participantesDetallados = [];
let wogsCache = [];

// Cargar datos completos de participantes y WOGs
async function cargarDatosCompletos() {
    try {
        // Cargar participantes activos
        const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .get();
        
        // Cargar todos los WOGs
        const wogsSnapshot = await db.collection(COLECCION_WOGS).get();
        wogsCache = wogsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const totalWogs = wogsCache.length;
        
        // Procesar participantes
        participantesDetallados = participantesSnapshot.docs.map(function(doc) {
            const data = doc.data();
            const id = doc.id;
            
            // Contadores
            let totalAsistencias = 0;
            let vecesSede = data.puntos_sede || 0;
            let vecesAsador = 0;
            let asadorCompartido = 0;
            let vecesCompras = 0;
            let comprasCompartido = 0;
            
            // Contar participaciones en WOGs
            wogsCache.forEach(wog => {
                // Contar asistencias
                if (wog.asistentes && wog.asistentes.includes(id)) {
                    totalAsistencias++;
                }
                
                // Contar veces como asador
                if (wog.asadores && wog.asadores.includes(id)) {
                    if (wog.asadores.length > 1) {
                        asadorCompartido++;
                    } else {
                        vecesAsador++;
                    }
                }
                
                // Contar veces en compras
                if (wog.comprasCompartidas && wog.comprasCompartidas.includes(id)) {
                    comprasCompartido++;
                } else if (wog.compras === id) {
                    vecesCompras++;
                }
            });
            
            // Calcular estadísticas
            const puntosTotales = (data.puntos_sede || 0) + 
                                 (data.puntos_asador || 0) + 
                                 (data.puntos_compras || 0);
            
            const porcentajeAsistencia = totalWogs > 0 
                ? Math.round((totalAsistencias / totalWogs) * 100) 
                : 0;
            
            const porcentajeSede = totalAsistencias > 0 
                ? Math.round((vecesSede / totalAsistencias) * 100) 
                : 0;
            
            const porcentajeAsador = totalAsistencias > 0 
                ? Math.round(((vecesAsador + asadorCompartido) / totalAsistencias) * 100) 
                : 0;
            
            const porcentajeCompras = totalAsistencias > 0 
                ? Math.round(((vecesCompras + comprasCompartido) / totalAsistencias) * 100) 
                : 0;
            
            return {
                id,
                ...data,
                puntosTotales,
                totalAsistencias,
                vecesSede,
                vecesAsador,
                asadorCompartido,
                vecesCompras,
                comprasCompartido,
                porcentajeAsistencia,
                porcentajeSede,
                porcentajeAsador,
                porcentajeCompras
            };
        });
        
        // Ordenar por puntos (de mayor a menor)
        participantesDetallados.sort((a, b) => b.puntosTotales - a.puntosTotales);
        
    } catch (error) {
        console.error('Error al cargar datos completos:', error);
        throw error;
    }
}

// Función para cargar ranking
async function cargarRanking() {
    console.log('Cargando ranking...');
    
    try {
        // Obtener contenedor de ranking
        const rankingContainer = document.getElementById('ranking-container');
        
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
                        : `<div class="avatar-placeholder">${obtenerIniciales(participante.nombre)}</div>`}
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
        const rankingContainer = document.getElementById('ranking-container');
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

// Inicializar módulo de ranking
function initRankingModule() {
    console.log('Inicializando módulo de ranking...');
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-ranking') {
            cargarRanking();
        }
    });
    
    // Escuchar eventos de actualización
    document.addEventListener('wogActualizado', cargarRanking);
    document.addEventListener('participantesActualizados', cargarRanking);
    
    // Cargar ranking inicial
    cargarRanking();
    
    console.log('Módulo de ranking inicializado correctamente');
}

// Función para mostrar detalle de participante
function mostrarDetalleParticipante(participante) {
    console.log('Mostrando detalle de participante:', participante);
    
    // Obtener referencias a los elementos
    const modalParticipanteDetalle = document.getElementById('modal-participante-detalle');
    const participanteDetalleContenido = document.getElementById('participante-detalle-contenido');
    
    // Verificar que el participante exista
    if (!participante) {
        mostrarToast('Datos del participante no disponibles', true);
        return;
    }
    
    // Verificar que el modal y su contenido existan
    if (!modalParticipanteDetalle || !participanteDetalleContenido) {
        console.error('Elementos del modal no encontrados');
        return;
    }
    
    // HTML para el detalle del participante
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
                    <div class="valor">${participante.totalAsistencias || 0}</div>
                    <div class="etiqueta">Asistencias</div>
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
            </div>
        </div>
    `;
    
    // Mostrar modal
    modalParticipanteDetalle.style.display = 'block';
}

// Exportar funciones globales
window.cargarRanking = cargarRanking;
window.mostrarDetalleParticipante = mostrarDetalleParticipante;