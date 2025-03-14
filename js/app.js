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
window.editarWogDirecto = editarWogDirecto; // Exportar la función de edición
window.mostrarImagenCompleta = mostrarImagenCompleta; // Exportar la función para mostrar imagen completa
            
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
        
        // Si existe el modal de imagen a pantalla completa y se hace clic fuera
        const imagenModal = document.querySelector('.modal.imagen-fullscreen');
        if (imagenModal && event.target === imagenModal) {
            imagenModal.remove();
        }
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
        
        // Obtener WOGs ordenados del más reciente al más antiguo
        const snapshot = await db.collection('wogs').orderBy('fecha', 'desc').get();
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
            
// Preparar avatares de asistentes (aumentados 30% en tamaño)
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
                        return `<img src="${participante.imagen_url}" title="${participante.nombre}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid #f7c59f; display: inline-block; margin: 2px;">`;
                    } else {
                        return `<div style="width: 35px; height: 35px; border-radius: 50%; background-color: #ff6b35; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; margin: 2px;" title="${participante.nombre}">${obtenerIniciales(participante.nombre)}</div>`;
                    }
                }).join('')}
                ${asistentesExtra > 0 ? `<div style="width: 35px; height: 35px; border-radius: 50%; background-color: #888; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin: 2px;" title="Y ${asistentesExtra} más">+${asistentesExtra}</div>` : ''}
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
                        ${wog.foto_url ? `
                            <div class="historial-imagen">
                                <img src="${wog.foto_url}" alt="Foto del WOG" class="historial-wog-imagen" onclick="mostrarImagenCompleta('${wog.foto_url}', '${formatearFecha(fecha)}')">
                            </div>
                        ` : ''}
                        
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
        
        // Añadir clase de cursor pointer a las imágenes
        document.querySelectorAll('.historial-wog-imagen').forEach(img => {
            img.style.cursor = 'pointer';
        });
        
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

// Función para mostrar imagen a pantalla completa
function mostrarImagenCompleta(imgSrc, titulo) {
    // Verificar si la imagen existe
    if (!imgSrc) return;
    
    // Crear modal
    const modalId = 'modal-imagen-completa';
    
    // Eliminar modal anterior si existe
    const modalAnterior = document.getElementById(modalId);
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Crear nuevo modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal imagen-fullscreen';
    modal.style.display = 'block';
    modal.style.zIndex = '1000';
    
    // Añadir contenido
    modal.innerHTML = `
        <div class="modal-content imagen-grande" style="width: 95%; max-width: 900px; background-color: #222; color: white; padding-bottom: 10px;">
            <span class="close-modal" style="color: white;">&times;</span>
            <h3 style="text-align: center; margin-bottom: 15px;">${titulo || 'Foto del WOG'}</h3>
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px; overflow: hidden;">
                <img src="${imgSrc}" alt="Foto del WOG" style="max-width: 100%; max-height: 80vh; object-fit: contain;">
            </div>
            <div style="text-align: center;">
                <a href="${imgSrc}" target="_blank" class="btn" style="background-color: var(--color-primary); color: white; padding: 8px 15px; border-radius: 50px; text-decoration: none; display: inline-block;">
                    <i class="fas fa-external-link-alt"></i> Ver imagen original
                </a>
            </div>
        </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(modal);
    
    // Configurar cierre
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Cerrar al hacer Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && document.getElementById(modalId)) {
            document.getElementById(modalId).remove();
        }
    });
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
        
        // Abrir pestaña de nuevo WOG
        openTab('tab-nuevo');
        
        // Llenar el formulario con los datos del WOG
        document.getElementById('fecha').value = formatearFechaInput(wog.fecha.toDate());
        document.getElementById('sede').value = wog.sede || '';
        document.getElementById('subsede').value = wog.subsede || '';
        
        // Manejar compras
        if (wog.comprasCompartidas && wog.comprasCompartidas.length > 0) {
            document.getElementById('compras').value = 'compartido';
            toggleComprasCompartidas();
            
            // Marcar las casillas correspondientes
            wog.comprasCompartidas.forEach(id => {
                const checkbox = document.getElementById(`compra-compartida-${id}`);
                if (checkbox) checkbox.checked = true;
            });
        } else if (wog.compras) {
            document.getElementById('compras').value = wog.compras;
        }
        
        // Manejar asadores (podría requerir añadir más selectores)
        if (wog.asadores && wog.asadores.length > 0) {
            // Obtener el primer asador
            const primerAsador = document.querySelector('.asador-select');
            if (primerAsador) primerAsador.value = wog.asadores[0] || '';
            
            // Añadir asadores adicionales
            for (let i = 1; i < wog.asadores.length; i++) {
                agregarSelectorAsador();
                const asadorSelects = document.querySelectorAll('.asador-select');
                if (asadorSelects[i]) asadorSelects[i].value = wog.asadores[i];
            }
        }
        
        // Marcar asistentes
        if (wog.asistentes && wog.asistentes.length > 0) {
            wog.asistentes.forEach(id => {
                const checkbox = document.getElementById(`asistente-${id}`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Llenar notas
        document.getElementById('notas').value = wog.notas || '';
        
        // Si hay previsualización de foto y hay foto en el WOG
        const previewFotoWog = document.getElementById('preview-foto-wog');
        if (previewFotoWog && wog.foto_url) {
            previewFotoWog.innerHTML = `<img src="${wog.foto_url}" alt="Foto del WOG">`;
        }
        
        // Modificar formulario para modo edición
        const submitBtn = document.querySelector('#nuevo-wog-form button[type="submit"]');
        submitBtn.textContent = 'Actualizar WOG';
        
        // Almacenar ID del WOG que se está editando
        document.getElementById('nuevo-wog-form').setAttribute('data-editing-id', wogId);
        
        // Mostrar mensaje
        mostrarToast('Editando WOG, realiza los cambios necesarios');
        
    } catch (error) {
        console.error('Error al cargar WOG para editar:', error);
        mostrarToast('Error al cargar datos del WOG', true);
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