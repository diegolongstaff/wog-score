// Módulo para gestionar los WOGs

// Referencias a elementos del DOM
const formNuevoWog = document.getElementById('nuevo-wog-form');
const fechaInput = document.getElementById('fecha');
const sedeSelect = document.getElementById('sede');
const subsedeInput = document.getElementById('subsede');
const comprasSelect = document.getElementById('compras');
const comprasCompartidasDiv = document.getElementById('compras-compartidas');
const comprasParticipantesDiv = document.getElementById('compras-participantes');
const asadoresContainer = document.getElementById('asadores-container');
const asistentesLista = document.getElementById('asistentes-lista');
const notasInput = document.getElementById('notas');
const btnAddAsador = document.getElementById('add-asador');
const fotoWogInput = document.getElementById('foto-wog');
const previewFotoWog = document.getElementById('preview-foto-wog');

// Inicializar módulo
function initWogModule() {
    console.log('Inicializando módulo de WOGs...');
    
    // Establecer fecha actual por defecto
    const hoy = new Date();
    fechaInput.value = formatearFechaInput(hoy);
    
    // Configurar eventos
    formNuevoWog.addEventListener('submit', guardarWog);
    comprasSelect.addEventListener('change', toggleComprasCompartidas);
    btnAddAsador.addEventListener('click', agregarSelectorAsador);
    fotoWogInput.addEventListener('change', previsualizarFotoWog);
    
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
        // Limpiar el formulario de edición si existe
        if (formNuevoWog.hasAttribute('data-editing-id')) {
            formNuevoWog.removeAttribute('data-editing-id');
            
            // Cambiar texto del botón a "Guardar WOG"
            const submitBtn = formNuevoWog.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Guardar WOG';
            
            // Limpiar previsualización de foto
            if (previewFotoWog) {
                previewFotoWog.innerHTML = '';
            }
        }
        
        // Obtener participantes activos
        const snapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .get();
        
        const participantes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Ordenar por nombre
        participantes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Llenar selector de sede
        sedeSelect.innerHTML = '<option value="">Seleccionar anfitrión</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            sedeSelect.appendChild(option);
        });
        
        // Llenar selector de compras
        comprasSelect.innerHTML = '<option value="">Seleccionar responsable</option>';
        comprasSelect.innerHTML += '<option value="compartido">Compartido</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            comprasSelect.appendChild(option);
        });
        
        // Llenar selector de asador
        const asadorSelect = asadoresContainer.querySelector('.asador-select');
        asadorSelect.innerHTML = '<option value="">Seleccionar asador</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            asadorSelect.appendChild(option);
        });
        
        // Llenar checkboxes de asistentes
        asistentesLista.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="asistente-${p.id}" value="${p.id}">
                <label for="asistente-${p.id}">${p.nombre}</label>
            `;
            asistentesLista.appendChild(checkbox);
        });
        
        // Llenar checkboxes de compras compartidas
        comprasParticipantesDiv.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="compra-compartida-${p.id}" value="${p.id}">
                <label for="compra-compartida-${p.id}">${p.nombre}</label>
            `;
            comprasParticipantesDiv.appendChild(checkbox);
        });
        
        // Limpiar campo de notas
        notasInput.value = '';
        
    } catch (error) {
        console.error('Error al cargar formulario de WOG:', error);
        mostrarToast('Error al cargar participantes', true);
    }
}

// Mostrar/ocultar sección de compras compartidas
function toggleComprasCompartidas() {
    if (comprasSelect.value === 'compartido') {
        comprasCompartidasDiv.style.display = 'block';
    } else {
        comprasCompartidasDiv.style.display = 'none';
    }
}
// Previsualizar foto del WOG seleccionada
function previsualizarFotoWog(event) {
    const file = event.target.files[0];
    if (!file) {
        previewFotoWog.innerHTML = '';
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
        previewFotoWog.innerHTML = '';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Vista previa';
        previewFotoWog.appendChild(img);
    };
    reader.readAsDataURL(file);
    
    console.log('Archivo de WOG seleccionado:', file.name, 'Tamaño:', (file.size/1024).toFixed(2), 'KB');
}
// Agregar un selector de asador adicional
function agregarSelectorAsador() {
    // Crear contenedor para el nuevo selector
    const asadorItem = document.createElement('div');
    asadorItem.className = 'asador-item';
    
    // Clonar el primer selector de asador
    const templateSelect = asadoresContainer.querySelector('.asador-select');
    const newSelect = templateSelect.cloneNode(true);
    newSelect.className = 'asador-select';
    newSelect.value = ''; // Resetear valor
    
    // Crear botón para eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-circle btn-small';
    btnEliminar.innerHTML = '<i class="fas fa-times"></i>';
    btnEliminar.style.marginLeft = '10px';
    btnEliminar.addEventListener('click', () => {
        asadorItem.remove();
    });
    
    // Añadir elementos al contenedor
    asadorItem.appendChild(newSelect);
    asadorItem.appendChild(btnEliminar);
    
    // Añadir al contenedor principal
    asadoresContainer.appendChild(asadorItem);
}

