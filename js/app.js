// Funciones principales de la aplicación

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', inicializarApp);

// Inicializar la aplicación
function inicializarApp() {
    console.log('Inicializando WOG Score App...');
    
    // Configurar navegación por pestañas (simplificado)
    configurarNavegacionSimple();
    
    // Cargar datos iniciales del dashboard
    cargarDashboard();
    
    // Inicializar controladores de módulos
    if (typeof initParticipantesModule === 'function') initParticipantesModule();
    if (typeof initWogModule === 'function') initWogModule();
    if (typeof initRankingModule === 'function') initRankingModule();
    if (typeof initHistorialModule === 'function') initHistorialModule();
    
    // Configurar eventos globales
    configurarEventosGlobales();
    
    console.log('Aplicación inicializada correctamente');
}

// Configuración simplificada de navegación por pestañas
function configurarNavegacionSimple() {
    // Simplemente asignar un onclick a cada botón de manera directa
    document.querySelectorAll('.tab-button').forEach(button => {
        const targetId = button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (targetId) {
            button.onclick = function() {
                openTab(targetId);
                return false;
            };
        }
    });
}

// Función simplificada para abrir pestañas
function openTab(tabId) {
    console.log('Cambiando a pestaña:', tabId);
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
        
        // Activar el botón correspondiente (de manera simplificada)
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.getAttribute('onclick')?.includes(tabId)) {
                button.classList.add('active');
            }
        });
        
        // Cargar historial específicamente cuando se abre esa pestaña
        if (tabId === 'tab-historial') {
            cargarHistorialDirecto();
        }
        
        // Disparar evento cambio de pestaña
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tabId } }));
    } else {
        console.error('No se encontró el tab:', tabId);
    }
}

// Cargar datos para el dashboard inicial
async function cargarDashboard() {
    try {
        // Obtener conteo de WOGs
        const wogsSnapshot = await db.collection(COLECCION_WOGS).get();
        
        // Añadir enlace al historial
        document.getElementById('total-wogs').innerHTML = `
            <a href="#" onclick="openTab('tab-historial'); return false;" class="dashboard-link">
                ${wogsSnapshot.size}
            </a>
        `;
        
        // Obtener conteo de participantes
        const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES).get();
        document.getElementById('total-participantes').textContent = participantesSnapshot.size;
        
        // Calcular líder (participante con más puntos)
        if (participantesSnapshot.size > 0) {
            let lider = null;
            let maxPuntos = -1;
            
            for (const doc of participantesSnapshot.docs) {
                const participante = doc.data();
                // Sumar puntos (sede + asador + compras)
                const puntos = (participante.puntos_sede || 0) + 
                               (participante.puntos_asador || 0) + 
                               (participante.puntos_compras || 0);
                
                if (puntos > maxPuntos) {
                    maxPuntos = puntos;
                    lider = participante.nombre;
                }
            }
            
            if (lider) {
                document.getElementById('current-leader').innerHTML = `
                    <a href="#" onclick="openTab('tab-ranking'); return false;" class="dashboard-link">
                        ${lider}
                    </a>
                `;
            }
        }
        
        // Calcular fecha del próximo WOG (siguiente martes)
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0 es domingo, 1 es lunes, 2 es martes, etc.
        const diasHastaMartes = (diaSemana <= 2) ? (2 - diaSemana) : (9 - diaSemana);
        
        const proximoMartes = new Date(hoy);
        proximoMartes.setDate(hoy.getDate() + diasHastaMartes);
        
        // Formatear fecha
        const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
        const fechaFormateada = proximoMartes.toLocaleDateString('es-ES', opciones);
        document.getElementById('next-wog').textContent = fechaFormateada;
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        mostrarToast('Error al cargar datos iniciales');
    }
}

// Configurar eventos globales
function configurarEventosGlobales() {
    // Configurar cierre de modales
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Configuración adicional para modal de notas
    const btnCerrarNotas = document.getElementById('btn-cerrar-notas');
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', () => {
            document.getElementById('modal-notas').style.display = 'none';
        });
    }
    
    // Escuchar eventos de actualización
    document.addEventListener('participantesActualizados', cargarDashboard);
    document.addEventListener('wogActualizado', cargarDashboard);
}

