// Funciones principales de la aplicación

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', inicializarApp);

// Inicializar la aplicación
function inicializarApp() {
    console.log('Inicializando WOG Score App...');
    
    // Configurar navegación por pestañas
    configurarNavegacion();
    
    // Cargar datos iniciales del dashboard
    cargarDashboard();
    
    // Iniciar contador hasta el próximo WOG
    iniciarContadorProximoWog();
    
    // Inicializar controladores de módulos
    if (typeof initParticipantesModule === 'function') initParticipantesModule();
    if (typeof initWogModule === 'function') initWogModule();
    if (typeof initRankingModule === 'function') initRankingModule();
    if (typeof initHistorialModule === 'function') initHistorialModule();
    
    // Configurar eventos globales
    configurarEventosGlobales();
    
    console.log('Aplicación inicializada correctamente');
}

// Configuración de navegación por pestañas
function configurarNavegacion() {
    // Asignar evento onclick a cada botón de pestaña
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

// Función para abrir pestañas
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
        
        // Activar el botón correspondiente
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.getAttribute('onclick')?.includes(tabId)) {
                button.classList.add('active');
            }
        });
        
        // Disparar evento de cambio de pestaña
        document.dispatchEvent(new CustomEvent('tabChanged', { 
            detail: { tabId } 
        }));
    } else {
        console.error('No se encontró la pestaña:', tabId);
    }
}

// Cargar datos para el dashboard inicial
async function cargarDashboard() {
    try {
        // Obtener conteo de WOGs
        const wogsSnapshot = await db.collection(COLECCION_WOGS).get();
        
        // Añadir enlace al historial
        document.getElementById('total-wogs').innerHTML = `
            <a href="#" onclick="openTab('tab-ranking'); return false;" class="dashboard-link">
                    ${lider.nombre} <span class="small">(${lider.puntos.toFixed(1)} pts)</span>
                </a>
            `;
            document.getElementById('current-leader').innerHTML = liderHTML;
        }
    } catch (error) {
        console.error('Error al calcular líder del ranking:', error);
        document.getElementById('current-leader').textContent = 'Error al cargar';
    }
}