// Guardar un nuevo WOG
async function guardarWog(event) {
    event.preventDefault();
    
    try {
        // Verificar si estamos editando un WOG existente
        const wogId = formNuevoWog.getAttribute('data-editing-id');
        const isEditing = !!wogId;
        
        // Recopilar datos del formulario
        const fecha = fechaInput.value;
        const sede = sedeSelect.value;
        const subsede = subsedeInput.value.trim();
        const notas = notasInput.value.trim();
        
        // Obtener asadores
        const asadores = [];
        asadoresContainer.querySelectorAll('.asador-select').forEach(select => {
            if (select.value) {
                asadores.push(select.value);
            }
        });
        
        // Obtener asistentes
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
        
        // Crear fecha sin problemas de zona horaria
        const fechaInputValue = fecha; // Guarda el valor original
        let fechaCorrecta;

        try {
          // Método 1: Usando las partes de la fecha con hora fija
          const fechaPartes = fechaInputValue.split('-').map(part => parseInt(part, 10));
          fechaCorrecta = new Date(fechaPartes[0], fechaPartes[1] - 1, fechaPartes[2], 12, 0, 0);
          
          // Verificar que no haya cambiado el día
          if (fechaCorrecta.getDate() !== fechaPartes[2]) {
            // Método 2: Alternativa con string ISO
            fechaCorrecta = new Date(`${fechaInputValue}T12:00:00`);
          }
        } catch (e) {
          console.error("Error creando fecha:", e);
          // Método de respaldo
          fechaCorrecta = new Date(new Date(fechaInputValue).setHours(12, 0, 0, 0));
        }

        console.log("Fecha original:", fechaInputValue, "Fecha convertida:", fechaCorrecta);
        
        // Preparar objeto WOG
        const wogData = {
            fecha: firebase.firestore.Timestamp.fromDate(fechaCorrecta),
            sede,
            subsede,
            asadores,
            asistentes,
            notas,
        };
        
        // Si es un nuevo WOG, añadir fecha de creación
        if (!isEditing) {
            wogData.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
        } else {
            // Si es edición, añadir fecha de actualización
            wogData.fecha_actualizacion = firebase.firestore.FieldValue.serverTimestamp();
        }

        // Manejar foto del WOG si se seleccionó una
        const fotoFile = fotoWogInput.files[0];
        if (fotoFile) {
            try {
                // Mostrar mensaje sobre la subida
                mostrarToast('Subiendo foto del WOG, esto puede tardar unos segundos...');
                
                // Comprimir imagen si es muy grande
                let fileToUpload = fotoFile;
                if (fotoFile.size > 1000000) { // Si es mayor a 1MB
                    try {
                        fileToUpload = await comprimirImagen(fotoFile);
                        console.log('Foto del WOG comprimida correctamente');
                    } catch (compressError) {
                        console.error('Error al comprimir foto:', compressError);
                    }
                }
                
                // Generar nombre único para el archivo
                const extension = fotoFile.name.split('.').pop();
                const nombreArchivo = `wog_${Date.now()}`;
                const rutaArchivo = `wogs/${nombreArchivo}.${extension}`;
                
                // Crear referencia al archivo
                const fileRef = storage.ref(rutaArchivo);
                
                // Subir archivo con control de progreso
                const uploadTask = fileRef.put(fileToUpload);
                
                // Monitor de progreso
                uploadTask.on('state_changed',
                    // Progreso
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Progreso de subida de foto WOG: ' + progress.toFixed(0) + '%');
                    },
                    // Error
                    (error) => {
                        console.error('Error al subir foto a Storage:', error);
                        throw error;
                    }
                );
                
                // Esperar a que se complete la subida
                await uploadTask;
                
                // Obtener URL de descarga
                const downloadURL = await fileRef.getDownloadURL();
                wogData.foto_url = downloadURL;
                
            } catch (imgError) {
                console.error('Error procesando foto del WOG:', imgError);
                mostrarToast('Error al procesar la foto, continuando sin foto', true);
            }
        } else if (isEditing) {
            // Si estamos editando y no se seleccionó una nueva foto, mantener la URL de la foto existente
            // Obtener los datos actuales del WOG para conseguir la URL de la foto
            if (previewFotoWog && previewFotoWog.querySelector('img')) {
                const imgSrc = previewFotoWog.querySelector('img').src;
                // Solo guardar la URL si parece ser una URL válida de Firebase Storage
                if (imgSrc.includes('firebasestorage.googleapis.com')) {
                    wogData.foto_url = imgSrc;
                }
            }
        }
        
        // Manejar compras (normal o compartidas)
        if (comprasSelect.value === 'compartido') {
            // Obtener participantes seleccionados para compras compartidas
            const comprasCompartidas = [];
            comprasParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                comprasCompartidas.push(checkbox.value);
                
                // Asegurar que estén en la lista de asistentes
                if (!asistentes.includes(checkbox.value)) {
                    asistentes.push(checkbox.value);
                }
            });
            
            if (comprasCompartidas.length === 0) {
                mostrarToast('Debes seleccionar al menos un participante para compras compartidas', true);
                return;
            }
            
            wogData.comprasCompartidas = comprasCompartidas;
            
            // Asegurarse de eliminar el campo compras si existe
            if (isEditing) {
                wogData.compras = firebase.firestore.FieldValue.delete();
            }
        } else if (comprasSelect.value) {
            wogData.compras = comprasSelect.value;
            
            // Asegurar que esté en la lista de asistentes
            if (!asistentes.includes(comprasSelect.value)) {
                asistentes.push(comprasSelect.value);
            }
            
            // Asegurarse de eliminar el campo comprasCompartidas si existe
            if (isEditing) {
                wogData.comprasCompartidas = firebase.firestore.FieldValue.delete();
            }
        } else {
            mostrarToast('Debes seleccionar quién hizo las compras', true);
            return;
        }
        
        // Cambiar botón a estado de carga
        const submitBtn = formNuevoWog.querySelector('button[type="submit"]');
        const btnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // En caso de edición, ajustar puntuaciones antes de actualizar
        if (isEditing) {
            // Obtener datos actuales del WOG
            const docRef = db.collection(COLECCION_WOGS).doc(wogId);
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                const wogActual = docSnap.data();
                
                // ---- SECCIÓN CORREGIDA PARA EVITAR EL ERROR DE TRANSACCIÓN ----
                
                // Primero hacemos todas las lecturas necesarias fuera de la transacción
                const participantesLecturas = new Map();
                
                // 1. Leer datos de la sede actual
                if (wogActual.sede) {
                    const sedeDoc = await db.collection(COLECCION_PARTICIPANTES).doc(wogActual.sede).get();
                    if (sedeDoc.exists) {
                        participantesLecturas.set(wogActual.sede, sedeDoc.data());
                    }
                }
                
                // 2. Leer datos de la nueva sede (si es diferente)
                if (sede !== wogActual.sede) {
                    const nuevaSedeDoc = await db.collection(COLECCION_PARTICIPANTES).doc(sede).get();
                    if (nuevaSedeDoc.exists) {
                        participantesLecturas.set(sede, nuevaSedeDoc.data());
                    }
                }
                
                // 3. Leer datos de asadores actuales
                if (wogActual.asadores && wogActual.asadores.length > 0) {
                    for (const asadorId of wogActual.asadores) {
                        if (!participantesLecturas.has(asadorId)) {
                            const asadorDoc = await db.collection(COLECCION_PARTICIPANTES).doc(asadorId).get();
                            if (asadorDoc.exists) {
                                participantesLecturas.set(asadorId, asadorDoc.data());
                            }
                        }
                    }
                }
                
                // 4. Leer datos de nuevos asadores
                for (const asadorId of asadores) {
                    if (!participantesLecturas.has(asadorId)) {
                        const asadorDoc = await db.collection(COLECCION_PARTICIPANTES).doc(asadorId).get();
                        if (asadorDoc.exists) {
                            participantesLecturas.set(asadorId, asadorDoc.data());
                        }
                    }
                }
                
                // 5. Leer datos de compras actuales
                if (wogActual.comprasCompartidas && wogActual.comprasCompartidas.length > 0) {
                    for (const compraId of wogActual.comprasCompartidas) {
                        if (!participantesLecturas.has(compraId)) {
                            const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(compraId).get();
                            if (compraDoc.exists) {
                                participantesLecturas.set(compraId, compraDoc.data());
                            }
                        }
                    }
                } else if (wogActual.compras && !participantesLecturas.has(wogActual.compras)) {
                    const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(wogActual.compras).get();
                    if (compraDoc.exists) {
                        participantesLecturas.set(wogActual.compras, compraDoc.data());
                    }
                }
                
                // 6. Leer datos de nuevas compras
                if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
                    for (const compraId of wogData.comprasCompartidas) {
                        if (!participantesLecturas.has(compraId)) {
                            const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(compraId).get();
                            if (compraDoc.exists) {
                                participantesLecturas.set(compraId, compraDoc.data());
                            }
                        }
                    }
                } else if (wogData.compras && !participantesLecturas.has(wogData.compras)) {
                    const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras).get();
                    if (compraDoc.exists) {
                        participantesLecturas.set(wogData.compras, compraDoc.data());
                    }
                }
                
                // Ahora hacemos la transacción con todas las lecturas ya realizadas
                await db.runTransaction(async transaction => {
                    // Primero actualizamos el documento del WOG
                    transaction.update(docRef, wogData);
                    
                    // Luego ajustamos los puntos
                    
                    // 1. Restar puntos de sede anterior
                    if (wogActual.sede) {
                        const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wogActual.sede);
                        const puntosSedeActual = participantesLecturas.get(wogActual.sede)?.puntos_sede || 0;
                        transaction.update(sedeRef, {
                            puntos_sede: Math.max(0, puntosSedeActual - 1)
                        });
                    }
                    
                    // 2. Añadir puntos a nueva sede
                    if (sede) {
                        const nuevaSedeRef = db.collection(COLECCION_PARTICIPANTES).doc(sede);
                        const puntosSedeNueva = participantesLecturas.get(sede)?.puntos_sede || 0;
                        transaction.update(nuevaSedeRef, {
                            puntos_sede: puntosSedeNueva + 1
                        });
                    }
                    
                    // 3. Ajustar puntos de asadores
                    if (wogActual.asadores && wogActual.asadores.length > 0) {
                        const puntoPorAsadorAnterior = 1 / wogActual.asadores.length;
                        
                        for (const asadorId of wogActual.asadores) {
                            const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                            const puntosAsadorActual = participantesLecturas.get(asadorId)?.puntos_asador || 0;
                            transaction.update(asadorRef, {
                                puntos_asador: Math.max(0, puntosAsadorActual - puntoPorAsadorAnterior)
                            });
                        }
                    }
                    
                    if (asadores.length > 0) {
                        const nuevoPuntoPorAsador = 1 / asadores.length;
                        
                        for (const asadorId of asadores) {
                            const nuevoAsadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                            const puntosAsadorNuevo = participantesLecturas.get(asadorId)?.puntos_asador || 0;
                            transaction.update(nuevoAsadorRef, {
                                puntos_asador: puntosAsadorNuevo + nuevoPuntoPorAsador
                            });
                        }
                    }
                    
                    // 4. Ajustar puntos de compras
                    if (wogActual.comprasCompartidas && wogActual.comprasCompartidas.length > 0) {
                        const puntoPorCompraAnterior = 1 / wogActual.comprasCompartidas.length;
                        
                        for (const compraId of wogActual.comprasCompartidas) {
                            const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                await compraRef.update({
                    puntos_compras: firebase.firestore.FieldValue.increment(puntoPorCompra)
                });
            }
        } else if (wogData.compras) {
            const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras);
            await compraRef.update({
                puntos_compras: firebase.firestore.FieldValue.increment(1)
            });
        }
    } catch (error) {
        console.error('Error al actualizar puntuaciones:', error);
        // Este error no debería detener el proceso de guardar el WOG
    }
}