// Mostrar un mensaje toast
function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = esError ? 'toast show error' : 'toast show';
    
    // Ocultar toast después de 3 segundos
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Formatear fecha para un input date
function formatearFechaInput(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formatear fecha para mostrar
function formatearFecha(fecha, incluirDia = true) {
    if (!fecha) return '';
    
    // Si es timestamp de Firestore, convertir a Date
    if (fecha.toDate && typeof fecha.toDate === 'function') {
        fecha = fecha.toDate();
    }
    
    const opciones = incluirDia 
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric' };
    
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Crear elemento representando un avatar
function crearAvatar(participante, tamaño = 'md') {
    const avatar = document.createElement('div');
    avatar.className = `avatar avatar-${tamaño}`;
    
    // Si tiene imagen, mostrarla
    if (participante.imagen_url) {
        const img = document.createElement('img');
        img.src = participante.imagen_url;
        img.alt = participante.nombre;
        avatar.appendChild(img);
    } else {
        // Si no tiene imagen, mostrar iniciales
        const iniciales = obtenerIniciales(participante.nombre);
        avatar.textContent = iniciales;
    }
    
    return avatar;
}

// Obtener iniciales de un nombre
function obtenerIniciales(nombre) {
    if (!nombre) return '??';
    return nombre
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Comprimir imagen
async function comprimirImagen(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar si es necesario
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a Blob con una calidad reducida
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir la imagen'));
                        }
                    },
                    file.type,
                    quality // Calidad (0.7 = 70%)
                );
            };
            
            img.onerror = function() {
                reject(new Error('Error al cargar la imagen'));
            };
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
    });
}