// Cargar información del último WOG
async function cargarUltimoWog() {
    try {
        const lastWogContainer = document.getElementById('last-wog-details');
        
        // Mostrar loader
        lastWogContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener el WOG más reciente
        const wogsSnapshot = await db.collection(COLECCION_WOGS)
            .orderBy('fecha', 'desc')
            .limit(1)
            .get();
        
        if (wogsSnapshot.empty) {
            // No hay WOGs todavía
            lastWogContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No hay WOGs registrados todavía</p>
                </div>
            `;
            return;
        }
        
        // Obtener datos del último WOG
        const lastWogDoc = wogsSnapshot.docs[0];
        const lastWog = lastWogDoc.data();
        const fecha = lastWog.fecha?.toDate ? lastWog.fecha.toDate() : new Date();
        
        // Obtener nombres de participantes
        const participantesIds = [
            ...(lastWog.asistentes || []),
            lastWog.sede,
            ...(lastWog.asadores || [])
        ].filter((id, index, self) => id && self.indexOf(id) === index); // Remover duplicados y nulls
        
        const participantesMap = {};
        
        // Obtener datos de participantes mencionados
        if (participantesIds.length > 0) {
            const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES)
                .where(firebase.firestore.FieldPath.documentId(), 'in', participantesIds)
                .get();
                
            participantesSnapshot.docs.forEach(doc => {
                participantesMap[doc.id] = doc.data();
            });
        }
        
        // Preparar HTML con detalles del último WOG
        let html = `
            <div class="last-wog-grid">
                <div class="last-wog-detail">
                    <div class="historial-label">Fecha</div>
                    <div class="historial-value">${formatearFecha(fecha)}</div>
                </div>
                
                <div class="last-wog-detail">
                    <div class="historial-label">Sede</div>
                    <div class="historial-value">
                        ${lastWog.sede && participantesMap[lastWog.sede] 
                            ? participantesMap[lastWog.sede].nombre 
                            : 'No especificado'}
                        ${lastWog.subsede ? ` (${lastWog.subsede})` : ''}
                    </div>
                </div>
        `;
        
        // Mostrar asadores si hay
        if (lastWog.asadores && lastWog.asadores.length > 0) {
            const asadoresNombres = lastWog.asadores
                .map(id => participantesMap[id] ? participantesMap[id].nombre : 'Desconocido')
                .join(', ');
                
            html += `
                <div class="last-wog-detail">
                    <div class="historial-label">Asador${lastWog.asadores.length > 1 ? 'es' : ''}</div>
                    <div class="historial-value">${asadoresNombres}</div>
                </div>
            `;
        }
        
        // Cerrar div de la grid
        html += `</div>`;
        
        // Mostrar imagen si hay
        if (lastWog.imagen_url) {
            html += `
                <img src="${lastWog.imagen_url}" alt="Imagen del último WOG" class="last-wog-image">
            `;
        }
        
        // Botón para ver detalles en el historial
        html += `
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="openTab('tab-historial'); return false;" class="btn btn-add">
                    <i class="fas fa-history"></i> Ver historial completo
                </button>
            </div>
        `;
        
        // Actualizar contenedor
        lastWogContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar último WOG:', error);
        document.getElementById('last-wog-details').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar el último WOG</p>
            </div>
        `;
    }
}

// Iniciar contador hasta el próximo WOG
function iniciarContadorProximoWog() {
    // Calcular fecha del próximo martes
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, 2 = martes, etc.
    
    // Calcular días hasta el próximo martes (2)
    const diasHastaMartes = diaSemana <= 2 ? 2 - diaSemana : 9 - diaSemana;
    
    // Crear fecha del próximo martes a las 20:00 (hora local)
    const proximoMartes = new Date(hoy);
    proximoMartes.setDate(hoy.getDate() + diasHastaMartes);
    proximoMartes.setHours(20, 0, 0, 0);
    
    // Mostrar fecha del próximo WOG
    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('next-wog').textContent = proximoMartes.toLocaleDateString('es-ES', opcionesFecha);
    
    // Función para actualizar el contador
    function actualizarContador() {
        const ahora = new Date();
        const diferencia = proximoMartes - ahora;
        
        // Si ya pasó la fecha, calcular para el próximo martes
        if (diferencia < 0) {
            proximoMartes.setDate(proximoMartes.getDate() + 7);
            actualizarContador();
            return;
        }
        
        // Calcular días, horas, minutos y segundos
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
        
        // Actualizar elementos del DOM
        document.getElementById('countdown-days').textContent = dias;
        document.getElementById('countdown-hours').textContent = horas;
        document.getElementById('countdown-minutes').textContent = minutos;
        document.getElementById('countdown-seconds').textContent = segundos;
    }
    
    // Actualizar inmediatamente y luego cada segundo
    actualizarContador();
    setInterval(actualizarContador, 1000);
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
    
    // Botón cancelar edición de WOG
    const btnCancelarEditarWog = document.getElementById('btn-cancelar-editar-wog');
    if (btnCancelarEditarWog) {
        btnCancelarEditarWog.addEventListener('click', () => {
            document.getElementById('modal-editar-wog').style.display = 'none';
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

// Exportar funciones globales
window.openTab = openTab;
window.mostrarToast = mostrarToast;
window.formatearFecha = formatearFecha;
window.formatearFechaInput = formatearFechaInput;
window.obtenerIniciales = obtenerIniciales;
window.comprimirImagen = comprimirImagen;('tab-historial'); return false;" class="dashboard-link">
                ${wogsSnapshot.size}
            </a>
        `;
        
        // Obtener conteo de participantes
        const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .get();
            
        document.getElementById('total-participantes').innerHTML = `
            <a href="#" onclick="openTab('tab-participantes'); return false;" class="dashboard-link">
                ${participantesSnapshot.size}
            </a>
        `;
        
        // Calcular líder (participante con más puntos)
        if (participantesSnapshot.size > 0) {
            await calcularLiderRanking();
        }
        
        // Cargar información del último WOG
        await cargarUltimoWog();
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        mostrarToast('Error al cargar datos iniciales', true);
    }
}

// Calcular y mostrar el líder del ranking
async function calcularLiderRanking() {
    try {
        const participantesSnapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .get();
            
        let lider = null;
        let maxPuntos = -1;
        
        for (const doc of participantesSnapshot.docs) {
            const participante = doc.data();
            
            // Calcular puntos totales
            const puntosSede = participante.puntos_sede || 0;
            const puntosAsador = participante.puntos_asador || 0;
            const puntosCompras = participante.puntos_compras || 0;
            const puntosAsistencia = participante.puntos_asistencia || 0;
            
            const puntosTotales = puntosSede + puntosAsador + puntosCompras + puntosAsistencia;
            
            if (puntosTotales > maxPuntos) {
                maxPuntos = puntosTotales;
                lider = {
                    nombre: participante.nombre,
                    puntos: puntosTotales,
                    imagen_url: participante.imagen_url || null
                };
            }
        }
        
        if (lider) {
            const liderHTML = `
                <a href="#" onclick="openTab