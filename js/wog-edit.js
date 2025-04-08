// Módulo para la edición de WOGs y redistribución de puntos

// Referencias a elementos del DOM
const modalEditWog = document.getElementById('modal-edit-wog');
const formEditWog = document.getElementById('edit-wog-form');
const editWogIdInput = document.getElementById('edit-wog-id');
const editFechaInput = document.getElementById('edit-fecha');
const editSedeSelect = document.getElementById('edit-sede');
const editSubsedeInput = document.getElementById('edit-subsede');
const editCompradoresContainer = document.getElementById('edit-compradores-container');
const editAsadoresContainer = document.getElementById('edit-asadores-container');
const editAsistentesLista = document.getElementById('edit-asistentes-lista');
const editNotasInput = document.getElementById('edit-notas');
const btnEditAddAsador = document.getElementById('edit-add-asador');
const btnEditAddComprador = document.getElementById('edit-add-comprador');
const btnCancelarEdit = document.getElementById('btn-cancelar-edit');

// Variable para almacenar los datos originales del WOG
let originalWogData = null;

// Inicializar módulo
function initWogEditModule() {
    console.log('Inicializando módulo de edición de WOGs...');
    
    // Configurar eventos
    formEditWog.addEventListener('submit', guardarWogEditado);
    btnEditAddAsador.addEventListener('click', agregarEditSelectorAsador);
    btnEditAddComprador.addEventListener('click', agregarEditSelectorComprador);
    btnCancelarEdit.addEventListener('click', () => {
        modalEditWog.style.display = 'none';
    });
    
    console.log('Módulo de edición de WOGs inicializado correctamente');
}

// Agregar un selector de asador adicional en el formulario de edición
function agregarEditSelectorAsador() {
    // Crear contenedor para el nuevo selector
    const asadorItem = document.createElement('div');
    asadorItem.className = 'asador-item';
    
    // Clonar el primer selector de asador
    const templateSelect = editAsadoresContainer.querySelector('.asador-select');
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

// Agregar un selector de comprador adicional en el formulario de edición
function agregarEditSelectorComprador() {
    // Crear contenedor para el nuevo selector
    const compradorItem = document.createElement('div');
    compradorItem.className = 'comprador-item';
    
    // Clonar el primer selector de comprador
    const templateSelect = editCompradoresContainer.querySelector('.comprador-select');
    const newSelect = templateSelect.cloneNode(true);
    newSelect.className = 'comprador-select';
    newSelect.value = ''; // Resetear valor
    
    // Crear botón para eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-circle btn-small';
    btnEliminar.innerHTML = '<i class="fas fa-times"></i>';
    btnEliminar.style.marginLeft = '10px';
    btnEliminar.addEventListener('click', () => {
        compradorItem.remove();
    });
    
    // Añadir elementos al contenedor
    compradorItem.appendChild(newSelect);
    compradorItem.appendChild(btnEliminar);
    
    // Añadir al contenedor principal
    editCompradoresContainer.appendChild(compradorItem);
}

// Cargar datos para el formulario de edición de WOG
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
        
        // Limpiar y llenar selector de asador
        editAsadoresContainer.innerHTML = '';
        
        const asadorItem = document.createElement('div');
        asadorItem.className = 'asador-item';
        
        const asadorSelect = document.createElement('select');
        asadorSelect.className = 'asador-select';
        asadorSelect.required = true;
        asadorSelect.innerHTML = '<option value="">Seleccionar asador</option>';
        
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            asadorSelect.appendChild(option);
        });
        
        asadorItem.appendChild(asadorSelect);
        editAsadoresContainer.appendChild(asadorItem);
        
        // Limpiar y llenar selector de comprador
        editCompradoresContainer.innerHTML = '';
        
        const compradorItem = document.createElement('div');
        compradorItem.className = 'comprador-item';
        
        const compradorSelect = document.createElement('select');
        compradorSelect.className = 'comprador-select';
        compradorSelect.required = true;
        compradorSelect.innerHTML = '<option value="">Seleccionar comprador</option>';
        
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            compradorSelect.appendChild(option);
        });
        
        compradorItem.appendChild(compradorSelect);
        editCompradoresContainer.appendChild(compradorItem);
        
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
        
    } catch (error) {
        console.error('Error al cargar formulario de edición de WOG:', error);
        mostrarToast('Error al cargar participantes', true);
    }
}