// Función para cargar historial directamente
async function cargarHistorialDirecto() {
    const historialContainer = document.getElementById('historial-container');
    if (!historialContainer) return;
    
    try {
        console.log('Cargando historial directamente...');
        // Mostrar loader
        historialContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener WOGs
        const snapshot = await db.collection('wogs').get();
        console.log('Datos recibidos:', snapshot.size, 'documentos');
        
        if (snapshot.empty) {
            historialContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No hay WOGs registrados todavía</p>
                </div>
            `;
            return;
        }
        
        // Obtener datos de participantes para nombres
        const participantesSnap = await db.collection('participantes').get();
        const participantesMap = {};
        participantesSnap.docs.forEach(doc => {
            const participanteData = doc.data();
            participantesMap[doc.id] = {
                nombre: participanteData.nombre || 'Desconocido',
                imagen_url: participanteData.imagen_url || null
            };
        });
        
        // Renderizar WOGs
        let html = '';
        snapshot.docs.forEach(doc => {
            const wog = doc.data();
            const fecha = wog.fecha?.toDate ? wog.fecha.toDate() : new Date();
            
            // Obtener nombre de sede
            const sedeInfo = participantesMap[wog.sede] || { nombre: 'Desconocido', imagen_url: null };
            
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
            
// Preparar avatares de asistentes
let asistentesAvatars = '';
if (wog.asistentes && wog.asistentes.length > 0) {
    // Limitar a 15 avatares como máximo para evitar sobrecarga visual
    const asistentesLimitados = wog.asistentes.slice(0, 15);
    const asistentesExtra = wog.asistentes.length > 15 ? wog.asistentes.length - 15 : 0;
    
    asistentesAvatars = `
        <div class="historial-detail">
            <div class="historial-label">Asistentes (${wog.asistentes.length})</div>
            <div class="historial-asistentes-avatars">
                ${asistentesLimitados.map(id => {
                    const participante = participantesMap[id];
                    if (!participante) return '';
                    
                    if (participante.imagen_url) {
                        return `<img src="${participante.imagen_url}" title="${participante.nombre}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; border: 1px solid #f7c59f; display: inline-block; margin: 2px;">`;
                    } else {
                        return `<div style="width: 25px; height: 25px; border-radius: 50%; background-color: #ff6b35; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; margin: 2px;" title="${participante.nombre}">${obtenerIniciales(participante.nombre)}</div>`;
                    }
                }).join('')}
                ${asistentesExtra > 0 ? `<div style="width: 25px; height: 25px; border-radius: 50%; background-color: #888; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; margin: 2px;" title="Y ${asistentesExtra} más">+${asistentesExtra}</div>` : ''}
            </div>
        </div>
    `;
}
            
            html += `
                <div class="historial-item">
                    <div class="historial-header">
                        <div class="historial-fecha">
                            ${formatearFecha(fecha)}
                            ${wog.notas ? '<span class="badge-notas">Notas</span>' : ''}
                        </div>
                        <div class="historial-acciones">
                            ${wog.notas ? `
                                <button class="historial-accion notas" onclick="mostrarNotasWogDirecto('${doc.id}')">
                                    <i class="fas fa-sticky-note"></i>
                                </button>
                            ` : ''}
                             <button class="historial-accion editar" onclick="editarWogDirecto('${doc.id}')">
                                  <i class="fas fa-edit"></i>
                                </button>
                            <button class="historial-accion eliminar" onclick="confirmarEliminarWogDirecto('${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="historial-detalles">
                        
                        
                        <div class="historial-info">
                            <div class="historial-detail">
                                <div class="historial-label">Sede</div>
                                <div class="historial-value">${sedeInfo.nombre}</div>
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
                            
                            ${asistentesAvatars}
                        </div>
                    </div>
                </div>
            `;
        });
        
        historialContainer.innerHTML = html;
        console.log('Historial renderizado correctamente');
        
    } catch (error) {
        console.error('Error al cargar historial directamente:', error);
        historialContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar historial: ${error.message}</p>
            </div>
        `;
    }
}

// Mostrar notas de un WOG
async function mostrarNotasWogDirecto(wogId) {
    try {
        const modalNotas = document.getElementById('modal-notas');
        const modalNotasTitulo = document.getElementById('modal-notas-titulo');
        const modalNotasContenido = document.getElementById('modal-notas-contenido');
        
        // Obtener los datos del WOG
        const doc = await db.collection('wogs').doc(wogId).get();
        
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
function confirmarEliminarWogDirecto(id) {
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const modalConfirmacionTitulo = document.getElementById('modal-confirmacion-titulo');
    const modalConfirmacionMensaje = document.getElementById('modal-confirmacion-mensaje');
    const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
    
    // Configurar modal de confirmación
    modalConfirmacionTitulo.textContent = 'Eliminar WOG';
    modalConfirmacionMensaje.innerHTML = `
        <p>¿Estás seguro de que deseas eliminar este WOG?</p>
        <p>Esta acción no se puede deshacer y ajustará los puntos de los participantes.</p>
    `;
    
    // Configurar botón de confirmación
    btnConfirmarAccion.textContent = 'Eliminar';
    btnConfirmarAccion.className = 'btn btn-danger';
    btnConfirmarAccion.onclick = () => eliminarWogDirecto(id);
    
    // Mostrar modal
    modalConfirmacion.style.display = 'block';
}

// Eliminar un WOG directamente
async function eliminarWogDirecto(wogId) {
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
    
    try {
        // Cambiar botón a estado de carga
        btnConfirmarAccion.disabled = true;
        btnConfirmarAccion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        // Obtener datos del WOG para restar puntos
        const docRef = db.collection('wogs').doc(wogId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            throw new Error('No se encontró el WOG');
        }
        
        const wog = doc.data();
        
        // Iniciar una transacción para asegurar la consistencia
        await db.runTransaction(async transaction => {
            // 1. Restar puntos por sede
            if (wog.sede) {
                const sedeRef = db.collection('participantes').doc(wog.sede);
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
                    const asadorRef = db.collection('participantes').doc(asadorId);
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
                    const compraRef = db.collection('participantes').doc(compraId);
                    const compraDoc = await transaction.get(compraRef);
                    
                    if (compraDoc.exists) {
                        const puntosCompras = compraDoc.data().puntos_compras || 0;
                        transaction.update(compraRef, {
                            puntos_compras: Math.max(0, puntosCompras - puntoPorCompra)
                        });
                    }
                }
            } else if (wog.compras) {
                const compraRef = db.collection('participantes').doc(wog.compras);
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
        cargarHistorialDirecto();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al eliminar WOG:', error);
        mostrarToast('Error al eliminar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        btnConfirmarAccion.disabled = false;
        btnConfirmarAccion.innerHTML = 'Eliminar';
    }
}

// Función para mostrar las notas de un WOG (método antiguo)
function mostrarNotasWogDirecto(fecha, notas) {
    const modalNotas = document.getElementById('modal-notas');
    const tituloNotas = document.getElementById('modal-notas-titulo');
    const contenidoNotas = document.getElementById('modal-notas-contenido');
    
    // Configurar título con la fecha
    tituloNotas.textContent = `Notas del WOG - ${formatearFecha(fecha)}`;
    
    // Mostrar contenido o placeholder
    if (notas && notas.trim()) {
        contenidoNotas.textContent = notas;
    } else {
        contenidoNotas.innerHTML = '<div class="notas-placeholder">No hay notas registradas para este WOG.</div>';
    }
    
    // Mostrar modal
    modalNotas.style.display = 'block';
}
// Función para editar un WOG existente
async function editarWogDirecto(wogId) {
    try {
        // Obtener datos del WOG
        const doc = await db.collection('wogs').doc(wogId).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
            return;
        }
        
        const wog = doc.data();
        console.log("Editando WOG:", wogId, wog);
        
        // Abrir pestaña de nuevo WOG
        openTab('tab-nuevo');
        
        // Esperar a que se complete la carga del formulario
        setTimeout(async () => {
            try {
                console.log("Estableciendo valores del formulario...");
                
                // Fecha: usar método más seguro para formateo
                const fechaWog = wog.fecha.toDate();
                const fechaFormateada = formatearFechaInput(fechaWog);
                document.getElementById('fecha').value = fechaFormateada;
                
                // Sede
                if (document.getElementById('sede')) {
                    document.getElementById('sede').value = wog.sede || '';
                    console.log("Sede establecida:", wog.sede);
                }
                
                // Subsede
                if (document.getElementById('subsede')) {
                    document.getElementById('subsede').value = wog.subsede || '';
                }
                
                // Compras (manejar tanto compras individuales como compartidas)
                if (wog.comprasCompartidas && wog.comprasCompartidas.length > 0) {
                    if (document.getElementById('compras')) {
                        document.getElementById('compras').value = 'compartido';
                        console.log("Compras compartidas establecidas");
                        
                        // Llamar a la función que muestra los checkboxes
                        if (typeof toggleComprasCompartidas === 'function') {
                            toggleComprasCompartidas();
                        
                            // Esperar a que los checkboxes estén visibles
                            setTimeout(() => {
                                wog.comprasCompartidas.forEach(id => {
                                    const checkbox = document.getElementById(`compra-compartida-${id}`);
                                    if (checkbox) {
                                        checkbox.checked = true;
                                        console.log("Checkbox de compra compartida marcado:", id);
                                    } else {
                                        console.warn("No se encontró el checkbox de compra compartida:", id);
                                    }
                                });
                            }, 300);
                        }
                    }
                } else if (wog.compras) {
                    if (document.getElementById('compras')) {
                        document.getElementById('compras').value = wog.compras;
                        console.log("Compras individuales establecidas:", wog.compras);
                    }
                }
                
                // Asadores: primero limpiar los existentes excepto el primero
                const asadoresContainer = document.getElementById('asadores-container');
                if (asadoresContainer) {
                    // Guardar el primer selector
                    const primerSelector = asadoresContainer.querySelector('.asador-select');
                    // Limpiar el contenedor
                    asadoresContainer.innerHTML = '';
                    
                    // Si hay asadores en el WOG
                    if (wog.asadores && wog.asadores.length > 0) {
                        // Para cada asador en el WOG
                        wog.asadores.forEach((asadorId, index) => {
                            // Si es el primer asador
                            if (index === 0) {
                                // Crear el primer item de asador
                                const asadorItem = document.createElement('div');
                                asadorItem.className = 'asador-item';
                                
                                // Añadir el selector al item
                                if (primerSelector) {
                                    primerSelector.value = asadorId;
                                    asadorItem.appendChild(primerSelector);
                                } else {
                                    // Si no hay primer selector, crear uno nuevo
                                    const nuevoSelect = document.createElement('select');
                                    nuevoSelect.className = 'asador-select';
                                    nuevoSelect.required = true;

                                            setTimeout(async () => {

                                    // Cargar opciones desde el DOM
                                    const participantesSnap = await db.collection('participantes').get();
                                    nuevoSelect.innerHTML = '<option value="">Seleccionar asador</option>';
                                    participantesSnap.docs.forEach(doc => {
                                        const option = document.createElement('option');
                                        option.value = doc.id;
                                        option.textContent = doc.data().nombre;
                                        nuevoSelect.appendChild(option);
                                    });
                                    
                                    nuevoSelect.value = asadorId;
                                    asadorItem.appendChild(nuevoSelect);
                                }
                                
                                asadoresContainer.appendChild(asadorItem);
                            } else {
                                // Si es un asador adicional, crear nuevo selector
                                if (typeof agregarSelectorAsador === 'function') {
                                    agregarSelectorAsador();
                                }
                                
                                // Establecer el valor del selector recién creado
                                setTimeout(() => {
                                    const selectores = asadoresContainer.querySelectorAll('.asador-select');
                                    if (selectores[index]) {
                                        selectores[index].value = asadorId;
                                        console.log("Asador adicional establecido:", index, asadorId);
                                    }
                                }, 100);
                            }
                        });
                    } else {
                        // Si no hay asadores, añadir el selector vacío
                        const asadorItem = document.createElement('div');
                        asadorItem.className = 'asador-item';
                        if (primerSelector) {
                            asadorItem.appendChild(primerSelector);
                        }
                        asadoresContainer.appendChild(asadorItem);
                    }
                }
                
                // Asistentes
                if (wog.asistentes && wog.asistentes.length > 0) {
                    // Limpiar todos los checkboxes primero
                    document.querySelectorAll('#asistentes-lista input[type="checkbox"]').forEach(cb => {
                        cb.checked = false;
                    });
                    
                    // Marcar los asistentes del WOG
                    wog.asistentes.forEach(id => {
                        const checkbox = document.getElementById(`asistente-${id}`);
                        if (checkbox) {
                            checkbox.checked = true;
                            console.log("Asistente marcado:", id);
                        } else {
                            console.warn("No se encontró el checkbox de asistente:", id);
                        }
                    });
                }
                
                // Notas
                if (document.getElementById('notas')) {
                    document.getElementById('notas').value = wog.notas || '';
                }
                
                // Modificar formulario para modo edición
                const form = document.getElementById('nuevo-wog-form');
                if (form) {
                    form.setAttribute('data-editing-id', wogId);
                    
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.textContent = 'Actualizar WOG';
                    }
                }
                
                mostrarToast('Editando WOG, realiza los cambios necesarios');
                
            } catch (innerError) {
                console.error("Error al establecer valores del formulario:", innerError);
                mostrarToast('Error al cargar algunos valores del formulario', true);
            }
        }, 500);
        
    } catch (error) {
        console.error('Error al cargar WOG para editar:', error);
        mostrarToast('Error al cargar datos del WOG', true);
    }
}
// Exportar funciones globales a window
window.openTab = openTab;
window.mostrarToast = mostrarToast;
window.formatearFecha = formatearFecha;
window.obtenerIniciales = obtenerIniciales;
window.comprimirImagen = comprimirImagen;
window.mostrarNotasWogDirecto = mostrarNotasWogDirecto;
window.cargarHistorialDirecto = cargarHistorialDirecto;
window.confirmarEliminarWogDirecto = confirmarEliminarWogDirecto;
window.eliminarWogDirecto = eliminarWogDirecto;
window.editarWogDirecto = editarWogDirecto;
