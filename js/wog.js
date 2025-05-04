// Módulo para gestionar los WOGs

// Referencias a elementos del DOM
const formNuevoWog = document.getElementById('nuevo-wog-form');
const fechaInput = document.getElementById('fecha');
const sedeSelect = document.getElementById('sede');
const subsedeInput = document.getElementById('subsede');
const comprasParticipantesDiv = document.getElementById('compras-participantes');
const asadoresParticipantesDiv = document.getElementById('asadores-participantes');
const asistentesLista = document.getElementById('asistentes-lista');
const notasInput = document.getElementById('notas');
const imagenWogInput = document.getElementById('imagen-wog');
const imagenPreview = document.getElementById('imagen-preview');

// Referencias a elementos del modal de edición
const modalEditarWog = document.getElementById('modal-editar-wog');
const formEditarWog = document.getElementById('editar-wog-form');
const editarWogId = document.getElementById('editar-wog-id');
const editarFechaInput = document.getElementById('editar-fecha');
const editarSedeSelect = document.getElementById('editar-sede');
const editarSubsedeInput = document.getElementById('editar-subsede');
const editarComprasParticipantesDiv = document.getElementById('editar-compras-participantes');
const editarAsadoresParticipantesDiv = document.getElementById('editar-asadores-participantes');
const editarAsistentesLista = document.getElementById('editar-asistentes-lista');
const editarNotasInput = document.getElementById('editar-notas');
const editarImagenWogInput = document.getElementById('editar-imagen-wog');
const editarImagenPreview = document.getElementById('editar-imagen-preview');
const btnCancelarEditarWog = document.getElementById('btn-cancelar-editar-wog');

// Inicializar módulo
function initWogModule() {
    console.log('Inicializando módulo de WOGs...');
    
    // Establecer fecha actual por defecto
    const hoy = new Date();
    fechaInput.value = formatearFechaInput(hoy);
    
    // Configurar eventos
    formNuevoWog.addEventListener('submit', guardarWog);
    imagenWogInput.addEventListener('change', previsualizarImagenWog);
    
    // Configurar eventos del modal de edición
    formEditarWog.addEventListener('submit', actualizarWog);
    editarImagenWogInput.addEventListener('change', previsualizarImagenWogEditar);
    btnCancelarEditarWog.addEventListener('click', cerrarModalEditarWog);
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', ({ detail }) => {
        if (detail.tabId === 'tab-nuevo') {
            cargarFormularioWog();
        }
    });
    
    // Inicializar formulario
    cargarFormularioWog();
    
    console.log('Módulo de WOGs inicializado correctamente');
}

