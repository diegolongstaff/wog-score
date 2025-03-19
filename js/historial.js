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
    
    // Escuchar eventos de actualización
    document.addEventListener('wogActualizado', cargarHistorial);
    
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
        
        // Obtener WOGs de Firestore ordenados por fecha (más recientes primero)
        const snapshot = await db.collection(COLECCION_WOGS)
            .orderBy('fecha', 'desc')
            .get();
        
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
        
        // Obtener datos de participantes para mostrar nombres
        const participantesSnap = await db.collection(COLECCION_PARTICIPANTES).get();
        const participantesMap = {};
        participantesSnap.docs.forEach(doc => {
            participantesMap[doc.id] = {
                nombre: doc.data().nombre || 'Desconocido',
                imagen_url: doc.data().imagen_url || null
            };
        });
        
        // Limpiar contenedor
        historialContainer.innerHTML = '';
        
        // Crear elemento para cada WOG
        snapshot.docs.forEach(doc => {
            const wog = doc.data();
            const fecha = wog.fecha ? wog.fecha.toDate() : new Date();
            
            // Obtener nombre de sede
            const sedeNombre = participantesMap[wog.sede]?.nombre || 'Desconocido';
            
            // Obtener nombres de asadores
            const asadoresNombres = Array.isArray(wog.asadores) ? wog.asadores
                .map(id => participantesMap[id]?.nombre || 'Desconocido')
                .join(' / ') : 'No disponible';
            
            // Obtener nombre de compras
            let comprasNombres = '';
            if (wog.comprasCompartidas && wog.comprasCompartidas.length > 0) {
                comprasNombres = wog.comprasCompartidas
                    .map(id => participantesMap[id]?.nombre || 'Desconocido')
                    .join(' / ');
            } else if (wog.compras) {
                comprasNombres = participantesMap[wog.compras]?.nombre || 'Desconocido';
            } else {
                comprasNombres = 'No disponible';
            }
            
            const wogElement = document.createElement('div');
            wogElement.className = 'historial-item';
            
            // HTML del elemento
            wogElement.innerHTML = `
                <div class="historial-header">
                    <div class="historial-fecha">
                        ${formatearFecha(fecha)}
                        ${wog.notas ? '<span class="badge-notas">Notas</span>' : ''}
                    </div>
                    <div class="historial-acciones">
                        ${wog.notas ? `
                            <button class="historial-accion notas" onclick="mostrarNotasWog('${doc.id}')">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                        ` : ''}
                        <button class="historial-accion editar" onclick="editarWog('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="historial-accion eliminar" onclick="confirmarEliminarWog('${doc.id}')">
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
                        <div class="historial-label">Compras</div>
                        <div class="historial-value">${comprasNombres}</div>
                    </div>
                    
                    <div class="historial-detail">
                        <div class="historial-label">Asador</div>
                        <div class="historial-value">${asadoresNombres}</div>
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

// Mostrar notas de un WOG
async function mostrarNotasWog(wogId) {
    try {
        // Obtener los datos del WOG
        const doc = await db.collection(COLECCION_WOGS).doc(wogId).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
            return;
        }
        
        const wog = doc.data();
        const fecha = wog.fecha?.toDate ? wog.fecha.toDate() : new Date();
        
        // Configurar el modal
        modalNotasTitulo.textContent = `Notas del WOG - ${formatearFecha(fecha)}`;
        
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

// Confirmar eliminación de un WOG
function confirmarEliminarWog(id) {
    wogAEliminar = id;
    
    // Configurar modal de confirmación
    modalConfirmacionTitulo.textContent = 'Eliminar WOG';
    modalConfirmacionMensaje.innerHTML = `
        <p>¿Estás seguro de que deseas eliminar este WOG?</p>
        <p>Esta acción no se puede deshacer y ajustará los puntos de los participantes.</p>
    `;
    
    // Configurar botón de confirmación
    btnConfirmarAccion.textContent = 'Eliminar';
    btnConfirmarAccion.className = 'btn btn-danger';
    btnConfirmarAccion.onclick = eliminarWog;
    
    // Mostrar modal
    modalConfirmacion.style.display = 'block';
}

// Eliminar un WOG
async function eliminarWog() {
    if (!wogAEliminar) return;
    
    try {
        // Cambiar botón a estado de carga
        btnConfirmarAccion.disabled = true;
        btnConfirmarAccion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        // Obtener datos del WOG para restar puntos
        const docRef = db.collection(COLECCION_WOGS).doc(wogAEliminar);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            throw new Error('No se encontró el WOG');
        }
        
        const wog = doc.data();
        
        // Iniciar una transacción para asegurar la consistencia
        await db.runTransaction(async transaction => {
            // 1. Restar puntos por sede
            if (wog.sede) {
                const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wog.sede);
                const sedeDoc = await transaction.get(sedeRef);
                
                if (sedeDoc.exists) {
                    const puntosSede = sedeDoc.data().puntos_sede || 0;
                    transaction.update(sedeRef, {
                        puntos_sede: Math.max(0, puntosSede - 1)
                    });
                }
            }
            
            // 2. Restar puntos por asador
            if (wog.asadores && wog.asadores.length > 0) {
                const puntoPorAsador = 1 / wog.asadores.length;
                
                for (const asadorId of wog.asadores) {
                    const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                    const asadorDoc = await transaction.get(asadorRef);
                    
                    if (asadorDoc.exists) {
                        const puntosAsador = asadorDoc.data().puntos_asador || 0;
                        transaction.update(asadorRef, {
                            puntos_asador: Math.max(0, puntosAsador - puntoPorAsador)
                        });
                    }
                }
            }
            
            // 3. Restar puntos por compras
            if (wog.comprasCompartidas && wog.comprasCompartidas.length > 0) {
                const puntoPorCompra = 1 / wog.comprasCompartidas.length;
                
                for (const compraId of wog.comprasCompartidas) {
                    const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                    const compraDoc = await transaction.get(compraRef);
                    
                    if (compraDoc.exists) {
                        const puntosCompras = compraDoc.data().puntos_compras || 0;
                        transaction.update(compraRef, {
                            puntos_compras: Math.max(0, puntosCompras - puntoPorCompra)
                        });
                    }
                }
            } else if (wog.compras) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wog.compras);
                const compraDoc = await transaction.get(compraRef);
                
                if (compraDoc.exists) {
                    const puntosCompras = compraDoc.data().puntos_compras || 0;
                    transaction.update(compraRef, {
                        puntos_compras: Math.max(0, puntosCompras - 1)
                    });
                }
            }
            
            // 4. Eliminar el documento del WOG
            transaction.delete(docRef);
        });
        
        // Cerrar modal
        modalConfirmacion.style.display = 'none';
        
        // Mostrar mensaje
        mostrarToast('WOG eliminado correctamente');
        
        // Recargar historial
        cargarHistorial();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al eliminar WOG:', error);
        mostrarToast('Error al eliminar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        btnConfirmarAccion.disabled = false;
        btnConfirmarAccion.innerHTML = 'Eliminar';
        
        // Limpiar variable
        wogAEliminar = null;
    }
}

// Exportar funciones necesarias al alcance global
window.initHistorialModule = initHistorialModule;
window.mostrarNotasWog = mostrarNotasWog;
window.confirmarEliminarWog = confirmarEliminarWog;