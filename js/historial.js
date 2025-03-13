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

// Cache para almacenar información de participantes
let participantesCache = {};

// Inicializar módulo
function initHistorialModule() {
    console.log('Inicializando módulo de historial...');
    
    // Cargar historial inmediatamente (no esperar al cambio de pestaña)
    cargarHistorial();
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-historial') {
            cargarHistorial();
        }
    });
    
    // Escuchar eventos de actualización
    document.addEventListener('wogActualizado', cargarHistorial);
    document.addEventListener('participantesActualizados', cargarHistorial);
    
    // Configurar botón de cancelar confirmación
    btnCancelarConfirmacion.addEventListener('click', () => {
        modalConfirmacion.style.display = 'none';
    });
    
    // Configurar botón de cerrar notas
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', () => {
            modalNotas.style.display = 'none';
        });
    }
    
    console.log('Módulo de historial inicializado correctamente');
}

// Cargar historial de WOGs
// Función simplificada para cargar el historial
async function cargarHistorial() {
    try {
        console.log('Iniciando carga de historial (versión simplificada)...');
        
        // Mostrar loader
        historialContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener WOGs directamente sin ningún filtro
        const snapshot = await db.collection('wogs').get();
        
        console.log('Resultado de Firestore:', snapshot);
        console.log('Número de documentos encontrados:', snapshot.size);
        
        // Verificar si hay WOGs
        if (snapshot.empty) {
            console.log('No hay WOGs en Firestore');
            historialContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No hay WOGs registrados todavía</p>
                </div>
            `;
            return;
        }
        
        // Limpiar contenedor y mostrar WOGs de manera simple
        historialContainer.innerHTML = '';
        
        snapshot.docs.forEach(doc => {
            const wog = doc.data();
            console.log('Procesando WOG:', doc.id, wog);
            
            const fecha = wog.fecha ? wog.fecha.toDate() : new Date();
            
            const wogElement = document.createElement('div');
            wogElement.className = 'historial-item';
            
            // HTML simplificado para probar visualización
            wogElement.innerHTML = `
                <div class="historial-header">
                    <div class="historial-fecha">
                        ${fecha.toLocaleDateString('es-ES')}
                    </div>
                </div>
                <div class="historial-detalles">
                    <p><strong>ID:</strong> ${doc.id}</p>
                    <p><strong>Sede:</strong> ${wog.sede || 'No especificada'}</p>
                    <p><strong>Subsede:</strong> ${wog.subsede || '-'}</p>
                </div>
            `;
            
            historialContainer.appendChild(wogElement);
        });
        
        console.log('Historial renderizado con', historialContainer.children.length, 'elementos');
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
        console.error('Stack trace:', error.stack);
        historialContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar historial: ${error.message}</p>
            </div>
        `;
    }
}
        
        // Preparar array de WOGs
        const wogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Limpiar contenedor
        historialContainer.innerHTML = '';
        
        // Crear elemento para cada WOG
        wogs.forEach(wog => {
            const wogElement = document.createElement('div');
            wogElement.className = 'historial-item';
            
            // Convertir fecha
            const fecha = wog.fecha ? (wog.fecha.toDate ? wog.fecha.toDate() : new Date(wog.fecha)) : new Date();
            
            // Obtener nombre de sede
            const sedeNombre = participantesCache[wog.sede]?.nombre || 'Desconocido';
            
            // Obtener nombres de asadores
            const asadoresNombres = Array.isArray(wog.asadores) ? wog.asadores
                .map(id => participantesCache[id]?.nombre || 'Desconocido')
                .join(' / ') : 'No disponible';
            
            // Obtener nombre de compras
            let comprasNombres = '';
            if (wog.comprasCompartidas && wog.comprasCompartidas.length > 0) {
                comprasNombres = wog.comprasCompartidas
                    .map(id => participantesCache[id]?.nombre || 'Desconocido')
                    .join(' / ');
            } else if (wog.compras) {
                comprasNombres = participantesCache[wog.compras]?.nombre || 'Desconocido';
            } else {
                comprasNombres = 'No disponible';
            }
            
            // Verificar si hay notas
            const tieneNotas = wog.notas && wog.notas.trim().length > 0;
            
            // HTML del elemento
            wogElement.innerHTML = `
                <div class="historial-header">
                    <div class="historial-fecha">
                        ${formatearFecha(fecha)}
                        ${tieneNotas ? '<span class="badge-notas">Notas</span>' : ''}
                    </div>
                    <div class="historial-acciones">
                        ${tieneNotas ? `
                            <button class="historial-accion notas" onclick="mostrarNotasWog('${wog.id}')">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                        ` : ''}
                        <button class="historial-accion eliminar" onclick="confirmarEliminarWog('${wog.id}')">
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
                
                <div class="historial-asistentes">
                    <div class="historial-label">Asistentes</div>
                    <div class="asistentes-list">
                        ${wog.asistentes && Array.isArray(wog.asistentes) ? wog.asistentes.map(id => {
                            const participante = participantesCache[id];
                            return participante ? `
                                <div class="asistente-tag">
                                    ${participante.imagen_url 
                                        ? `<img src="${participante.imagen_url}" class="asistente-avatar" alt="${participante.nombre}">`
                                        : ''}
                                    ${participante.nombre}
                                </div>
                            ` : '';
                        }).join('') : 'No disponible'}
                    </div>
                </div>
            `;
            
            historialContainer.appendChild(wogElement);
        });
        
        console.log('Historial renderizado con', historialContainer.children.length, 'elementos');
        
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
        const fecha = wog.fecha?.toDate ? wog.fecha.toDate() : new Date(wog.fecha);
        
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

// Cargar información de participantes en cache
async function cargarParticipantesCache() {
    try {
        console.log('Cargando cache de participantes...');
        const snapshot = await db.collection(COLECCION_PARTICIPANTES).get();
        
        participantesCache = {};
        snapshot.docs.forEach(doc => {
            participantesCache[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });
        console.log(`Cache de participantes cargado con ${snapshot.docs.length} participantes`);
    } catch (error) {
        console.error('Error al cargar cache de participantes:', error);
        throw error; // Relanzar para que se maneje en la función que llama
    }
}

// Exportar funciones necesarias al alcance global
window.confirmarEliminarWog = confirmarEliminarWog;
window.mostrarNotasWog = mostrarNotasWog;
