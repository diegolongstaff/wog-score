// Módulo de gestión de participantes

// Referencias a elementos del DOM
const participantesContainer = document.getElementById('participantes-container');
const btnNuevoParticipante = document.getElementById('btn-nuevo-participante');
const modalParticipante = document.getElementById('modal-participante');
const formParticipante = document.getElementById('participante-form');
const inputParticipanteId = document.getElementById('participante-id');
const inputParticipanteNombre = document.getElementById('participante-nombre');
const inputParticipanteApodo = document.getElementById('participante-apodo');
const inputParticipanteImagen = document.getElementById('participante-imagen');
const previewContainer = document.getElementById('preview-container');
const btnCancelarParticipante = document.getElementById('btn-cancelar-participante');
const modalParticipanteTitulo = document.getElementById('modal-participante-titulo');

// Modal de confirmación
const modalConfirmacion = document.getElementById('modal-confirmacion');
const modalConfirmacionTitulo = document.getElementById('modal-confirmacion-titulo');
const modalConfirmacionMensaje = document.getElementById('modal-confirmacion-mensaje');
const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
const btnCancelarConfirmacion = document.getElementById('btn-cancelar-confirmacion');

// Variable para almacenar el ID del participante a eliminar
let participanteAEliminar = null;

// Inicializar módulo
function initParticipantesModule() {
    console.log('Inicializando módulo de participantes...');
    
    // Cargar participantes inmediatamente
    cargarParticipantes();
    
    // Configurar eventos
    btnNuevoParticipante.addEventListener('click', abrirModalNuevoParticipante);
    btnCancelarParticipante.addEventListener('click', cerrarModalParticipante);
    formParticipante.addEventListener('submit', guardarParticipante);
    inputParticipanteImagen.addEventListener('change', previsualizarImagen);
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-participantes') {
            cargarParticipantes();
        }
    });
    
    // Configurar eventos para modal de confirmación
    btnCancelarConfirmacion.addEventListener('click', () => {
        modalConfirmacion.style.display = 'none';
    });
    
    console.log('Módulo de participantes inicializado correctamente');
}

// Abrir modal para nuevo participante
function abrirModalNuevoParticipante() {
    // Limpiar formulario
    formParticipante.reset();
    inputParticipanteId.value = '';
    previewContainer.innerHTML = '';
    
    // Cambiar título del modal
    modalParticipanteTitulo.textContent = 'Nuevo Participante';
    
    // Mostrar modal
    modalParticipante.style.display = 'block';
}

// Cerrar modal de participante
function cerrarModalParticipante() {
    modalParticipante.style.display = 'none';
}

// Previsualizar imagen seleccionada
function previsualizarImagen(event) {
    const file = event.target.files[0];
    if (!file) {
        previewContainer.innerHTML = '';
        return;
    }
    
    // Validar que sea una imagen
    if (!file.type.match('image.*')) {
        mostrarToast('Por favor selecciona una imagen válida (JPG, PNG, GIF)', true);
        return;
    }
    
    // Crear elemento de imagen para previsualización
    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Vista previa';
        previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
}

// Guardar participante (nuevo o edición)
async function guardarParticipante(event) {
    event.preventDefault();
    
    try {
        const nombre = inputParticipanteNombre.value.trim();
        const apodo = inputParticipanteApodo.value.trim() || nombre;
        const id = inputParticipanteId.value;
        
        if (!nombre) {
            mostrarToast('El nombre es obligatorio', true);
            return;
        }
        
        // Mostrar loader
        const submitBtn = formParticipante.querySelector('button[type="submit"]');
        const btnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Datos del participante
        const participanteData = {
            nombre,
            apodo,
            activo: true,
            fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Si es un nuevo participante, agregar fecha de creación
        if (!id) {
            participanteData.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
            participanteData.puntos_sede = 0;
            participanteData.puntos_asador = 0;
            participanteData.puntos_compras = 0;
        }
        
        // Subir imagen si se seleccionó
        const file = inputParticipanteImagen.files[0];
        if (file) {
            // Generar nombre único para el archivo
            const extension = file.name.split('.').pop();
            const nombreArchivo = id ? id : `participante_${Date.now()}`;
            const rutaArchivo = `participantes/${nombreArchivo}.${extension}`;
            
            // Subir archivo al almacenamiento
            const fileRef = storage.ref(rutaArchivo);
            await fileRef.put(file);
            
            // Obtener URL de descarga
            const downloadURL = await fileRef.getDownloadURL();
            participanteData.imagen_url = downloadURL;
        }
        
        // Guardar en Firestore
        if (id) {
            // Actualizar participante existente
            await db.collection(COLECCION_PARTICIPANTES).doc(id).update(participanteData);
            mostrarToast(`${nombre} actualizado correctamente`);
        } else {
            // Crear nuevo participante
            await db.collection(COLECCION_PARTICIPANTES).add(participanteData);
            mostrarToast(`${nombre} agregado correctamente`);
        }
        
        // Cerrar modal y recargar lista
        cerrarModalParticipante();
        cargarParticipantes();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('participantesActualizados'));
        
    } catch (error) {
        console.error('Error al guardar participante:', error);
        mostrarToast('Error al guardar participante', true);
    } finally {
        // Restaurar botón
        const submitBtn = formParticipante.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
    }
}

