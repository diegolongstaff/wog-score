// Módulo para gestionar el historial de WOGs

// Referencias a elementos del DOM
const historialContainer = document.getElementById('historial-container');
const modalConfirmacion = document.getElementById('modal-confirmacion');
const modalConfirmacionTitulo = document.getElementById('modal-confirmacion-titulo');
const modalConfirmacionMensaje = document.getElementById('modal-confirmacion-mensaje');
const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
const btnCancelarConfirmacion = document.getElementById('btn-cancelar-confirmacion');
const modalNotas = document.getElementById('modal-notas');
const modalNotasTitulo = document.getElementById('modal-notas-titulo');
const modalNotasContenido = document.getElementById('modal-notas-contenido');
const btnCerrarNotas = document.getElementById('btn-cerrar-notas');

// Variable para almacenar el ID del WOG a eliminar
let wogAEliminar = null;

// Inicializar módulo
function initHistorialModule() {
    console.log('Inicializando módulo de historial...');
    
    // Cargar historial inmediatamente
    cargarHistorial();
    
    // Configurar eventos de pestañas
    document.addEventListener('tabChanged', function(event) {
        if (event.detail && event.detail.tabId === 'tab-historial') {
            cargarHistorial();
        }
    });
    
    // Configurar eventos de actualización
    document.addEventListener('wogActualizado', cargarHistorial);
    
    // Configurar botones de modales
    if (btnCancelarConfirmacion) {
        btnCancelarConfirmacion.addEventListener('click', function() {
            modalConfirmacion.style.display = 'none';
        });
    }
    
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', function() {
            modalNotas.style.display = 'none';
        });
    }
    
    console.log('Módulo de historial inicializado correctamente');
}

// Cargar historial de WOGs
async function cargarHistorial() {
    try {
        console.log('Cargando historial de WOGs...');
        
        // Mostrar loader
        historialContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener WOGs ordenados por fecha (más recientes primero)
        const snapshot = await db.collection(COLECCION_WOGS)
            .orderBy('fecha', 'desc')
            .get();
        
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
        
        // Obtener datos de todos los participantes
        const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES).get();
        const participantesMap = {};
        participantesSnapshot.docs.forEach(doc => {
            participantesMap[doc.id] = doc.data();
        });
        
        // Limpiar contenedor
        historialContainer.innerHTML = '';
        
        // Crear elemento para cada WOG
        snapshot.docs.forEach(doc => {
            const wog = doc.data();
            const wogId = doc.id;
            const fecha = wog.fecha ? wog.fecha.toDate() : new Date();
            
            // Obtener nombre de sede
            const sedeNombre = wog.sede && participantesMap[wog.sede] ? participantesMap[wog.sede].nombre : 'No especificado';
            
            // Crear elemento
            const wogElement = document.createElement('div');
            wogElement.className = 'historial-item';
            
            // HTML del encabezado
            wogElement.innerHTML = `
                <div class="historial-header">
                    <div class="historial-fecha">
                        ${formatearFecha(fecha)}
                        ${wog.notas ? '<span class="badge-notas">Notas</span>' : ''}
                    </div>
                    <div class="historial-acciones">
                        ${wog.notas ? `
                            <button class="historial-accion notas" onclick="mostrarNotasWog('${wogId}')">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                        ` : ''}
                        <button class="historial-accion editar" onclick="abrirModalEditarWog('${wogId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="historial-accion eliminar" onclick="confirmarEliminarWog('${wogId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Contenedor para los detalles y foto
            const detallesContainer = document.createElement('div');
            detallesContainer.className = 'historial-flex-container';
            
            // Sección de detalles
            const detallesSection = document.createElement('div');
            detallesSection.className = 'historial-section';
            
            // HTML de los detalles principales
            detallesSection.innerHTML = `
                <div class="historial-detalles">
                    <div class="historial-detail">
                        <div class="historial-label">Sede</div>
                        <div class="historial-value">${