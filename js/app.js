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
        
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.getAttribute('onclick')?.includes(tabId)) {
                button.classList.add('active');
            }
        });
        
        if (tabId === 'tab-historial') {
            cargarHistorialDirecto();
        }
        
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tabId } }));
    } else {
        console.error('No se encontró el tab:', tabId);
    }
}

// Cargar datos para el dashboard inicial
async function cargarDashboard() {
    try {
        const wogsSnapshot = await db.collection(COLECCION_WOGS).get();
        
        document.getElementById('total-wogs').innerHTML = `
            <a href="#" onclick="openTab('tab-historial'); return false;" class="dashboard-link">
                ${wogsSnapshot.size}
            </a>
        `;
        
        const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES).get();
        document.getElementById('total-participantes').textContent = participantesSnapshot.size;
        
        if (participantesSnapshot.size > 0) {
            let lider = null;
            let maxPuntos = -1;
            
            for (const doc of participantesSnapshot.docs) {
                const participante = doc.data();
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
        
        const hoy = new Date();
        const diaSemana = hoy.getDay();
        const diasHastaMartes = (diaSemana <= 2) ? (2 - diaSemana) : (9 - diaSemana);
        
        const proximoMartes = new Date(hoy);
        proximoMartes.setDate(hoy.getDate() + diasHastaMartes);
        
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
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    const btnCerrarNotas = document.getElementById('btn-cerrar-notas');
    if (btnCerrarNotas) {
        btnCerrarNotas.addEventListener('click', () => {
            document.getElementById('modal-notas').style.display = 'none';
        });
    }
    
    document.addEventListener('participantesActualizados', cargarDashboard);
    document.addEventListener('wogActualizado', cargarDashboard);
}

// Mostrar un mensaje toast
function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = esError ? 'toast show error' : 'toast show';
    
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
    
    if (participante.imagen_url) {
        const img = document.createElement('img');
        img.src = participante.imagen_url;
        img.alt = participante.nombre;
        avatar.appendChild(img);
    } else {
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
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir la imagen'));
                        }
                    },
                    file.type,
                    quality
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
        historialContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
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
        
        const participantesSnap = await db.collection('participantes').get();
        const participantesMap = {};
        participantesSnap.docs.forEach(doc => {
            const participanteData = doc.data();
            participantesMap[doc.id] = {
                nombre: participanteData.nombre || 'Desconocido',
                imagen_url: participanteData.imagen_url || null
            };
        });
        
        let html = '';
        snapshot.docs.forEach(doc => {
            const wog = doc.data();
            const fecha = wog.fecha?.toDate ? wog.fecha.toDate() : new Date();
            
            const sedeInfo = participantesMap[wog.sede] || { nombre: 'Desconocido', imagen_url: null };
            
            const asadoresNombres = Array.isArray(wog.asadores) ? wog.asadores
                .map(id => participantesMap[id]?.nombre || 'Desconocido')
                .join(' / ') : 'No disponible';
            
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

            let asistentesAvatars = '';
            if (wog.asistentes && wog.asistentes.length > 0) {
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
                                    return `<img src="${participante.imagen_url}" title="${participante.nombre}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; border: 1px solid #f7f7f7;">`;
                                } else {
                                    return `<div style="width: 25px; height: 25px; border-radius: 50%; background-color: #ff6b35; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;">${obtenerIniciales(participante.nombre)}</div>`;
                                }
                            }).join('')}
                            ${asistentesExtra > 0 ? `<div style="width: 25px; height: 25px; border-radius: 50%; background-color: #888; color: white; display: flex; align-items: center; justify-content: center;">+${asistentesExtra}</div>` : ''}
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
        
        const doc = await db.collection('wogs').doc(wogId).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
            return;
        }
        
        const wog = doc.data();
        const fecha = wog.fecha?.toDate ? wog.fecha.toDate() : new Date();
        
        modalNotasTitulo.textContent = `Notas del WOG - ${formatearFecha(fecha)}`;
        
        if (wog.notas && wog.notas.trim()) {
            modalNotasContenido.textContent = wog.notas;
        } else {
            modalNotasContenido.innerHTML = '<div class="notas-placeholder">No hay notas registradas para este WOG.</div>';
        }
        
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
    
    modalConfirmacionTitulo.textContent = 'Eliminar WOG';
    modalConfirmacionMensaje.innerHTML = `
        <p>¿Estás seguro de que deseas eliminar este WOG?</p>
        <p>Esta acción no se puede deshacer y ajustará los puntos de los participantes.</p>
    `;
    
    btnConfirmarAccion.textContent = 'Eliminar';
    btnConfirmarAccion.className = 'btn btn-danger';
    btnConfirmarAccion.onclick = () => eliminarWogDirecto(id);
    
    modalConfirmacion.style.display = 'block';
}

// Eliminar un WOG directamente
async function eliminarWogDirecto(wogId) {
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const