// Exportar funciones necesarias al alcance global
window.toggleComprasCompartidas = toggleComprasCompartidas;
window.agregarSelectorAsador = agregarSelectorAsador;            const puntosCompraActual = participantesLecturas.get(compraId)?.puntos_compras || 0;
                            transaction.update(compraRef, {
                                puntos_compras: Math.max(0, puntosCompraActual - puntoPorCompraAnterior)
                            });
                        }
                    } else if (wogActual.compras) {
                        const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogActual.compras);
                        const puntosCompraActual = participantesLecturas.get(wogActual.compras)?.puntos_compras || 0;
                        transaction.update(compraRef, {
                            puntos_compras: Math.max(0, puntosCompraActual - 1)
                        });
                    }
                    
                    if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
                        const nuevoPuntoPorCompra = 1 / wogData.comprasCompartidas.length;
                        
                        for (const compraId of wogData.comprasCompartidas) {
                            const nuevaCompraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                            const puntosCompraNuevo = participantesLecturas.get(compraId)?.puntos_compras || 0;
                            transaction.update(nuevaCompraRef, {
                                puntos_compras: puntosCompraNuevo + nuevoPuntoPorCompra
                            });
                        }
                    } else if (wogData.compras) {
                        const nuevaCompraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras);
                        const puntosCompraNuevo = participantesLecturas.get(wogData.compras)?.puntos_compras || 0;
                        transaction.update(nuevaCompraRef, {
                            puntos_compras: puntosCompraNuevo + 1
                        });
                    }
                });
                
                // Mostrar mensaje de éxito
                mostrarToast('WOG actualizado correctamente');
                
            } else {
                // Si no existe, mostrar error
                mostrarToast('Error: WOG no encontrado', true);
            }
        } else {
            // Guardar nuevo WOG en Firestore
            await db.collection(COLECCION_WOGS).add(wogData);
            
            // Actualizar puntos de los participantes
            await actualizarPuntuaciones(wogData);
            
            // Mostrar mensaje de éxito
            mostrarToast('WOG registrado correctamente');
        }
        
        // Limpiar vista previa de foto
        previewFotoWog.innerHTML = '';
        
        // Resetear formulario
        formNuevoWog.reset();
        formNuevoWog.removeAttribute('data-editing-id');
        fechaInput.value = formatearFechaInput(new Date());
        comprasCompartidasDiv.style.display = 'none';
        
        // Mantener solo un selector de asador
        const primerAsador = asadoresContainer.querySelector('.asador-item');
        asadoresContainer.innerHTML = '';
        asadoresContainer.appendChild(primerAsador);
        
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