// Llenar el formulario con los datos del WOG a editar
function llenarFormularioEdit(wogData) {
    // Establecer ID
    editWogIdInput.value = wogData.id;
    
    // Establecer fecha (convertir de Timestamp a formato de input date)
    const fecha = wogData.fecha.toDate ? wogData.fecha.toDate() : new Date(wogData.fecha);
    editFechaInput.value = formatearFechaInput(fecha);
    
    // Establecer sede y subsede
    editSedeSelect.value = wogData.sede || '';
    editSubsedeInput.value = wogData.subsede || '';
    
    // Establecer compradores (pueden ser múltiples)
    if (wogData.compradores && wogData.compradores.length > 0) {
        // Limpiar los compradores existentes excepto el primero
        while (editCompradoresContainer.children.length > 1) {
            editCompradoresContainer.removeChild(editCompradoresContainer.lastChild);
        }
        
        // Establecer el primer comprador
        const primerCompradorSelect = editCompradoresContainer.querySelector('.comprador-select');
        primerCompradorSelect.value = wogData.compradores[0] || '';
        
        // Agregar selectores para los compradores adicionales
        for (let i = 1; i < wogData.compradores.length; i++) {
            // Crear nuevo selector
            agregarEditSelectorComprador();
            
            // Establecer el valor
            const nuevoCompradorSelect = editCompradoresContainer.querySelectorAll('.comprador-select')[i];
            if (nuevoCompradorSelect) nuevoCompradorSelect.value = wogData.compradores[i];
        }
    } else if (wogData.compras) {
        // Compatibilidad con versión anterior (compras individuales)
        const primerCompradorSelect = editCompradoresContainer.querySelector('.comprador-select');
        if (primerCompradorSelect) primerCompradorSelect.value = wogData.compras || '';
    } else if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
        // Compatibilidad con versión anterior (compras compartidas)
        // Limpiar los compradores existentes excepto el primero
        while (editCompradoresContainer.children.length > 1) {
            editCompradoresContainer.removeChild(editCompradoresContainer.lastChild);
        }
        
        // Establecer el primer comprador
        const primerCompradorSelect = editCompradoresContainer.querySelector('.comprador-select');
        primerCompradorSelect.value = wogData.comprasCompartidas[0] || '';
        
        // Agregar selectores para los compradores adicionales
        for (let i = 1; i < wogData.comprasCompartidas.length; i++) {
            // Crear nuevo selector
            agregarEditSelectorComprador();
            
            // Establecer el valor
            const nuevoCompradorSelect = editCompradoresContainer.querySelectorAll('.comprador-select')[i];
            if (nuevoCompradorSelect) nuevoCompradorSelect.value = wogData.comprasCompartidas[i];
        }
    } else {
        // Si no hay compradores, simplemente limpiar el selector
        const primerCompradorSelect = editCompradoresContainer.querySelector('.comprador-select');
        if (primerCompradorSelect) primerCompradorSelect.value = '';
    }
    
    // Establecer asadores (pueden ser múltiples)
    if (wogData.asadores && wogData.asadores.length > 0) {
        // Limpiar los asadores existentes excepto el primero
        while (editAsadoresContainer.children.length > 1) {
            editAsadoresContainer.removeChild(editAsadoresContainer.lastChild);
        }
        
        // Establecer el primer asador
        const primerAsadorSelect = editAsadoresContainer.querySelector('.asador-select');
        primerAsadorSelect.value = wogData.asadores[0] || '';
        
        // Agregar selectores para los asadores adicionales
        for (let i = 1; i < wogData.asadores.length; i++) {
            // Crear nuevo selector
            agregarEditSelectorAsador();
            
            // Establecer el valor
            const nuevoAsadorSelect = editAsadoresContainer.querySelectorAll('.asador-select')[i];
            if (nuevoAsadorSelect) nuevoAsadorSelect.value = wogData.asadores[i];
        }
    } else {
        // Si no hay asadores, simplemente limpiar el selector
        const primerAsadorSelect = editAsadoresContainer.querySelector('.asador-select');
        if (primerAsadorSelect) primerAsadorSelect.value = '';
    }
    
    // Establecer asistentes
    if (wogData.asistentes && wogData.asistentes.length > 0) {
        // Desmarcar todos primero
        editAsistentesLista.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Marcar los seleccionados
        wogData.asistentes.forEach(id => {
            const checkbox = document.getElementById(`edit-asistente-${id}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Establecer notas
    editNotasInput.value = wogData.notas || '';
}

// Abrir modal para editar un WOG existente
async function editarWog(wogId) {
    try {
        // Mostrar modal
        modalEditWog.style.display = 'block';
        
        // Mostrar loader
        const submitBtn = formEditWog.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        }
        
        // Cargar datos para el formulario
        await cargarFormularioEditWog();
        
        // Obtener datos del WOG a editar
        const doc = await db.collection(COLECCION_WOGS).doc(wogId).get();
        
        if (!doc.exists) {
            mostrarToast('No se encontró el WOG a editar', true);
            modalEditWog.style.display = 'none';
            return;
        }
        
        // Guardar los datos originales para compararlos después
        originalWogData = {
            id: doc.id,
            ...doc.data()
        };
        
        // Llenar el formulario con los datos
        llenarFormularioEdit(originalWogData);
        
        // Restaurar botón
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Guardar Cambios';
        }
        
    } catch (error) {
        console.error('Error al cargar WOG para editar:', error);
        mostrarToast('Error al cargar datos del WOG', true);
        modalEditWog.style.display = 'none';
    }
}

// Guardar los cambios de un WOG editado
async function guardarWogEditado(event) {
    event.preventDefault();
    
    try {
        // ID del WOG
        const wogId = editWogIdInput.value.trim();
        if (!wogId) {
            mostrarToast('Error: ID de WOG no válido', true);
            return;
        }
        
        // Recopilar datos del formulario
        const fecha = editFechaInput.value;
        const sede = editSedeSelect.value;
        const subsede = editSubsedeInput.value.trim();
        const notas = editNotasInput.value.trim();
        
        // Obtener asadores
        const asadores = [];
        editAsadoresContainer.querySelectorAll('.asador-select').forEach(select => {
            if (select.value) {
                asadores.push(select.value);
            }
        });
        
        // Obtener compradores
        const compradores = [];
        editCompradoresContainer.querySelectorAll('.comprador-select').forEach(select => {
            if (select.value) {
                compradores.push(select.value);
            }
        });
        
        // Obtener asistentes
        const asistentes = [];
        editAsistentesLista.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
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
        
        if (compradores.length === 0) {
            mostrarToast('Debes seleccionar al menos un comprador', true);
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
        
        // Validar compradores estén incluidos en los asistentes
        compradores.forEach(comprador => {
            if (!asistentes.includes(comprador)) {
                asistentes.push(comprador);
            }
        });
        
        // Preparar objeto WOG actualizado
        const wogData = {
            fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
            sede,
            subsede,
            asadores,
            compradores,
            asistentes,
            notas,
            fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Cambiar botón a estado de carga
        const submitBtn = formEditWog.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Iniciar una transacción para asegurar la consistencia
        await db.runTransaction(async transaction => {
            // Revertir puntos del WOG original
            await revertirPuntuaciones(originalWogData, transaction);
            
            // Asignar nuevos puntos
            await asignarPuntuaciones(wogData, transaction);
            
            // Actualizar documento del WOG
            const wogRef = db.collection(COLECCION_WOGS).doc(wogId);
            transaction.update(wogRef, wogData);
        });
        
        // Mostrar mensaje de éxito
        mostrarToast('WOG actualizado correctamente');
        
        // Cerrar modal
        modalEditWog.style.display = 'none';
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
    } catch (error) {
        console.error('Error al guardar WOG editado:', error);
        mostrarToast('Error al guardar cambios: ' + error.message, true);
    } finally {
        // Restaurar botón
        const submitBtn = formEditWog.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar Cambios';
    }
}

// Revertir las puntuaciones asignadas por un WOG
async function revertirPuntuaciones(wogData, transaction) {
    try {
        // 1. Revertir puntos por sede (1 punto)
        if (wogData.sede) {
            const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.sede);
            const sedeDoc = await transaction.get(sedeRef);
            
            if (sedeDoc.exists) {
                const puntosSede = sedeDoc.data().puntos_sede || 0;
                transaction.update(sedeRef, {
                    puntos_sede: Math.max(0, puntosSede - 1)
                });
            }
        }
        
        // 2. Revertir puntos por asador (1 punto dividido entre todos los asadores)
        if (wogData.asadores && wogData.asadores.length > 0) {
            const puntoPorAsador = 1 / wogData.asadores.length;
            
            for (const asadorId of wogData.asadores) {
                const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                const asadorDoc = await transaction.get(asadorRef);
                
                if (asadorDoc.exists) {
                    const puntosAsador = asadorDoc.data().puntos_asador || 0;
                    transaction.update(asadorRef, {
                        puntos_asador: Math.max(0, puntosAsador - puntoPorAsador)
                    });
                }
            }
        }
        
        // 3. Revertir puntos por compras
        // 3.1 Si hay compradores (nuevo formato)
        if (wogData.compradores && wogData.compradores.length > 0) {
            const puntoPorComprador = 1 / wogData.compradores.length;
            
            for (const compradorId of wogData.compradores) {
                const compradorRef = db.collection(COLECCION_PARTICIPANTES).doc(compradorId);
                const compradorDoc = await transaction.get(compradorRef);
                
                if (compradorDoc.exists) {
                    const puntosCompras = compradorDoc.data().puntos_compras || 0;
                    transaction.update(compradorRef, {
                        puntos_compras: Math.max(0, puntosCompras - puntoPorComprador)
                    });
                }
            }
        }
        // 3.2 Si había compras compartidas (formato anterior)
        else if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
            const puntoPorCompra = 1 / wogData.comprasCompartidas.length;
            
            for (const compraId of wogData.comprasCompartidas) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                const compraDoc = await transaction.get(compraRef);
                
                if (compraDoc.exists) {
                    const puntosCompras = compraDoc.data().puntos_compras || 0;
                    transaction.update(compraRef, {
                        puntos_compras: Math.max(0, puntosCompras - puntoPorCompra)
                    });
                }
            }
        }
        // 3.3 Si había compras individuales (formato anterior)
        else if (wogData.compras) {
            const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras);
            const compraDoc = await transaction.get(compraRef);
            
            if (compraDoc.exists) {
                const puntosCompras = compraDoc.data().puntos_compras || 0;
                transaction.update(compraRef, {
                    puntos_compras: Math.max(0, puntosCompras - 1)
                });
            }
        }
    } catch (error) {
        console.error('Error al revertir puntuaciones:', error);
        throw error;
    }
}

// Asignar nuevas puntuaciones para un WOG
async function asignarPuntuaciones(wogData, transaction) {
    try {
        // 1. Actualizar puntos por sede (1 punto)
        if (wogData.sede) {
            const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.sede);
            const sedeDoc = await transaction.get(sedeRef);
            
            if (sedeDoc.exists) {
                const puntosSede = sedeDoc.data().puntos_sede || 0;
                transaction.update(sedeRef, {
                    puntos_sede: puntosSede + 1
                });
            }
        }
        
        // 2. Actualizar puntos por asador (1 punto dividido entre todos los asadores)
        if (wogData.asadores && wogData.asadores.length > 0) {
            const puntoPorAsador = 1 / wogData.asadores.length;
            
            for (const asadorId of wogData.asadores) {
                const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                const asadorDoc = await transaction.get(asadorRef);
                
                if (asadorDoc.exists) {
                    const puntosAsador = asadorDoc.data().puntos_asador || 0;
                    transaction.update(asadorRef, {
                        puntos_asador: puntosAsador + puntoPorAsador
                    });
                }
            }
        }
        
        // 3. Actualizar puntos por compras (1 punto dividido entre todos los compradores)
        if (wogData.compradores && wogData.compradores.length > 0) {
            const puntoPorComprador = 1 / wogData.compradores.length;
            
            for (const compradorId of wogData.compradores) {
                const compradorRef = db.collection(COLECCION_PARTICIPANTES).doc(compradorId);
                const compradorDoc = await transaction.get(compradorRef);
                
                if (compradorDoc.exists) {
                    const puntosCompras = compradorDoc.data().puntos_compras || 0;
                    transaction.update(compradorRef, {
                        puntos_compras: puntosCompras + puntoPorComprador
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error al asignar puntuaciones:', error);
        throw error;
    }
}

// Exportar funciones necesarias al alcance global
window.editarWog = editarWog;
window.agregarEditSelectorAsador = agregarEditSelectorAsador;
window.agregarEditSelectorComprador = agregarEditSelectorComprador;