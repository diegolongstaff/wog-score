// Módulo para gestionar el historial de WOGs

// Referencias a elementos del DOM
const historialContainer = document.getElementById('historial-container');
const modalConfirmacionHistorial = document.getElementById('modal-confirmacion');
const modalConfirmacionTituloHistorial = document.getElementById('modal-confirmacion-titulo');
const modalConfirmacionMensajeHistorial = document.getElementById('modal-confirmacion-mensaje');
const btnConfirmarAccionHistorial = document.getElementById('btn-confirmar-accion'); // Renamed to avoid conflict
const btnCancelarConfirmacion = document.getElementById('btn-cancelar-confirmacion');
const modalNotas = document.getElementById('modal-notas');
const modalNotasTitulo = document.getElementById('modal-notas-titulo');
const modalNotasContenido = document.getElementById('modal-notas-contenido');
const btnCerrarNotas = document.getElementById('btn-cerrar-notas');

// Variable para almacenar el ID del WOG a eliminar
let wogAEliminar = null;

// Inicializar módulo
function initHistorialModule() {
    console.log('Inicializando módulo de historial (versión simple)...');
    
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
            modalConfirmacionHistorial.style.display = 'none';
        });
    }
    
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', function() {
            modalNotas.style.display = 'none';
        });
    }
    
    console.log('Módulo de historial inicializado correctamente');
}

// Función simplificada para cargar el historial
async function cargarHistorialSimple() {
    try {
        console.log('Cargando historial de WOGs (versión simple)...');
        
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
    wogAEliminar = id;
    
    // Configurar modal de confirmación
    modalConfirmacionTituloHistorial.textContent = 'Eliminar WOG';
    modalConfirmacionMensajeHistorial.innerHTML = `
        <p>¿Estás seguro de que deseas eliminar este WOG?</p>
        <p>Esta acción no se puede deshacer.</p>
    `;
    
    // Configurar botón de confirmación
    btnConfirmarAccionHistorial.textContent = 'Eliminar';
    btnConfirmarAccionHistorial.className = 'btn btn-danger';
    btnConfirmarAccionHistorial.onclick = eliminarWogSimple;
    
    // Mostrar modal
    modalConfirmacionHistorial.style.display = 'block';
}

// Eliminar un WOG (versión simple)
async function eliminarWogSimple() {
    if (!wogAEliminar) return;
    
    try {
        // Cambiar botón a estado de carga
        btnConfirmarAccionHistorial.disabled = true;
        btnConfirmarAccionHistorial.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        // Eliminar directamente
        await db.collection('wogs').doc(wogAEliminar).delete();
        
        // Cerrar modal
        modalConfirmacionHistorial.style.display = 'none';
        
        // Mostrar mensaje
        mostrarToast('WOG eliminado correctamente');
        
        // Recargar historial
        cargarHistorialSimple();
        
    } catch (error) {
        console.error('Error al eliminar WOG:', error);
        mostrarToast('Error al eliminar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        btnConfirmarAccionHistorial.disabled = false;
        btnConfirmarAccionHistorial.innerHTML = 'Eliminar';
        
        // Limpiar variable
        wogAEliminar = null;
    }
}

// Exportar funciones necesarias al alcance global
window.mostrarNotasWogSimple = mostrarNotasWogSimple;
window.confirmarEliminarWogSimple = confirmarEliminarWogSimple;