// Actualizar puntuaciones de participantes
async function actualizarPuntuaciones(wogData) {
    try {
        // 1. Actualizar puntos por sede (1 punto)
        if (wogData.sede) {
            const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.sede);
            await sedeRef.update({
                puntos_sede: firebase.firestore.FieldValue.increment(1)
            });
        }
        
        // 2. Actualizar puntos por asador (1 punto dividido entre todos los asadores)
        if (wogData.asadores && wogData.asadores.length > 0) {
            const puntoPorAsador = 1 / wogData.asadores.length;
            
            for (const asadorId of wogData.asadores) {
                const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                await asadorRef.update({
                    puntos_asador: firebase.firestore.FieldValue.increment(puntoPorAsador)
                });
            }
        }
        
        // 3. Actualizar puntos por compras (1 punto)
        if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
            const puntoPorCompra = 1 / wogData.comprasCompartidas.length;
            
            for (const compraId of wogData.comprasCompartidas) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                await compraRef.update({
                    puntos_compras: firebase.firestore.FieldValue.increment(puntoPorCompra)
                });
            }
        } else if (wogData.compras) {
            const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras);
            await compraRef.update({
                puntos_compras: firebase.firestore.FieldValue.increment(1)
            });
        }
    } catch (error) {
        console.error('Error al actualizar puntuaciones:', error);
        // Este error no debería detener el proceso de guardar el WOG
    }
}

// Exportar funciones necesarias al alcance global
window.toggleComprasCompartidas = toggleComprasCompartidas;
window.agregarSelectorAsador = agregarSelectorAsador;
window.previsualizarFotoWog = previsualizarFotoWog;
                
