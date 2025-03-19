// Módulo para editar WOGs con redistribución adecuada de puntos

// Referencias a elementos del DOM para el modal de edición
let modalEditWog = null;
let formEditWog = null;
let editWogId = null;
let originalWogData = null; // Para almacenar los datos originales y compararlos

// Inicializar el módulo de edición
function initWogEditModule() {
    console.log('Inicializando módulo de Edición de WOG...');
    
    // Crear el modal para editar WOGs si no existe
    createEditModal();
    
    // Configurar eventos de cierre del modal
    document.querySelector('#modal-edit-wog .close-modal').addEventListener('click', () => {
        modalEditWog.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === modalEditWog) {
            modalEditWog.style.display = 'none';
        }
    });
    
    // Configurar envío del formulario
    formEditWog.addEventListener('submit', saveEditedWog);
    
    // Configurar cambio de compras
    document.getElementById('edit-compras').addEventListener('change', toggleEditComprasCompartidas);

    // Configurar botón para agregar asadores
    document.getElementById('edit-add-asador').addEventListener('click', addAsadorSelector);
    
    console.log('Módulo de Edición de WOG inicializado correctamente');
}

// Crear el modal de edición en el DOM
function createEditModal() {
    // Comprobar si el modal ya existe
    if (document.getElementById('modal-edit-wog')) {
        modalEditWog = document.getElementById('modal-edit-wog');
        formEditWog = document.getElementById('edit-wog-form');
        return;
    }
    
    // Crear elemento modal
    const modalHTML = `
        <div id="modal-edit-wog" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Editar WOG</h2>
                
                <form id="edit-wog-form">
                    <input type="hidden" id="edit-wog-id">
                    
                    <div class="form-group">
                        <label for="edit-fecha">Fecha</label>
                        <input type="date" id="edit-fecha" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-sede">Sede</label>
                        <select id="edit-sede" required>
                            <option value="">Seleccionar anfitrión</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-subsede">Subsede</label>
                        <input type="text" id="edit-subsede" placeholder="Ej: Casa, Club, CNSI...">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-compras">Compras</label>
                        <select id="edit-compras" required>
                            <option value="">Seleccionar responsable</option>
                            <option value="compartido">Compartido</option>
                        </select>
                    </div>
                    
                    <div id="edit-compras-compartidas" class="form-group" style="display: none;">
                        <label>Compras compartidas entre:</label>
                        <div id="edit-compras-participantes" class="checkbox-group"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Asador</label>
                        <div id="edit-asadores-container">
                            <div class="asador-item">
                                <select class="asador-select" required>
                                    <option value="">Seleccionar asador</option>
                                </select>
                            </div>
                        </div>
                        <button type="button" id="edit-add-asador" class="btn btn-circle">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label>Asistentes</label>
                        <div id="edit-asistentes-lista" class="checkbox-group"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-notas">Notas (opcional)</label>
                        <textarea id="edit-notas" placeholder="Temas discutidos, actividades, anécdotas..." rows="4"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="btn-cancelar-edit-wog" class="btn btn-cancel">Cancelar</button>
                        <button type="submit" class="btn btn-submit">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Añadir modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Obtener referencias al modal y formulario
    modalEditWog = document.getElementById('modal-edit-wog');
    formEditWog = document.getElementById('edit-wog-form');
    
    // Configurar botón de cancelar
    document.getElementById('btn-cancelar-edit-wog').addEventListener('click', () => {
        modalEditWog.style.display = 'none';
    });
}

// Alternar sección de compras compartidas
function toggleEditComprasCompartidas() {
    const comprasSelect = document.getElementById('edit-compras');
    const comprasCompartidasDiv = document.getElementById('edit-compras-compartidas');
    
    if (comprasSelect.value === 'compartido') {
        comprasCompartidasDiv.style.display = 'block';
    } else {
        comprasCompartidasDiv.style.display = 'none';
    }
}

// Añadir otro selector de asador
function addAsadorSelector() {
    const asadoresContainer = document.getElementById('edit-asadores-container');
    
    // Crear contenedor para el nuevo selector
    const asadorItem = document.createElement('div');
    asadorItem.className = 'asador-item';
    
    // Clonar el primer selector de asador
    const templateSelect = asadoresContainer.querySelector('.asador-select');
    const newSelect = templateSelect.cloneNode(true);
    newSelect.className = 'asador-select';
    newSelect.value = ''; // Resetear valor
    
    // Crear botón para eliminar
    const btnDelete = document.createElement('button');
    btnDelete.type = 'button';
    btnDelete.className = 'btn-circle btn-small';
    btnDelete.innerHTML = '<i class="fas fa-times"></i>';
    btnDelete.style.marginLeft = '10px';
    btnDelete.addEventListener('click', () => {
        asadorItem.remove();
    });
    
    // Añadir elementos al contenedor
    asadorItem.appendChild(newSelect);
    asadorItem.appendChild(btnDelete);
    
    // Añadir al contenedor principal
    asadoresContainer.appendChild(asadorItem);
}

// Abrir el modal de edición con los datos del WOG
async function editWog(wogId) {
    try {
        editWogId = wogId;
        
        // Mostrar estado de carga
        modalEditWog.style.display = 'block';
        formEditWog.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Obtener datos del WOG
        const docRef = db.collection(COLECCION_WOGS).doc(wogId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
            modalEditWog.style.display = 'none';
            return;
        }
        
        // Almacenar datos originales para comparación al guardar
        originalWogData = {
            id: doc.id,
            ...doc.data()
        };
        
        // Restaurar formulario
        createEditModal(); // Esto restablecerá la estructura del formulario
        
        // Cargar participantes para poblar selectores
        await loadEditFormParticipants();
        
        // Rellenar formulario con datos del WOG
        fillEditForm(originalWogData);
        
    } catch (error) {
        console.error('Error al cargar WOG para editar:', error);
        mostrarToast('Error al cargar el WOG para editar', true);
        modalEditWog.style.display = 'none';
    }
}

// Cargar participantes para el formulario de edición
async function loadEditFormParticipants() {
    try {
        // Obtener participantes activos
        const snapshot = await db.collection(COLECCION_PARTICIPANTES)
            .where('activo', '==', true)
            .get();
        
        const participants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Ordenar por nombre
        participants.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Rellenar selector de sede
        const sedeSelect = document.getElementById('edit-sede');
        sedeSelect.innerHTML = '<option value="">Seleccionar anfitrión</option>';
        participants.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            sedeSelect.appendChild(option);
        });
        
        // Rellenar selector de compras
        const comprasSelect = document.getElementById('edit-compras');
        comprasSelect.innerHTML = '<option value="">Seleccionar responsable</option>';
        comprasSelect.innerHTML += '<option value="compartido">Compartido</option>';
        participants.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            comprasSelect.appendChild(option);
        });
        
        // Rellenar selector de asador
        const asadorSelect = document.querySelector('#edit-asadores-container .asador-select');
        asadorSelect.innerHTML = '<option value="">Seleccionar asador</option>';
        participants.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            asadorSelect.appendChild(option);
        });
        
        // Rellenar checkboxes de asistentes
        const asistentesLista = document.getElementById('edit-asistentes-lista');
        asistentesLista.innerHTML = '';
        participants.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="edit-asistente-${p.id}" value="${p.id}">
                <label for="edit-asistente-${p.id}">${p.nombre}</label>
            `;
            asistentesLista.appendChild(checkbox);
        });
        
        // Rellenar checkboxes de compras compartidas
        const comprasParticipantesDiv = document.getElementById('edit-compras-participantes');
        comprasParticipantesDiv.innerHTML = '';
        participants.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="edit-compra-compartida-${p.id}" value="${p.id}">
                <label for="edit-compra-compartida-${p.id}">${p.nombre}</label>
            `;
            comprasParticipantesDiv.appendChild(checkbox);
        });
        
    } catch (error) {
        console.error('Error cargando participantes para edición:', error);
        throw error;
    }
}

// Rellenar el formulario con los datos del WOG
function fillEditForm(wogData) {
    // Establecer ID oculto
    document.getElementById('edit-wog-id').value = wogData.id;
    
    // Establecer fecha
    if (wogData.fecha) {
        const fecha = wogData.fecha.toDate ? wogData.fecha.toDate() : new Date(wogData.fecha);
        document.getElementById('edit-fecha').value = formatearFechaInput(fecha);
    }
    
    // Establecer sede y subsede
    if (wogData.sede) document.getElementById('edit-sede').value = wogData.sede;
    if (wogData.subsede) document.getElementById('edit-subsede').value = wogData.subsede;
    
    // Establecer notas
    if (wogData.notas) document.getElementById('edit-notas').value = wogData.notas;
    
    // Establecer compras
    if (wogData.compras) {
        document.getElementById('edit-compras').value = wogData.compras;
    } else if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
        document.getElementById('edit-compras').value = 'compartido';
        toggleEditComprasCompartidas();
        
        // Marcar checkboxes de compras compartidas
        setTimeout(() => {
            wogData.comprasCompartidas.forEach(id => {
                const checkbox = document.getElementById(`edit-compra-compartida-${id}`);
                if (checkbox) checkbox.checked = true;
            });
        }, 100);
    }
    
    // Configurar asadores
    const asadoresContainer = document.getElementById('edit-asadores-container');
    
    // Limpiar contenedor excepto el primer elemento
    while (asadoresContainer.children.length > 1) {
        asadoresContainer.removeChild(asadoresContainer.lastChild);
    }
    
    // Establecer asadores
    if (wogData.asadores && wogData.asadores.length > 0) {
        // Establecer primer asador
        const firstSelect = asadoresContainer.querySelector('.asador-select');
        if (firstSelect) firstSelect.value = wogData.asadores[0];
        
        // Añadir selectores adicionales para asadores
        for (let i = 1; i < wogData.asadores.length; i++) {
            addAsadorSelector();
        }
        
        // Establecer valores para asadores adicionales
        setTimeout(() => {
            const selectors = asadoresContainer.querySelectorAll('.asador-select');
            wogData.asadores.forEach((id, index) => {
                if (index < selectors.length) {
                    selectors[index].value = id;
                }
            });
        }, 100);
    }
    
    // Establecer asistentes
    if (wogData.asistentes && wogData.asistentes.length > 0) {
        wogData.asistentes.forEach(id => {
            const checkbox = document.getElementById(`edit-asistente-${id}`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Guardar el WOG editado
async function saveEditedWog(event) {
    event.preventDefault();
    
    try {
        const wogId = document.getElementById('edit-wog-id').value;
        if (!wogId) {
            mostrarToast('ID de WOG no válido', true);
            return;
        }
        
        // Recopilar datos del formulario
        const fecha = document.getElementById('edit-fecha').value;
        const sede = document.getElementById('edit-sede').value;
        const subsede = document.getElementById('edit-subsede').value.trim();
        const notas = document.getElementById('edit-notas').value.trim();
        
        // Obtener asadores
        const asadores = [];
        document.querySelectorAll('#edit-asadores-container .asador-select').forEach(select => {
            if (select.value) {
                asadores.push(select.value);
            }
        });
        
        // Obtener asistentes
        const asistentes = [];
        document.querySelectorAll('#edit-asistentes-lista input[type="checkbox"]:checked').forEach(checkbox => {
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
        
        // Validar que los asadores estén incluidos en los asistentes
        asadores.forEach(asador => {
            if (!asistentes.includes(asador)) {
                asistentes.push(asador);
            }
        });
        
        // Crear fecha sin problemas de zona horaria
        const fechaPartes = fecha.split('-').map(part => parseInt(part, 10));
        const fechaObj = new Date(fechaPartes[0], fechaPartes[1] - 1, fechaPartes[2], 12, 0, 0);
        
        // Preparar objeto WOG
        const wogData = {
            fecha: firebase.firestore.Timestamp.fromDate(fechaObj),
            sede,
            subsede,
            asadores,
            asistentes,
            notas,
            fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Manejar compras (normal o compartidas)
        const comprasSelect = document.getElementById('edit-compras');
        if (comprasSelect.value === 'compartido') {
            // Obtener participantes seleccionados para compras compartidas
            const comprasCompartidas = [];
            document.querySelectorAll('#edit-compras-participantes input[type="checkbox"]:checked').forEach(checkbox => {
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
            wogData.compras = firebase.firestore.FieldValue.delete();
        } else if (comprasSelect.value) {
            wogData.compras = comprasSelect.value;
            
            // Asegurar que esté en la lista de asistentes
            if (!asistentes.includes(comprasSelect.value)) {
                asistentes.push(comprasSelect.value);
            }
            
            wogData.comprasCompartidas = firebase.firestore.FieldValue.delete();
        } else {
            mostrarToast('Debes seleccionar quién hizo las compras', true);
            return;
        }
        
        // Cambiar botón a estado de carga
        const submitBtn = formEditWog.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // === PROCESO DE REDISTRIBUCIÓN DE PUNTOS ===
        
        // Primero hacemos todas las lecturas necesarias de la base de datos
        const participantesMap = new Map();
        
        // 1. Obtener datos de sede original y nueva sede
        if (originalWogData.sede) {
            const sedeOriginalDoc = await db.collection(COLECCION_PARTICIPANTES).doc(originalWogData.sede).get();
            if (sedeOriginalDoc.exists) {
                participantesMap.set(originalWogData.sede, sedeOriginalDoc.data());
            }
        }
        
        if (sede !== originalWogData.sede) {
            const nuevaSedeDoc = await db.collection(COLECCION_PARTICIPANTES).doc(sede).get();
            if (nuevaSedeDoc.exists) {
                participantesMap.set(sede, nuevaSedeDoc.data());
            }
        }
        
        // 2. Obtener datos de asadores originales y nuevos
        if (originalWogData.asadores && originalWogData.asadores.length > 0) {
            for (const asadorId of originalWogData.asadores) {
                if (!participantesMap.has(asadorId)) {
                    const asadorDoc = await db.collection(COLECCION_PARTICIPANTES).doc(asadorId).get();
                    if (asadorDoc.exists) {
                        participantesMap.set(asadorId, asadorDoc.data());
                    }
                }
            }
        }
        
        for (const asadorId of asadores) {
            if (!participantesMap.has(asadorId)) {
                const asadorDoc = await db.collection(COLECCION_PARTICIPANTES).doc(asadorId).get();
                if (asadorDoc.exists) {
                    participantesMap.set(asadorId, asadorDoc.data());
                }
            }
        }
        
        // 3. Obtener datos de compras originales y nuevas
        if (originalWogData.comprasCompartidas && originalWogData.comprasCompartidas.length > 0) {
            for (const compraId of originalWogData.comprasCompartidas) {
                if (!participantesMap.has(compraId)) {
                    const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(compraId).get();
                    if (compraDoc.exists) {
                        participantesMap.set(compraId, compraDoc.data());
                    }
                }
            }
        } else if (originalWogData.compras && !participantesMap.has(originalWogData.compras)) {
            const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(originalWogData.compras).get();
            if (compraDoc.exists) {
                participantesMap.set(originalWogData.compras, compraDoc.data());
            }
        }
        
        if (wogData.comprasCompartidas) {
            for (const compraId of wogData.comprasCompartidas) {
                if (!participantesMap.has(compraId)) {
                    const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(compraId).get();
                    if (compraDoc.exists) {
                        participantesMap.set(compraId, compraDoc.data());
                    }
                }
            }
        } else if (wogData.compras && !participantesMap.has(wogData.compras)) {
            const compraDoc = await db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras).get();
            if (compraDoc.exists) {
                participantesMap.set(wogData.compras, compraDoc.data());
            }
        }
        
        // Ahora realizamos la transacción con todas las lecturas ya realizadas
        await db.runTransaction(async transaction => {
            const wogRef = db.collection(COLECCION_WOGS).doc(wogId);
            
            // Actualizar el documento del WOG
            transaction.update(wogRef, wogData);
            
            // === PROCESO DE ACTUALIZACIÓN DE PUNTOS ===
            
            // 1. Ajustar puntos de sede
            if (originalWogData.sede !== sede) {
                // Restar punto de sede original
                if (originalWogData.sede) {
                    const sedeOriginalRef = db.collection(COLECCION_PARTICIPANTES).doc(originalWogData.sede);
                    const puntosSedeOriginal = participantesMap.get(originalWogData.sede)?.puntos_sede || 0;
                    transaction.update(sedeOriginalRef, {
                        puntos_sede: Math.max(0, puntosSedeOriginal - 1)
                    });
                }
                
                // Añadir punto a nueva sede
                const nuevaSedeRef = db.collection(COLECCION_PARTICIPANTES).doc(sede);
                const puntosSedeNueva = participantesMap.get(sede)?.puntos_sede || 0;
                transaction.update(nuevaSedeRef, {
                    puntos_sede: puntosSedeNueva + 1
                });
            }
            
            // 2. Ajustar puntos de asadores
            // Identificar asadores que se eliminaron y agregaron
            const asadoresOriginales = new Set(originalWogData.asadores || []);
            const asadoresNuevos = new Set(asadores);
            
            // Si la cantidad de asadores cambió o hay diferentes asadores, actualizar todos
            if (asadoresOriginales.size !== asadoresNuevos.size || 
                !Array.from(asadoresOriginales).every(id => asadoresNuevos.has(id))) {
                
                // Restar puntos a asadores originales
                if (asadoresOriginales.size > 0) {
                    const puntoPorAsadorOriginal = 1 / asadoresOriginales.size;
                    
                    for (const asadorId of asadoresOriginales) {
                        const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                        const puntosActuales = participantesMap.get(asadorId)?.puntos_asador || 0;
                        transaction.update(asadorRef, {
                            puntos_asador: Math.max(0, puntosActuales - puntoPorAsadorOriginal)
                        });
                    }
                }
                
                // Añadir puntos a nuevos asadores
                if (asadoresNuevos.size > 0) {
                    const puntoPorAsadorNuevo = 1 / asadoresNuevos.size;
                    
                    for (const asadorId of asadoresNuevos) {
                        const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                        const puntosActuales = participantesMap.get(asadorId)?.puntos_asador || 0;
                        transaction.update(asadorRef, {
                            puntos_asador: puntosActuales + puntoPorAsadorNuevo
                        });
                    }
                }
            }
            
            // 3. Ajustar puntos de compras
            const comprasOriginalesCompartidas = new Set(originalWogData.comprasCompartidas || []);
            const comprasNuevasCompartidas = new Set(wogData.comprasCompartidas || []);
            const comprasOriginalIndividual = originalWogData.compras;
            const comprasNuevaIndividual = wogData.compras;
            
            // Restar puntos de compras originales
            if (comprasOriginalesCompartidas.size > 0) {
                const puntoPorCompraOriginal = 1 / comprasOriginalesCompartidas.size;
                
                for (const compraId of comprasOriginalesCompartidas) {
                    const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                    const puntosActuales = participantesMap.get(compraId)?.puntos_compras || 0;
                    transaction.update(compraRef, {
                        puntos_compras: Math.max(0, puntosActuales - puntoPorCompraOriginal)
                    });
                }
            } else if (comprasOriginalIndividual) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(comprasOriginalIndividual);
                const puntosActuales = participantesMap.get(comprasOriginalIndividual)?.puntos_compras || 0;
                transaction.update(compraRef, {
                    puntos_compras: Math.max(0, puntosActuales - 1)
                });
            }
            
            // Añadir puntos a nuevas compras
            if (comprasNuevasCompartidas.size > 0) {
                const puntoPorCompraNueva = 1 / comprasNuevasCompartidas.size;
                
                for (const compraId of comprasNuevasCompartidas) {
                    const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                    const puntosActuales = participantesMap.get(compraId)?.puntos_compras || 0;
                    transaction.update(compraRef, {
                        puntos_compras: puntosActuales + puntoPorCompraNueva
                    });
                }
            } else if (comprasNuevaIndividual) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(comprasNuevaIndividual);
                const puntosActuales = participantesMap.get(comprasNuevaIndividual)?.puntos_compras || 0;
                transaction.update(compraRef, {
                    puntos_compras: puntosActuales + 1
                });
            }
        });
        
        // Mostrar mensaje de éxito
        mostrarToast('WOG actualizado correctamente con redistribución de puntos');
        
        // Cerrar modal
        modalEditWog.style.display = 'none';
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
        // Recargar historial
        if (typeof cargarHistorialDirecto === 'function') {
            setTimeout(cargarHistorialDirecto, 500);
        }
        
    } catch (error) {
        console.error('Error al guardar WOG editado:', error);
        mostrarToast('Error al guardar cambios: ' + error.message, true);
    } finally {
        // Restaurar botón
        const submitBtn = formEditWog.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cambios';
    }
}

// Función para abrir el formulario de edición (para llamar desde app.js)
function editarWogDirecto(wogId) {
    // Inicializar el módulo si aún no se ha hecho
    if (!modalEditWog) {
        initWogEditModule();
    }
    
    // Abrir modal de edición con los datos del WOG
    editWog(wogId);
}

// Exportar funciones necesarias al alcance global
window.editWog = editWog;
window.initWogEditModule = initWogEditModule;
