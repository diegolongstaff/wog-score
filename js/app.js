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

// Función para mostrar las notas de un WOG
function mostrarNotasWog(fecha, notas) {
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
window.mostrarNotasWog = mostrarNotasWog;