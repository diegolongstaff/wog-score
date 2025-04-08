// Módulo para gestionar el historial de WOGs

// Referencias a elementos del DOM (sin declarar inicialmente)
let historialContainer;
let modalConfirmacion;
let modalConfirmacionTitulo;
let modalConfirmacionMensaje;
let btnConfirmarAccion;
let btnCancelarConfirmacion;
let modalNotas;
let modalNotasTitulo;
let modalNotasContenido;
let btnCerrarNotas;

// Variable para almacenar el ID del WOG a eliminar
let wogAEliminar = null;

// Inicializar módulo
function initHistorialModule() {
    console.log('Inicializando módulo de historial...');
    
    // Obtener referencias a elementos del DOM
    historialContainer = document.getElementById('historial-container');
    modalConfirmacion = document.getElementById('modal-confirmacion');
    modalConfirmacionTitulo = document.getElementById('modal-confirmacion-titulo');
    modalConfirmacionMensaje = document.getElementById('modal-confirmacion-mensaje');
    btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
    btnCancelarConfirmacion = document.getElementById('btn-cancelar-confirmacion');
    modalNotas = document.getElementById('modal-notas');
    modalNotasTitulo = document.getElementById('modal-notas-titulo');
    modalNotasContenido = document.getElementById('modal-notas-contenido');
    btnCerrarNotas = document.getElementById('btn-cerrar-notas');
    
    // Verificar elementos esenciales
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
    if (btnCancelarConfirmacion) {
        btnCancelarConfirmacion.addEventListener('click', function() {
            if (modalConfirmacion) modalConfirmacion.style.display = 'none';
        });
    }
    
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', function() {
            if (modalNotas) modalNotas.style.display = 'none';
        });
    }
    
    console.log('Módulo de historial inicializado correctamente');
}

// Función simplificada para cargar el historial
async function cargarHistorialSimple() {
    if (!historialContainer) return;
    
    try {
        console.log('Cargando historial de WOGs...');
        
        // Mostrar loader
        historialContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener WOGs de Firestore
        const snapshot = await db.collection('wogs').get();
        console.log('Datos recibidos de Firestore:', snapshot.size, 'documentos');
        
        // Verificar si hay WOGs
        if (snapshot.empty) {
            console.log('No se encontraron WOGs');
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
        
        // Crear elemento para cada WOG
        snapshot.docs.forEach(doc => {
            const wog = doc.data();
            const fecha = wog.fecha ? wog.fecha.toDate() : new Date();
            
            const wogElement = document.createElement('div');
            wogElement.className = 'historial-item';
            
            // HTML del elemento
            wogElement.innerHTML = `
                <div class="historial-header">
                    <div class="historial-fecha">
                        ${fecha.toLocaleDateString('es-ES', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                        ${wog.notas ? '<span class="badge-notas">Notas</span>' : ''}
                    </div>
                    <div class="historial-acciones">
                        ${wog.notas ? `
                            <button class="historial-accion notas" onclick="mostrarNotasWogSimple('${doc.id}')">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                        ` : ''}
                        <button class="historial-accion eliminar" onclick="confirmarEliminarWogSimple('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="historial-detalles">
                    <div class="historial-detail">
                        <div class="historial-label">ID</div>
                        <div class="historial-value">${doc.id}</div>
                    </div>
                    
                    <div class="historial-detail">
                        <div class="historial-label">Sede</div>
                        <div class="historial-value">${wog.sede || '-'}</div>
                    </div>
                    
                    <div class="historial-detail">
                        <div class="historial-label">Subsede</div>
                        <div class="historial-value">${wog.subsede || '-'}</div>
                    </div>
                </div>
            `;
            
            historialContainer.appendChild(wogElement);
        });
        
        console.log('Historial cargado exitosamente con', snapshot.size, 'elementos');
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
        historialContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar historial: ${error.message}</p>
            </div>
        `;
    }
}

// Mostrar notas de un WOG (versión simple)
async function mostrarNotasWogSimple(wogId) {
    try {
        // Verificar que los elementos del modal existan
        if (!modalNotas || !modalNotasTitulo || !modalNotasContenido) {
            console.error('Elementos del modal de notas no encontrados');
            return;
        }
        
        // Obtener los datos del WOG
        const doc = await db.collection('wogs').doc(wogId).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
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
        mostrarToast('Error al cargar notas del WOG', true);
    }
}

// Confirmar eliminación de un WOG (versión simple)
function confirmarEliminarWogSimple(id) {
    // Verificar que los elementos del modal existan
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
        }
        
        // Eliminar el WOG
        await docRef.delete();
        
        // Cerrar modal
        if (modalConfirmacion) {
            modalConfirmacion.style.display = 'none';
        }
        
        // Mostrar mensaje
        mostrarToast('WOG eliminado correctamente');
        
        // Recargar historial
        cargarHistorialSimple();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al eliminar WOG:', error);
        mostrarToast('Error al eliminar WOG: ' + error.message, true);
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