// Módulo para la edición de WOGs y redistribución de puntos

// Referencias a elementos del DOM
let modalEditWog;
let formEditWog;
let editWogIdInput;
let editFechaInput;
let editSedeSelect;
let editSubsedeInput;
let editComprasSelect;
let editComprasCompartidasDiv;
let editComprasParticipantesDiv;
let editAsadoresContainer;
let editAsistentesLista;
let editNotasInput;
let btnEditAddAsador;

// Variable para almacenar los datos originales del WOG
let originalWogData = null;

// Inicializar referencias al DOM
function inicializarReferenciasEdicion() {
    modalEditWog = document.getElementById('modal-edit-wog');
    formEditWog = document.getElementById('edit-wog-form');
    editWogIdInput = document.getElementById('edit-wog-id');
    editFechaInput = document.getElementById('edit-fecha');
    editSedeSelect = document.getElementById('edit-sede');
    editSubsedeInput = document.getElementById('edit-subsede');
    editComprasSelect = document.getElementById('edit-compras');
    editComprasCompartidasDiv = document.getElementById('edit-compras-compartidas');
    editComprasParticipantesDiv = document.getElementById('edit-compras-participantes');
    editAsadoresContainer = document.getElementById('edit-asadores-container');
    editAsistentesLista = document.getElementById('edit-asistentes-lista');
    editNotasInput = document.getElementById('edit-notas');
    btnEditAddAsador = document.getElementById('edit-add-asador');

    // Configurar eventos
    if (formEditWog) {
        formEditWog.addEventListener('submit', guardarWogEditado);
    }
    if (btnEditAddAsador) {
        btnEditAddAsador.addEventListener('click', agregarEditSelectorAsador);
    }
    if (editComprasSelect) {
        editComprasSelect.addEventListener('change', toggleEditComprasCompartidas);
    }
    
    const btnCancelarEdit = document.getElementById('btn-cancelar-edit');
    if (btnCancelarEdit) {
        btnCancelarEdit.addEventListener('click', () => {
            modalEditWog.style.display = 'none';
        });
    }
}

// Inicializar módulo
function initWogEditModule() {
    console.log('Inicializando módulo de edición de WOGs...');
    
    // Inicializar referencias al DOM
    inicializarReferenciasEdicion();
    
    console.log('Módulo de edición de WOGs inicializado correctamente');
}

// Mostrar/ocultar sección de compras compartidas en edición
function toggleEditComprasCompartidas() {
    if (!editComprasSelect || !editComprasCompartidasDiv) return;
    
    if (editComprasSelect.value === 'compartido') {
        editComprasCompartidasDiv.style.display = 'block';
    } else {
        editComprasCompartidasDiv.style.display = 'none';
    }
}

// Agregar un selector de asador adicional
function agregarEditSelectorAsador() {
    if (!editAsadoresContainer) return;
    
    // Crear contenedor para el nuevo selector
    const asadorItem = document.createElement('div');
    asadorItem.className = 'asador-item';
    
    // Clonar el primer selector de asador
    const templateSelect = editAsadoresContainer.querySelector('.asador-select');
    if (!templateSelect) return;
    
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
    editAsadoresContainer.appendChild(asadorItem);
}

// Cargar formulario de edición con datos de participantes
async function cargarFormularioEditWog() {
    try {
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
        editSedeSelect.innerHTML = '<option value="">Seleccionar anfitrión</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            editSedeSelect.appendChild(option);
        });
        
        // Llenar selector de compras
        editComprasSelect.innerHTML = '<option value="">Seleccionar responsable</option>';
        editComprasSelect.innerHTML += '<option value="compartido">Compartido</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            editComprasSelect.appendChild(option);
        });
        
        // Llenar selector de asador
        const asadorSelect = editAsadoresContainer.querySelector('.asador-select');
        asadorSelect.innerHTML = '<option value="">Seleccionar asador</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            asadorSelect.appendChild(option);
        });
        
        // Llenar checkboxes de asistentes
        editAsistentesLista.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="edit-asistente-${p.id}" value="${p.id}">
                <label for="edit-asistente-${p.id}">${p.nombre}</label>
            `;
            editAsistentesLista.appendChild(checkbox);
        });
        
        // Llenar checkboxes de compras compartidas
        editComprasParticipantesDiv.innerHTML = '';
        participantes.forEach(p => {
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="edit-compra-compartida-${p.id}" value="${p.id}">
                <label for="edit-compra-compartida-${p.id}">${p.nombre}</label>
            `;
            editComprasParticipantesDiv.appendChild(checkbox);
        });
    } catch (error) {
        console.error('Error al cargar participantes para edición:', error);
        mostrarToast('Error al cargar participantes', true);
    }
}