// Cargar datos para el formulario de nuevo WOG
async function cargarFormularioWog() {
    try {
        // Obtener participantes activos
        const snapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .orderBy('nombre')
            .get();
        
        const participantes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Llenar selector de sede
        sedeSelect.innerHTML = '<option value="">Seleccionar anfitrión</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            sedeSelect.appendChild(option);
        });
        
        // Llenar checkboxes de compras
        comprasParticipantesDiv.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="compra-${p.id}" value="${p.id}" name="compras[]">
                <label for="compra-${p.id}">${p.nombre}</label>
            `;
            comprasParticipantesDiv.appendChild(checkbox);
        });
        
        // Llenar checkboxes de asadores
        asadoresParticipantesDiv.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="asador-${p.id}" value="${p.id}" name="asadores[]">
                <label for="asador-${p.id}">${p.nombre}</label>
            `;
            asadoresParticipantesDiv.appendChild(checkbox);
        });
        
        // Llenar checkboxes de asistentes
        asistentesLista.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="asistente-${p.id}" value="${p.id}" name="asistentes[]">
                <label for="asistente-${p.id}">${p.nombre}</label>
            `;
            asistentesLista.appendChild(checkbox);
        });
        
        // Limpiar campo de notas e imagen
        notasInput.value = '';
        imagenWogInput.value = '';
        imagenPreview.innerHTML = '';
        
    } catch (error) {
        console.error('Error al cargar formulario de WOG:', error);
        mostrarToast('Error al cargar participantes', true);
    }
}

// Previsualizar imagen de WOG seleccionada
function previsualizarImagenWog(event) {
    previsualizarImagen(event, imagenPreview);
}

// Previsualizar imagen de WOG en formulario de edición
function previsualizarImagenWogEditar(event) {
    previsualizarImagen(event, editarImagenPreview);
}

// Función genérica para previsualizar imagen
function previsualizarImagen(event, previewContainer) {
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
    
    console.log('Archivo seleccionado:', file.name, 'Tamaño:', (file.size/1024).toFixed(2), 'KB');
}

// Guardar un nuevo WOG
async function guardarWog(event) {
    event.preventDefault();
    
    try {
        // Recopilar datos del formulario
        const fecha = fechaInput.value;
        const sede = sedeSelect.value;
        const subsede = subsedeInput.value.trim();
        const notas = notasInput.value.trim();
        
        // Obtener asadores seleccionados
        const asadores = [];
        asadoresParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            asadores.push(checkbox.value);
        });
        
        // Obtener compras seleccionadas
        const compras = [];
        comprasParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            compras.push(checkbox.value);
        });
        
        // Obtener asistentes seleccionados
        const asistentes = [];
        asistentesLista.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            asistentes.push(checkbox.value);
        });
        
        // Validar datos obligatorios
        if (!fecha) {
            mostrarToast('Debes seleccionar una fecha', true);
            return;
        }
        
        if (!sede) {
            mostrarToast('Debes seleccionar una sede', true);
            return;
        }
        
        if (asadores.length === 0) {
            mostrarToast('Debes seleccionar al menos un asador', true);
            return;
        }
        
        if (compras.length === 0) {
            mostrarToast('Debes seleccionar al menos un responsable de compras', true);
            return;
        }
        
        if (asistentes.length === 0) {
            mostrarToast('Debes seleccionar al menos un asistente', true);
            return;
        }
        
        // Validar que la sede esté incluida en los asistentes
        if (!asistentes.includes(sede)) {
            asistentes.push(sede);
        }
        
        // Validar asadores estén incluidos en los asistentes
        asadores.forEach(asador => {
            if (!asistentes.includes(asador)) {
                asistentes.push(asador);
            }
        });
        
        // Validar compras estén incluidas en los asistentes
        compras.forEach(compra => {
            if (!asistentes.includes(compra)) {
                asistentes.push(compra);
            }
        });
        
        // Cambiar botón a estado de carga
        const submitBtn = formNuevoWog.querySelector('button[type="submit"]');
        const btnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Preparar objeto WOG
        const wogData = {
            fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
            sede,
            subsede,
            asadores,
            compras,
            asistentes,
            notas,
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Subir imagen si existe
        const file = imagenWogInput.files[0];
        if (file) {
            try {
                // Comprimir imagen si es muy grande
                let fileToUpload = file;
                if (file.size > 1000000) { // Si es mayor a 1MB
                    try {
                        fileToUpload = await comprimirImagen(file);
                        console.log('Imagen comprimida correctamente');
                    } catch (compressError) {
                        console.error('Error al comprimir imagen:', compressError);
                    }
                }
                
                // Generar nombre único para el archivo
                const extension = file.name.split('.').pop();
                const nombreArchivo = `wog_${Date.now()}`;
                const rutaArchivo = `wogs/${nombreArchivo}.${extension}`;
                
                // Crear referencia al archivo
                const fileRef = storage.ref(rutaArchivo);
                
                // Subir archivo
                const uploadTask = fileRef.put(fileToUpload);
                
                // Esperar a que se complete la subida
                await uploadTask;
                
                // Obtener URL de descarga
                const downloadURL = await fileRef.getDownloadURL();
                wogData.imagen_url = downloadURL;
                
            } catch (imgError) {
                console.error('Error procesando imagen:', imgError);
                mostrarToast('Error al procesar la imagen, continuando sin imagen', true);
            }
        }
        
        // Guardar en Firestore
        await db.collection(COLECCION_WOGS).add(wogData);
        
        // Mostrar mensaje de éxito
        mostrarToast('WOG registrado correctamente');
        
        // Resetear formulario
        formNuevoWog.reset();
        imagenPreview.innerHTML = '';
        fechaInput.value = formatearFechaInput(new Date());
        
        // Recargar formulario
        cargarFormularioWog();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
        // Redirigir a la pestaña de historial
        openTab('tab-historial');
        
    } catch (error) {
        console.error('Error al guardar WOG:', error);
        mostrarToast('Error al guardar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        const submitBtn = formNuevoWog.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar WOG';
    }
}

// Cargar datos para el formulario de edición de WOG
async function cargarFormularioEdicionWog(wogId) {
    try {
        // Mostrar mensajes de carga
        editarSedeSelect.innerHTML = '<option value="">Cargando...</option>';
        editarComprasParticipantesDiv.innerHTML = '<div class="loading-message">Cargando participantes...</div>';
        editarAsadoresParticipantesDiv.innerHTML = '<div class="loading-message">Cargando participantes...</div>';
        editarAsistentesLista.innerHTML = '<div class="loading-message">Cargando participantes...</div>';
        
        // Obtener datos del WOG
        const docRef = db.collection(COLECCION_WOGS).doc(wogId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
            cerrarModalEditarWog();
            return;
        }
        
        const wog = doc.data();
        
        // Establecer ID oculto
        editarWogId.value = wogId;
        
        // Establecer fecha
        if (wog.fecha) {
            const fecha = wog.fecha.toDate ? wog.fecha.toDate() : new Date(wog.fecha);
            editarFechaInput.value = formatearFechaInput(fecha);
        } else {
            editarFechaInput.value = '';
        }
        
        // Establecer subsede y notas
        editarSubsedeInput.value = wog.subsede || '';
        editarNotasInput.value = wog.notas || '';
        
        // Limpiar imagen previa
        editarImagenPreview.innerHTML = '';
        
        // Mostrar imagen si existe
        if (wog.imagen_url) {
            const img = document.createElement('img');
            img.src = wog.imagen_url;
            img.alt = 'Imagen del WOG';
            editarImagenPreview.appendChild(img);
        }
        
        // Obtener participantes activos
        const snapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .orderBy('nombre')
            .get();
        
        const participantes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Llenar selector de sede
        editarSedeSelect.innerHTML = '<option value="">Seleccionar anfitrión</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            
            // Seleccionar la sede actual
            if (p.id === wog.sede) {
                option.selected = true;
            }
            
            editarSedeSelect.appendChild(option);
        });
        
        // Llenar checkboxes de compras
        editarComprasParticipantesDiv.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            
            // Verificar si está seleccionado
            const isChecked = wog.compras && wog.compras.includes(p.id);
            
            checkbox.innerHTML = `
                <input type="checkbox" id="editar-compra-${p.id}" value="${p.id}" name="compras[]" ${isChecked ? 'checked' : ''}>
                <label for="editar-compra-${p.id}">${p.nombre}</label>
            `;
            
            // Agregar clase para estilo si está seleccionado
            if (isChecked) {
                checkbox.classList.add('selected');
            }
            
            editarComprasParticipantesDiv.appendChild(checkbox);
        });
        
        // Llenar checkboxes de asadores
        editarAsadoresParticipantesDiv.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            
            // Verificar si está seleccionado
            const isChecked = wog.asadores && wog.asadores.includes(p.id);
            
            checkbox.innerHTML = `
                <input type="checkbox" id="editar-asador-${p.id}" value="${p.id}" name="asadores[]" ${isChecked ? 'checked' : ''}>
                <label for="editar-asador-${p.id}">${p.nombre}</label>
            `;
            
            // Agregar clase para estilo si está seleccionado
            if (isChecked) {
                checkbox.classList.add('selected');
            }
            
            editarAsadoresParticipantesDiv.appendChild(checkbox);
        });
        
        // Llenar checkboxes de asistentes
        editarAsistentesLista.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            
            // Verificar si está seleccionado
            const isChecked = wog.asistentes && wog.asistentes.includes(p.id);
            
            checkbox.innerHTML = `
                <input type="checkbox" id="editar-asistente-${p.id}" value="${p.id}" name="asistentes[]" ${isChecked ? 'checked' : ''}>
                <label for="editar-asistente-${p.id}">${p.nombre}</label>
            `;
            
            // Agregar clase para estilo si está seleccionado
            if (isChecked) {
                checkbox.classList.add('selected');
            }
            
            editarAsistentesLista.appendChild(checkbox);
        });
        
    } catch (error) {
        console.error('Error al cargar formulario de edición de WOG:', error);
        mostrarToast('Error al cargar datos del WOG', true);
        cerrarModalEditarWog();
    }
}

// Cerrar modal de edición de WOG
function cerrarModalEditarWog() {
    modalEditarWog.style.display = 'none';
}

// Actualizar un WOG existente
async function actualizarWog(event) {
    event.preventDefault();
    
    try {
        const wogId = editarWogId.value;
        
        if (!wogId) {
            mostrarToast('Error: ID de WOG no encontrado', true);
            return;
        }
        
        // Recopilar datos del formulario
        const fecha = editarFechaInput.value;
        const sede = editarSedeSelect.value;
        const subsede = editarSubsedeInput.value.trim();
        const notas = editarNotasInput.value.trim();
        
        // Obtener asadores seleccionados
        const asadores = [];
        editarAsadoresParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            asadores.push(checkbox.value);
        });
        
        // Obtener compras seleccionadas
        const compras = [];
        editarComprasParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            compras.push(checkbox.value);
        });
        
        // Obtener asistentes seleccionados
        const asistentes = [];
        editarAsistentesLista.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            asistentes.push(checkbox.value);
        });
        
        // Validar datos obligatorios
        if (!fecha) {
            mostrarToast('Debes seleccionar una fecha', true);
            return;
        }
        
        if (!sede) {
            mostrarToast('Debes seleccionar una sede', true);
            return;
        }
        
        if (asadores.length === 0) {
            mostrarToast('Debes seleccionar al menos un asador', true);
            return;
        }
        
        if (compras.length === 0) {
            mostrarToast('Debes seleccionar al menos un responsable de compras', true);
            return;
        }
        
        if (asistentes.length === 0) {
            mostrarToast('Debes seleccionar al menos un asistente', true);
            return;
        }
        
        // Validar que la sede esté incluida en los asistentes
        if (!asistentes.includes(sede)) {
            asistentes.push(sede);
        }
        
        // Validar asadores estén incluidos en los asistentes
        asadores.forEach(asador => {
            if (!asistentes.includes(asador)) {
                asistentes.push(asador);
            }
        });
        
        // Validar compras estén incluidas en los asistentes
        compras.forEach(compra => {
            if (!asistentes.includes(compra)) {
                asistentes.push(compra);
            }
        });
        
        // Cambiar botón a estado de carga
        const submitBtn = formEditarWog.querySelector('button[type="submit"]');
        const btnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Obtener el documento actual para conservar datos no modificados
        const docRef = db.collection(COLECCION_WOGS).doc(wogId);
        const doc = await docRef.get();
        const wogActual = doc.data();
        
        // Preparar objeto WOG
        const wogData = {
            fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
            sede,
            subsede,
            asadores,
            compras,
            asistentes,
            notas,
            fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Subir imagen si existe una nueva
        const file = editarImagenWogInput.files[0];
        if (file) {
            try {
                // Comprimir imagen si es muy grande
                let fileToUpload = file;
                if (file.size > 1000000) { // Si es mayor a 1MB
                    try {
                        fileToUpload = await comprimirImagen(file);
                        console.log('Imagen comprimida correctamente');
                    } catch (compressError) {
                        console.error('Error al comprimir imagen:', compressError);
                    }
                }
                
                // Generar nombre único para el archivo
                const extension = file.name.split('.').pop();
                const nombreArchivo = `wog_${wogId}_${Date.now()}`;
                const rutaArchivo = `wogs/${nombreArchivo}.${extension}`;
                
                // Crear referencia al archivo
                const fileRef = storage.ref(rutaArchivo);
                
                // Subir archivo
                const uploadTask = fileRef.put(fileToUpload);
                
                // Esperar a que se complete la subida
                await uploadTask;
                
                // Obtener URL de descarga
                const downloadURL = await fileRef.getDownloadURL();
                wogData.imagen_url = downloadURL;
                
                // Eliminar imagen anterior si existe
                if (wogActual.imagen_url && wogActual.imagen_url.startsWith('https://firebasestorage.googleapis.com')) {
                    try {
                        const imageRef = storage.refFromURL(wogActual.imagen_url);
                        await imageRef.delete();
                    } catch (deleteError) {
                        console.error('Error al eliminar imagen anterior:', deleteError);
                    }
                }
                
            } catch (imgError) {
                console.error('Error procesando imagen:', imgError);
                mostrarToast('Error al procesar la imagen, continuando sin cambiar la imagen', true);
            }
        } else if (wogActual.imagen_url) {
            // Mantener la imagen actual si no se seleccionó una nueva
            wogData.imagen_url = wogActual.imagen_url;
        }
        
        // Actualizar en Firestore
        await docRef.update(wogData);
        
        // Mostrar mensaje de éxito
        mostrarToast('WOG actualizado correctamente');
        
        // Cerrar modal
        cerrarModalEditarWog();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al actualizar WOG:', error);
        mostrarToast('Error al actualizar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        const submitBtn = formEditarWog.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cambios';
    }
}

// Abrir modal para editar un WOG
function abrirModalEditarWog(wogId) {
    // Limpiar formulario
    formEditarWog.reset();
    editarImagenPreview.innerHTML = '';
    
    // Cargar datos del WOG
    cargarFormularioEdicionWog(wogId);
    
    // Mostrar modal
    modalEditarWog.style.display = 'block';
}

// Exportar funciones necesarias al alcance global
window.abrirModalEditarWog = abrirModalEditarWog;