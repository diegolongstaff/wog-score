// Módulo para gestionar el historial de WOGs

// Variables locales al módulo
let wogAEliminar = null;

// Inicializar módulo
function initHistorialModule() {
    console.log('Inicializando módulo de historial...');
    
    // Obtener referencias a elementos DOM
    const historialContainer = document.getElementById('historial-container');
    
    // Verificar elemento esencial
    if (!historialContainer) {
        console.warn('Elemento historialContainer no encontrado');
        return;
    }
    
    // Cargar historial inmediatamente
    cargarHistorialSimple();
    
    // Configurar eventos de pestañas
    document.addEventListener('tabChanged', function(event) {
        if (event.detail && event.detail.tabId === 'tab-historial') {
            cargarHistorialSimple();
        }
    });
    
    // Configurar botones de modales
    const btnCancelarConfirmacion = document.getElementById('btn-cancelar-confirmacion');
    if (btnCancelarConfirmacion) {
        btnCancelarConfirmacion.addEventListener('click', function() {
            const modalConfirmacion = document.getElementById('modal-confirmacion');
            if (modalConfirmacion) modalConfirmacion.style.display = 'none';
        });
    }
    
    const btnCerrarNotas = document.getElementById('btn-cerrar-notas');
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', function() {
            const modalNotas = document.getElementById('modal-notas');
            if (modalNotas) modalNotas.style.display = 'none';
        });
    }
    
    console.log('Módulo de historial inicializado correctamente');
}