// Llenar formulario con datos del WOG a editar
function llenarFormularioEdit(wog) {
    // Guardar datos originales para comparar cambios
    originalWogData = {...wog};
    
    // Llenar campos básicos
    editWogIdInput.value = wog.id || '';
    
    if (wog.fecha) {
        const fecha = wog.fecha.toDate ? wog.fecha.toDate() : new Date(wog.fecha);
        editFechaInput.value = formatearFechaInput(fecha);
    }
    
    editSedeSelect.value = wog.sede || '';
    editSubsedeInput.value = wog.subsede || '';
    editNotasInput.value = wog.notas || '';
    
    // Configurar asadores
    // Limpiar todos excepto el primero
    const asadorItems = editAsadoresContainer.querySelectorAll('.asador-item');
    for (let i = 1; i < asadorItems.length; i++) {
        asadorItems[i].remove();
    }
    
    // Configurar el primer asador
    const primerAsadorSelect = editAsadoresContainer.querySelector('.asador-select');
    if (primerAsadorSelect && wog.asadores && wog.asadores.length > 0) {
        primerAsadorSelect.value = wog.asadores[0];
        
        // Agregar asadores adicionales si hay más de uno
        for (let i = 1; i < wog.asadores.length; i++) {
            agregarEditSelectorAsador();
            const selects = editAsadoresContainer.querySelectorAll('.asador-select');
            selects[selects.length - 1].value = wog.asadores[i];
        }
    }
    
    // Configurar compras
    if (wog.compras) {
        // Un solo comprador
        editComprasSelect.value = wog.compras;
        editComprasCompartidasDiv.style.display = 'none';
    } else if (wog.comprasCompartidas && wog.comprasCompartidas.length > 0) {
        // Compras compartidas
        editComprasSelect.value = 'compartido';
        editComprasCompartidasDiv.style.display = 'block';
        
        // Marcar los checkboxes correspondientes
        wog.comprasCompartidas.forEach(compradorId => {
            const checkbox = document.getElementById(`edit-compra-compartida-${compradorId}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Marcar asistentes
    // Desmarcar todos primero
    editAsistentesLista.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Marcar los asistentes de este WOG
    if (wog.asistentes) {
        wog.asistentes.forEach(asistente => {
            const checkbox = document.getElementById(`edit-asistente-${asistente}`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Abrir modal para editar un WOG
async function editarWog(wogId) {
    console.log('Editando WOG:', wogId);
    try {
        if (!modalEditWog) {
            console.error('Modal de edición no encontrado');
            return;
        }
        
        // Obtener datos del WOG
        const docRef = db.collection(COLECCION_WOGS).doc(wogId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG', true);
            return;
        }
        
        const wog = {
            id: doc.id,
            ...doc.data()
        };
        
        // Cargar participantes para el formulario
        await cargarFormularioEditWog();
        
        // Llenar formulario con datos del WOG
        llenarFormularioEdit(wog);
        
        // Mostrar modal
        modalEditWog.style.display = 'block';
        
    } catch (error) {
        console.error('Error al editar WOG:', error);
        mostrarToast('Error al cargar datos del WOG', true);
    }
}

// Guardar cambios en un WOG editado
async function guardarWogEditado(event) {
    event.preventDefault();
    
    // Cambiar botón a estado de carga
    const submitBtn = formEditWog.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }
    
    try {
        // Recopilar datos del formulario
        const wogId = editWogIdInput.value;
        
        if (!wogId) {
            throw new Error('No se encontró el ID del WOG a editar');
        }
        
        // Recopilar datos básicos
        const fecha = editFechaInput.value;
        const sede = editSedeSelect.value;
        const subsede = editSubsedeInput.value.trim();
        const notas = editNotasInput.value.trim();
        
        if (!fecha) {
            mostrarToast('Debes seleccionar una fecha', true);
            return;
        }
        
        if (!sede) {
            mostrarToast('Debes seleccionar una sede', true);
            return;
        }
        
        // Obtener asadores
        const asadores = [];
        editAsadoresContainer.querySelectorAll('.asador-select').forEach(select => {
            if (select.value) {
                asadores.push(select.value);
            }
        });
        
        if (asadores.length === 0) {
            mostrarToast('Debes seleccionar al menos un asador', true);
            return;
        }
        
        // Obtener asistentes
        const asistentes = [];
        editAsistentesLista.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            asistentes.push(checkbox.value);
        });
        
        if (asistentes.length === 0) {
            mostrarToast('Debes seleccionar al menos un asistente', true);
            return;
        }
        
        // Asegurar que la sede, los asadores están en los asistentes
        if (!asistentes.includes(sede)) {
            asistentes.push(sede);
        }
        
        asadores.forEach(asador => {
            if (!asistentes.includes(asador)) {
                asistentes.push(asador);
            }
        });
        
        // Preparar objeto WOG actualizado
        const wogData = {
            fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
            sede,
            subsede,
            asadores,
            asistentes,
            notas,
            fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Manejar compras (normal o compartidas)
        if (editComprasSelect.value === 'compartido') {
            // Obtener participantes seleccionados para compras compartidas
            const comprasCompartidas = [];
            editComprasParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
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
        } else if (editComprasSelect.value) {
            wogData.compras = editComprasSelect.value;
            
            // Asegurar que esté en la lista de asistentes
            if (!asistentes.includes(editComprasSelect.value)) {
                asistentes.push(editComprasSelect.value);
            }
        } else {
            mostrarToast('Debes seleccionar quién hizo las compras', true);
            return;
        }
        
        // 1. Restar puntuaciones del WOG original
        if (typeof window.restarPuntuaciones === 'function') {
            await window.restarPuntuaciones(originalWogData);
        }
        
        // 2. Actualizar documento del WOG
        await db.collection(COLECCION_WOGS).doc(wogId).update(wogData);
        
        // 3. Asignar nuevas puntuaciones
        if (typeof window.actualizarPuntuaciones === 'function') {
            await window.actualizarPuntuaciones(wogData);
        }
        
        // Mostrar mensaje de éxito
        mostrarToast('WOG actualizado correctamente');
        
        // Cerrar modal
        modalEditWog.style.display = 'none';
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al guardar WOG editado:', error);
        mostrarToast('Error al guardar WOG: ' + error.message, true);
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
}

// Exportar funciones necesarias al ámbito global
window.initWogEditModule = initWogEditModule;
window.editarWog = editarWog;
window.agregarEditSelectorAsador = agregarEditSelectorAsador;