// Cargar lista de participantes
async function cargarParticipantes() {
    try {
        // Mostrar loader
        participantesContainer.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener participantes de Firestore
        const snapshot = await db.collection(COLECCION_PARTICIPANTES).get();
        
        // Verificar si hay participantes
        if (snapshot.empty) {
            participantesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No hay participantes registrados todavía</p>
                </div>
            `;
            return;
        }
        
        // Preparar array de participantes
        const participantes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Ordenar por nombre
        participantes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Limpiar contenedor
        participantesContainer.innerHTML = '';
        
        // Crear tarjeta para cada participante
        participantes.forEach(participante => {
            const card = document.createElement('div');
            card.className = 'participante-card';
            
            // Calcular puntos totales
            const puntosTotales = (participante.puntos_sede || 0) + 
                                  (participante.puntos_asador || 0) + 
                                  (participante.puntos_compras || 0);
            
            // HTML de la tarjeta
            card.innerHTML = `
                <div class="participante-imagen">
                    ${participante.imagen_url 
                        ? `<img src="${participante.imagen_url}" alt="${participante.nombre}">` 
                        : `<div class="avatar-placeholder">${obtenerIniciales(participante.nombre)}</div>`}
                </div>
                <div class="participante-info">
                    <h3 class="participante-nombre">${participante.nombre}</h3>
                    <p class="participante-apodo">${participante.apodo !== participante.nombre ? participante.apodo : ''}</p>
                    
                    <div class="participante-stats">
                        <div class="participante-stat">
                            <div class="participante-valor">${puntosTotales.toFixed(1)}</div>
                            <div class="participante-etiqueta">Puntos</div>
                        </div>
                        <div class="participante-stat">
                            <div class="participante-valor">${(participante.puntos_sede || 0).toFixed(0)}</div>
                            <div class="participante-etiqueta">Sede</div>
                        </div>
                        <div class="participante-stat">
                            <div class="participante-valor">${(participante.puntos_asador || 0).toFixed(1)}</div>
                            <div class="participante-etiqueta">Asador</div>
                        </div>
                    </div>
                    
                    <div class="participante-acciones">
                        <button class="participante-accion editar" onclick="editarParticipante('${participante.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="participante-accion eliminar" onclick="confirmarEliminarParticipante('${participante.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            
            participantesContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error al cargar participantes:', error);
        participantesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar participantes</p>
            </div>
        `;
    }
}

// Editar un participante existente
async function editarParticipante(id) {
    try {
        // Obtener datos del participante
        const doc = await db.collection(COLECCION_PARTICIPANTES).doc(id).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el participante', true);
            return;
        }
        
        const participante = {
            id: doc.id,
            ...doc.data()
        };
        
        // Llenar formulario
        inputParticipanteId.value = participante.id;
        inputParticipanteNombre.value = participante.nombre || '';
        inputParticipanteApodo.value = participante.apodo || '';
        
        // Previsualizar imagen si existe
        previewContainer.innerHTML = '';
        if (participante.imagen_url) {
            const img = document.createElement('img');
            img.src = participante.imagen_url;
            img.alt = participante.nombre;
            previewContainer.appendChild(img);
        }
        
        // Cambiar título del modal
        modalParticipanteTitulo.textContent = 'Editar Participante';
        
        // Mostrar modal
        modalParticipante.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar participante para editar:', error);
        mostrarToast('Error al cargar datos del participante', true);
    }
}

// Confirmar eliminación de un participante
async function confirmarEliminarParticipante(id) {
    try {
        participanteAEliminar = id;
        
        // Obtener datos del participante
        const doc = await db.collection(COLECCION_PARTICIPANTES).doc(id).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el participante', true);
            return;
        }
        
        const participante = doc.data();
        
        // Verificar si está asociado a WOGs
        const wogsComoSede = await db.collection(COLECCION_WOGS).where('sede', '==', id).limit(1).get();
        const wogsComoAsador = await db.collection(COLECCION_WOGS).where('asadores', 'array-contains', id).limit(1).get();
        const wogsComoCompras = await db.collection(COLECCION_WOGS).where('compras', '==', id).limit(1).get();
        const wogsComoAsistente = await db.collection(COLECCION_WOGS).where('asistentes', 'array-contains', id).limit(1).get();
        
        // Configurar modal de confirmación
        modalConfirmacionTitulo.textContent = 'Eliminar Participante';
        
        if (!wogsComoSede.empty || !wogsComoAsador.empty || !wogsComoCompras.empty || !wogsComoAsistente.empty) {
            // No se puede eliminar porque está asociado a WOGs
            modalConfirmacionMensaje.innerHTML = `
                <p><strong>${participante.nombre}</strong> no puede ser eliminado porque está asociado a uno o más WOGs.</p>
                <p>Considera editar su información en lugar de eliminarlo.</p>
            `;
            
            // Cambiar botón de confirmación
            btnConfirmarAccion.textContent = 'Entendido';
            btnConfirmarAccion.className = 'btn btn-primary';
            btnConfirmarAccion.onclick = () => {
                modalConfirmacion.style.display = 'none';
            };
            
            // Ocultar botón de cancelar
            btnCancelarConfirmacion.style.display = 'none';
        } else {
            // Se puede eliminar
            modalConfirmacionMensaje.innerHTML = `
                <p>¿Estás seguro de que deseas eliminar a <strong>${participante.nombre}</strong>?</p>
                <p>Esta acción no se puede deshacer.</p>
            `;
            
            // Configurar botones
            btnConfirmarAccion.textContent = 'Eliminar';
            btnConfirmarAccion.className = 'btn btn-danger';
            btnConfirmarAccion.onclick = eliminarParticipante;
            
            // Mostrar botón de cancelar
            btnCancelarConfirmacion.style.display = 'inline-block';
        }
        
        // Mostrar modal
        modalConfirmacion.style.display = 'block';
        
    } catch (error) {
        console.error('Error al preparar eliminación de participante:', error);
        mostrarToast('Error al verificar participante', true);
    }
}

// Eliminar un participante
async function eliminarParticipante() {
    if (!participanteAEliminar) return;
    
    try {
        // Cambiar el botón a estado de carga
        btnConfirmarAccion.disabled = true;
        btnConfirmarAccion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        
        // Obtener referencia al documento
        const docRef = db.collection(COLECCION_PARTICIPANTES).doc(participanteAEliminar);
        
        // Obtener documento para conseguir URL de la imagen
        const doc = await docRef.get();
        const participante = doc.data();
        
        // Eliminar imagen de Storage si existe
        if (participante && participante.imagen_url) {
            try {
                const imageRef = storage.refFromURL(participante.imagen_url);
                await imageRef.delete();
            } catch (imgError) {
                console.error('Error al eliminar imagen:', imgError);
                // Continuar con la eliminación del participante incluso si falla la eliminación de la imagen
            }
        }
        
        // Eliminar documento
        await docRef.delete();
        
        // Cerrar modal
        modalConfirmacion.style.display = 'none';
        
        // Mostrar mensaje
        mostrarToast('Participante eliminado correctamente');
        
        // Recargar lista
        cargarParticipantes();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('participantesActualizados'));
        
    } catch (error) {
        console.error('Error al eliminar participante:', error);
        mostrarToast('Error al eliminar participante', true);
    } finally {
        // Restaurar botón
        btnConfirmarAccion.disabled = false;
        btnConfirmarAccion.innerHTML = 'Eliminar';
        
        // Limpiar variable
        participanteAEliminar = null;
    }
}

// Exportar funciones necesarias al alcance global
window.editarParticipante = editarParticipante;
window.confirmarEliminarParticipante = confirmarEliminarParticipante;