// Función simplificada para cargar el historial con diagnóstico
async function cargarHistorialSimple() {
    const historialContainer = document.getElementById('historial-container');
    if (!historialContainer) {
        console.error('Contenedor de historial no encontrado');
        return;
    }
    
    try {
        console.log('🔍 Diagnóstico de carga de historial...');
        
        // Mostrar loader
        historialContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener WOGs de Firestore
        const wogsSnapshot = await db.collection('wogs').get();
        console.log('📊 Resumen de WOGs:');
        console.log('Número total de WOGs:', wogsSnapshot.size);
        
        // Obtener datos de participantes para nombres
        const participantesSnapshot = await db.collection('participantes').get();
        const participantesMap = {};
        participantesSnapshot.docs.forEach(doc => {
            participantesMap[doc.id] = doc.data().nombre || 'Desconocido';
        });
        
        console.log('📋 Participantes encontrados:', Object.keys(participantesMap).length);
        
        // Verificar si hay WOGs
        if (wogsSnapshot.empty) {
            console.warn('⚠️ No se encontraron WOGs');
            historialContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No hay WOGs registrados todavía</p>
                </div>
            `;
            return;
        }
        
        // Limpiar contenedor
        historialContainer.innerHTML = '';
        
        // Ordenar WOGs por fecha (más reciente primero)
        const wogsOrdenados = wogsSnapshot.docs.sort((a, b) => {
            const fechaA = a.data().fecha.toDate();
            const fechaB = b.data().fecha.toDate();
            return fechaB - fechaA;
        });
        
        wogsOrdenados.forEach(doc => {
            const wog = doc.data();
            const fecha = wog.fecha ? wog.fecha.toDate() : new Date();
            
            // Funciones auxiliares para mapear IDs a nombres
            const mapearNombres = (ids) => ids 
                ? ids.map(id => participantesMap[id] || 'Desconocido').join(', ')
                : 'No disponible';
            
            const sedeNombre = participantesMap[wog.sede] || 'Desconocido';
            const asadoresNombres = mapearNombres(wog.asadores);
            const asistentesNombres = mapearNombres(wog.asistentes);
            
            // Determinar compradores
            let compradoresNombres = 'No disponible';
            if (wog.compradores) {
                compradoresNombres = mapearNombres(wog.compradores);
            } else if (wog.compras) {
                compradoresNombres = participantesMap[wog.compras] || 'Desconocido';
            } else if (wog.comprasCompartidas) {
                compradoresNombres = mapearNombres(wog.comprasCompartidas);
            }
            
            const wogElement = document.createElement('div');
            wogElement.className = 'historial-item';
            
            // HTML del elemento
            wogElement.innerHTML = `
                <div class="historial-header">
                    <div class="historial-fecha">
                        ${fecha.toLocaleDateString('es-ES', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                        ${wog.notas ? '<span class="badge-notas">Notas</span>' : ''}
                    </div>
                    // In the historial-header section, add the edit button
                    <div class="historial-acciones">
                        ${wog.notas ? `
                            <button class="historial-accion notas" onclick="mostrarNotasWogSimple('${doc.id}')">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                        ` : ''}
                        <button class="historial-accion editar" onclick="editarWog('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="historial-accion eliminar" onclick="confirmarEliminarWogSimple('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="historial-detalles">
                    <div class="historial-detail">
                        <div class="historial-label">Sede</div>
                        <div class="historial-value">${sedeNombre}</div>
                    </div>
                    
                    <div class="historial-detail">
                        <div class="historial-label">Subsede</div>
                        <div class="historial-value">${wog.subsede || '-'}</div>
                    </div>
                    
                    <div class="historial-detail">
                        <div class="historial-label">Asador(es)</div>
                        <div class="historial-value">${asadoresNombres}</div>
                    </div>
                    
                    <div class="historial-detail">
                        <div class="historial-label">Comprador(es)</div>
                        <div class="historial-value">${compradoresNombres}</div>
                    </div>
                    
                    <div class="historial-detail historial-asistentes">
                        <div class="historial-label">Asistentes</div>
                        <div class="historial-value">${asistentesNombres}</div>
                    </div>
                </div>
            `;
            
            historialContainer.appendChild(wogElement);
        });
        
        console.log('✅ Historial cargado exitosamente');
        
    } catch (error) {
        console.error('❌ Error detallado al cargar historial:', error);
        historialContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar historial: ${error.message}</p>
                <p>Revisa la consola para más detalles</p>
            </div>
        `;
    }
}
// Mostrar notas de un WOG (versión simple)
async function mostrarNotasWogSimple(wogId) {
    try {
        // Obtener elementos del DOM
        const modalNotas = document.getElementById('modal-notas');
        const modalNotasTitulo = document.getElementById('modal-notas-titulo');
        const modalNotasContenido = document.getElementById('modal-notas-contenido');
        
        // Verificar que los elementos existan
        if (!modalNotas || !modalNotasTitulo || !modalNotasContenido) {
            console.error('Elementos del modal de notas no encontrados');
            return;
        }
        
        // Obtener los datos del WOG
        const doc = await db.collection('wogs').doc(wogId).get();
        
        if (!doc.exists) {
            window.mostrarToast('No se encontró el WOG', true);
            return;
        }
        
        const wog = doc.data();
        const fecha = wog.fecha?.toDate ? wog.fecha.toDate() : new Date();
        
        // Configurar el modal
        modalNotasTitulo.textContent = `Notas del WOG - ${fecha.toLocaleDateString('es-ES')}`;
        
        // Mostrar contenido o placeholder
        if (wog.notas && wog.notas.trim()) {
            modalNotasContenido.textContent = wog.notas;
        } else {
            modalNotasContenido.innerHTML = '<div class="notas-placeholder">No hay notas registradas para este WOG.</div>';
        }
        
        // Mostrar modal
        modalNotas.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar notas:', error);
        window.mostrarToast('Error al cargar notas del WOG', true);
    }
}

// Confirmar eliminación de un WOG (versión simple)
function confirmarEliminarWogSimple(id) {
    // Obtener elementos del DOM
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const modalConfirmacionTitulo = document.getElementById('modal-confirmacion-titulo');
    const modalConfirmacionMensaje = document.getElementById('modal-confirmacion-mensaje');
    const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
    
    // Verificar que los elementos existan
    if (!modalConfirmacion || !modalConfirmacionTitulo || !modalConfirmacionMensaje || !btnConfirmarAccion) {
        console.error('Elementos del modal de confirmación no encontrados');
        return;
    }
    
    wogAEliminar = id;
    
    // Configurar modal de confirmación
    modalConfirmacionTitulo.textContent = 'Eliminar WOG';
    modalConfirmacionMensaje.innerHTML = `
        <p>¿Estás seguro de que deseas eliminar este WOG?</p>
        <p>Esta acción no se puede deshacer.</p>
    `;
    
    // Configurar botón de confirmación
    btnConfirmarAccion.textContent = 'Eliminar';
    btnConfirmarAccion.className = 'btn btn-danger';
    btnConfirmarAccion.onclick = eliminarWogSimple;
    
    // Mostrar modal
    modalConfirmacion.style.display = 'block';
}

// Eliminar un WOG (versión simple)
async function eliminarWogSimple() {
    if (!wogAEliminar) return;
    
    // Obtener botón de confirmar
    const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    
    // Verificar que los elementos necesarios existan
    if (!btnConfirmarAccion) {
        console.error('Botón de confirmar acción no encontrado');
        return;
    }
    
    try {
        // Cambiar botón a estado de carga
        btnConfirmarAccion.disabled = true;
        btnConfirmarAccion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        // Obtener datos del WOG para poder restar puntos
        const docRef = db.collection('wogs').doc(wogAEliminar);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const wogData = doc.data();
            
            // Usar el módulo de puntuación para restar puntos
            if (typeof window.restarPuntuaciones === 'function') {
                await window.restarPuntuaciones(wogData);
            } else {
                console.warn('Función restarPuntuaciones no disponible');
            }
            
            // Eliminar el WOG
            await docRef.delete();
        } else {
            console.warn('No se encontró el WOG a eliminar');
        }
        
        // Cerrar modal
        if (modalConfirmacion) {
            modalConfirmacion.style.display = 'none';
        }
        
        // Mostrar mensaje
        window.mostrarToast('WOG eliminado correctamente');
        
        // Recargar historial
        cargarHistorialSimple();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al eliminar WOG:', error);
        window.mostrarToast('Error al eliminar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        if (btnConfirmarAccion) {
            btnConfirmarAccion.disabled = false;
            btnConfirmarAccion.innerHTML = 'Eliminar';
        }
        
        // Limpiar variable
        wogAEliminar = null;
    }
}

// Exportar funciones necesarias al alcance global
window.mostrarNotasWogSimple = mostrarNotasWogSimple;
window.confirmarEliminarWogSimple = confirmarEliminarWogSimple;
window.cargarHistorialSimple = cargarHistorialSimple;