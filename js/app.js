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
    
    // Inicializar controladores de módulos
    initParticipantesModule();
    initWogModule();
    initRankingModule();
    initHistorialModule();
    
    // Configurar eventos globales
    configurarEventosGlobales();
    
    console.log('Aplicación inicializada correctamente');
}

// Configurar navegación por pestañas
function configurarNavegacion() {
    // Configurar botones de navegación (aunque ya tienen onclick en el HTML)
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) {
                openTab(tabId);
            } else {
                // Obtener el ID del tab del contenido del botón
                const contenido = this.textContent.trim().toLowerCase();
                if (contenido === 'inicio') openTab('tab-home');
                else if (contenido === 'nuevo wog') openTab('tab-nuevo');
                else if (contenido === 'ranking') openTab('tab-ranking');
                else if (contenido === 'historial') openTab('tab-historial');
                else if (contenido === 'participantes') openTab('tab-participantes');
            }
        });
    });
}

// Abrir una pestaña específica
function openTab(tabId) {
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
        
        // Encontrar y activar el botón correspondiente
        let buttonFound = false;
        
        // Primero buscar por data-tab
        const buttonByData = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (buttonByData) {
            buttonByData.classList.add('active');
            buttonFound = true;
        }
        
        // Si no se encuentra, buscar por contenido
        if (!buttonFound) {
            let buttonText = '';
            if (tabId === 'tab-home') buttonText = 'Inicio';
            else if (tabId === 'tab-nuevo') buttonText = 'Nuevo WOG';
            else if (tabId === 'tab-ranking') buttonText = 'Ranking';
            else if (tabId === 'tab-historial') buttonText = 'Historial';
            else if (tabId === 'tab-participantes') buttonText = 'Participantes';
            
            if (buttonText) {
                document.querySelectorAll('.tab-button').forEach(button => {
                    if (button.textContent.trim() === buttonText) {
                        button.classList.add('active');
                        buttonFound = true;
                    }
                });
            }
        }
        
        // Disparar evento cambio de pestaña
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tabId } }));
    }
}

// Cargar datos para el dashboard inicial
async function cargarDashboard() {
    try {
        // Obtener conteo de WOGs
        const wogsSnapshot = await db.collection(COLECCION_WOGS).get();
        document.getElementById('total-wogs').textContent = wogsSnapshot.size;
        
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
                document.getElementById('current-leader').textContent = lider;
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
    return nombre
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Exportar funciones globales a window
window.openTab = openTab;
window.mostrarToast = mostrarToast;
window.formatearFecha = formatearFecha;
