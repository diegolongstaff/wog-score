// Módulo para gestionar el ranking de participantes

// Referencias a elementos del DOM
const rankingContainer = document.getElementById('ranking-container');

// Inicializar módulo
function initRankingModule() {
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-ranking') {
            cargarRanking();
        }
    });
    
    // Escuchar eventos de actualización
    document.addEventListener('wogActualizado', cargarRanking);
    document.addEventListener('participantesActualizados', cargarRanking);
}

// Cargar ranking de participantes
async function cargarRanking() {
    try {
        // Mostrar loader
        rankingContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener participantes de Firestore
        const snapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .get();
        
        // Verificar si hay participantes
        if (snapshot.empty) {
            rankingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No hay participantes activos para mostrar en el ranking</p>
                </div>
            `;
            return;
        }
        
        // Preparar array de participantes con puntuación
        const participantes = snapshot.docs.map(doc => {
            const data = doc.data();
            // Calcular puntos totales
            const puntosTotales = (data.puntos_sede || 0) + 
                                  (data.puntos_asador || 0) + 
                                  (data.puntos_compras || 0);
            
            return {
                id: doc.id,
                ...data,
                puntosTotales
            };
        });
        
        // Ordenar por puntos (de mayor a menor)
        participantes.sort((a, b) => b.puntosTotales - a.puntosTotales);
        
        // Obtener información de WOGs para estadísticas
        const asistenciasSnapshot = await db.collection(COLECCION_WOGS).get();
        const totalWogs = asistenciasSnapshot.size;
        
        // Contar asistencias por participante
        const asistenciasPorParticipante = {};
        
        asistenciasSnapshot.docs.forEach(doc => {
            const wog = doc.data();
            if (wog.asistentes && Array.isArray(wog.asistentes)) {
                wog.asistentes.forEach(id => {
                    asistenciasPorParticipante[id] = (asistenciasPorParticipante[id] || 0) + 1;
                });
            }
        });
        
        // Limpiar contenedor
        rankingContainer.innerHTML = '';
        
        // Crear elemento para cada participante en el ranking
        participantes.forEach((participante, index) => {
            // Solo mostrar participantes con algún punto
            if (participante.puntosTotales <= 0) return;
            
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            
            // Calcular estadísticas
            const totalAsistencias = asistenciasPorParticipante[participante.id] || 0;
            const porcentajeAsistencia = totalWogs > 0 
                ? Math.round((totalAsistencias / totalWogs) * 100) 
                : 0;
            
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
                        <div class="ranking-stat">
                            <i class="fas fa-calendar-check"></i> ${porcentajeAsistencia}%
                        </div>
                    </div>
                </div>
                
                <div class="ranking-points">${participante.puntosTotales.toFixed(1)}</div>
            `;
            
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
        rankingContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar ranking</p>
            </div>
        `;
    }
}
