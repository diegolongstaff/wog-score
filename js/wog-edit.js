// Módulo para la edición de WOGs y redistribución de puntos

// Referencias a elementos del DOM
const modalEditWog = document.getElementById('modal-edit-wog');
const formEditWog = document.getElementById('edit-wog-form');
const editWogIdInput = document.getElementById('edit-wog-id');
const editFechaInput = document.getElementById('edit-fecha');
const editSedeSelect = document.getElementById('edit-sede');
const editSubsedeInput = document.getElementById('edit-subsede');
const editComprasSelect = document.getElementById('edit-compras');
const editComprasCompartidasDiv = document.getElementById('edit-compras-compartidas');
const editComprasParticipantesDiv = document.getElementById('edit-compras-participantes');
const editAsadoresContainer = document.getElementById('edit-asadores-container');
const editAsistentesLista = document.getElementById('edit-asistentes-lista');
const editNotasInput = document.getElementById('edit-notas');
const btnEditAddAsador = document.getElementById('edit-add-asador');
const btnCancelarEdit = document.getElementById('btn-cancelar-edit');

// Variable para almacenar los datos originales del WOG
let originalWogData = null;

// Inicializar módulo
function initWogEditModule() {
    console.log('Inicializando módulo de edición de WOGs...');
    
    // Configurar eventos
    formEditWog.addEventListener('submit', guardarWogEditado);
    editComprasSelect.addEventListener('change', toggleEditComprasCompartidas);
    btnEditAddAsador.addEventListener('click', agregarEditSelectorAsador);
    btnCancelarEdit.addEventListener('click', () => {
        modalEditWog.style.display = 'none';
    });
    
    console.log('Módulo de edición de WOGs inicializado correctamente');
}

// Mostrar/ocultar sección de compras compartidas en el formulario de edición
function toggleEditComprasCompartidas() {
    if (editComprasSelect.value === 'compartido') {
        editComprasCompartidasDiv.style.display = 'block';
    } else {
        editComprasCompartidasDiv.style.display = 'none';
    }
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
        
        // Llenar selector de compras
        editComprasSelect.innerHTML = '<option value="">Seleccionar responsable</option>';
        editComprasSelect.innerHTML += '<option value="compartido">Compartido</option>';
        participantes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            editComprasSelect.appendChild(option);
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
    
    // Establecer compras (individual o compartida)
    if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
        editComprasSelect.value = 'compartido';
        editComprasCompartidasDiv.style.display = 'block';
        
        // Marcar las compras compartidas
        wogData.comprasCompartidas.forEach(id => {
            const checkbox = document.getElementById(`edit-compra-compartida-${id}`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (wogData.compras) {
        editComprasSelect.value = wogData.compras;
        editComprasCompartidasDiv.style.display = 'none';
    } else {
        editComprasSelect.value = '';
        editComprasCompartidasDiv.style.display = 'none';
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
        // Mostrar loader
        modalEditWog.style.display = 'block';
        formEditWog.innerHTML = `
            <div class="loader">
                <div class="loader-circle"></div>
            </div>
        `;
        
        // Cargar y mostrar el formulario de edición
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
        
    } catch (error) {
        console.error('Error al cargar WOG para edición:', error);
        mostrarToast('Error al cargar datos del WOG', true);
        modalEditWog.style.display = 'none';
    }
}

// Guardar un WOG editado
async function guardarWogEditado(event) {
    event.preventDefault();
    
    try {
        if (!originalWogData) {
            mostrarToast('Error al editar: no se encontraron los datos originales', true);
            return;
        }
        
        // Recopilar datos del formulario
        const wogId = editWogIdInput.value;
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
            
            // Si había un compras individual, eliminarlo
            if (originalWogData.compras) {
                wogData.compras = firebase.firestore.FieldValue.delete();
            }
        } else if (editComprasSelect.value) {
            wogData.compras = editComprasSelect.value;
            
            // Asegurar que esté en la lista de asistentes
            if (!asistentes.includes(editComprasSelect.value)) {
                asistentes.push(editComprasSelect.value);
            }
            
            // Si había compras compartidas, eliminarlas
            if (originalWogData.comprasCompartidas) {
                wogData.comprasCompartidas = firebase.firestore.FieldValue.delete();
            }
        } else {
            mostrarToast('Debes seleccionar quién hizo las compras', true);
            return;
        }
        
        // Cambiar botón a estado de carga
        const submitBtn = formEditWog.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Iniciar transacción para redistribuir puntos
        await redistribuirPuntos(wogId, originalWogData, wogData);
        
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
        submitBtn.textContent = 'Guardar Cambios';
    }
}

// Redistribuir puntos al editar un WOG
async function redistribuirPuntos(wogId, datosOriginales, datosNuevos) {
    try {
        // Iniciar transacción para asegurar consistencia
        await db.runTransaction(async transaction => {
            // Referencia al documento del WOG
            const wogRef = db.collection(COLECCION_WOGS).doc(wogId);
            
            // Actualizar documento del WOG
            transaction.update(wogRef, datosNuevos);
            
            // 1. Redistribuir puntos de sede
            if (datosOriginales.sede !== datosNuevos.sede) {
                // Restar punto a la sede original
                if (datosOriginales.sede) {
                    const sedeOriginalRef = db.collection(COLECCION_PARTICIPANTES).doc(datosOriginales.sede);
                    const sedeOriginalDoc = await transaction.get(sedeOriginalRef);
                    
                    if (sedeOriginalDoc.exists) {
                        const puntosSede = sedeOriginalDoc.data().puntos_sede || 0;
                        transaction.update(sedeOriginalRef, {
                            puntos_sede: Math.max(0, puntosSede - 1)
                        });
                    }
                }
                
                // Sumar punto a la nueva sede
                const nuevaSedeRef = db.collection(COLECCION_PARTICIPANTES).doc(datosNuevos.sede);
                const nuevaSedeDoc = await transaction.get(nuevaSedeRef);
                
                if (nuevaSedeDoc.exists) {
                    const puntosSede = nuevaSedeDoc.data().puntos_sede || 0;
                    transaction.update(nuevaSedeRef, {
                        puntos_sede: puntosSede + 1
                    });
                }
            }
            
            // 2. Redistribuir puntos de asador
            const asadoresOriginales = datosOriginales.asadores || [];
            const asadoresNuevos = datosNuevos.asadores || [];
            
            // Verificar si hubo cambios en los asadores
            const cambioAsadores = asadoresOriginales.length !== asadoresNuevos.length ||
                                  !asadoresOriginales.every(id => asadoresNuevos.includes(id));
            
            if (cambioAsadores) {
                // Restar puntos a los asadores originales
                if (asadoresOriginales.length > 0) {
                    const puntoPorAsadorOriginal = 1 / asadoresOriginales.length;
                    
                    for (const asadorId of asadoresOriginales) {
                        const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                        const asadorDoc = await transaction.get(asadorRef);
                        
                        if (asadorDoc.exists) {
                            const puntosAsador = asadorDoc.data().puntos_asador || 0;
                            transaction.update(asadorRef, {
                                puntos_asador: Math.max(0, puntosAsador - puntoPorAsadorOriginal)
                            });
                        }
                    }
                }
                
                // Sumar puntos a los nuevos asadores
                if (asadoresNuevos.length > 0) {
                    const puntoPorAsadorNuevo = 1 / asadoresNuevos.length;
                    
                    for (const asadorId of asadoresNuevos) {
                        const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                        const asadorDoc = await transaction.get(asadorRef);
                        
                        if (asadorDoc.exists) {
                            const puntosAsador = asadorDoc.data().puntos_asador || 0;
                            transaction.update(asadorRef, {
                                puntos_asador: puntosAsador + puntoPorAsadorNuevo
                            });
                        }
                    }
                }
            }
            
            // 3. Redistribuir puntos de compras
            const comprasOriginales = datosOriginales.compras;
            const comprasNuevas = datosNuevos.compras;
            const comprasCompartidasOriginales = datosOriginales.comprasCompartidas || [];
            const comprasCompartidasNuevas = datosNuevos.comprasCompartidas || [];
            
            // Caso A: Antes era compra individual, ahora también es individual pero diferente persona
            if (comprasOriginales && comprasNuevas && comprasOriginales !== comprasNuevas) {
                // Restar punto al responsable original
                const compraOriginalRef = db.collection(COLECCION_PARTICIPANTES).doc(comprasOriginales);
                const compraOriginalDoc = await transaction.get(compraOriginalRef);
                
                if (compraOriginalDoc.exists) {
                    const puntosCompras = compraOriginalDoc.data().puntos_compras || 0;
                    transaction.update(compraOriginalRef, {
                        puntos_compras: Math.max(0, puntosCompras - 1)
                    });
                }
                
                // Sumar punto al nuevo responsable
                const compraNuevaRef = db.collection(COLECCION_PARTICIPANTES).doc(comprasNuevas);
                const compraNuevaDoc = await transaction.get(compraNuevaRef);
                
                if (compraNuevaDoc.exists) {
                    const puntosCompras = compraNuevaDoc.data().puntos_compras || 0;
                    transaction.update(compraNuevaRef, {
                        puntos_compras: puntosCompras + 1
                    });
                }
            }
            
            // Caso B: Antes era compra individual, ahora es compartida
            else if (comprasOriginales && comprasCompartidasNuevas.length > 0) {
                // Restar punto al responsable original
                const compraOriginalRef = db.collection(COLECCION_PARTICIPANTES).doc(comprasOriginales);
                const compraOriginalDoc = await transaction.get(compraOriginalRef);
                
                if (compraOriginalDoc.exists) {
                    const puntosCompras = compraOriginalDoc.data().puntos_compras || 0;
                    transaction.update(compraOriginalRef, {
                        puntos_compras: Math.max(0, puntosCompras - 1)
                    });
                }
                
                // Sumar puntos compartidos a los nuevos responsables
                const puntoPorCompra = 1 / comprasCompartidasNuevas.length;
                
                for (const compraId of comprasCompartidasNuevas) {
                    const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                    const compraDoc = await transaction.get(compraRef);
                    
                    if (compraDoc.exists) {
                        const puntosCompras = compraDoc.data().puntos_compras || 0;
                        transaction.update(compraRef, {
                            puntos_compras: puntosCompras + puntoPorCompra
                        });
                    }
                }
            }
            
            // Caso C: Antes era compra compartida, ahora es individual
            else if (comprasCompartidasOriginales.length > 0 && comprasNuevas) {
                // Restar puntos a los responsables originales
                const puntoPorCompraOriginal = 1 / comprasCompartidasOriginales.length;
                
                for (const compraId of comprasCompartidasOriginales) {
                    const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                    const compraDoc = await transaction.get(compraRef);
                    
                    if (compraDoc.exists) {
                        const puntosCompras = compraDoc.data().puntos_compras || 0;
                        transaction.update(compraRef, {
                            puntos_compras: Math.max(0, puntosCompras - puntoPorCompraOriginal)
                        });
                    }
                }
                
                // Sumar punto al nuevo responsable individual
                const compraNuevaRef = db.collection(COLECCION_PARTICIPANTES).doc(comprasNuevas);
                const compraNuevaDoc = await transaction.get(compraNuevaRef);
                
                if (compraNuevaDoc.exists) {
                    const puntosCompras = compraNuevaDoc.data().puntos_compras || 0;
                    transaction.update(compraNuevaRef, {
                        puntos_compras: puntosCompras + 1
                    });
                }
            }
            
            // Caso D: Antes era compra compartida, ahora también es compartida pero cambiaron las personas
            else if (comprasCompartidasOriginales.length > 0 && comprasCompartidasNuevas.length > 0) {
                // Verificar si hay cambios en las compras compartidas
                const cambioComprasCompartidas = comprasCompartidasOriginales.length !== comprasCompartidasNuevas.length ||
                                               !comprasCompartidasOriginales.every(id => comprasCompartidasNuevas.includes(id));
                
                if (cambioComprasCompartidas) {
                    // Restar puntos a los responsables originales
                    const puntoPorCompraOriginal = 1 / comprasCompartidasOriginales.length;
                    
                    for (const compraId of comprasCompartidasOriginales) {
                        const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                        const compraDoc = await transaction.get(compraRef);
                        
                        if (compraDoc.exists) {
                            const puntosCompras = compraDoc.data().puntos_compras || 0;
                            transaction.update(compraRef, {
                                puntos_compras: Math.max(0, puntosCompras - puntoPorCompraOriginal)
                            });
                        }
                    }
                    
                    // Sumar puntos a los nuevos responsables
                    const puntoPorCompraNueva = 1 / comprasCompartidasNuevas.length;
                    
                    for (const compraId of comprasCompartidasNuevas) {
                        const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                        const compraDoc = await transaction.get(compraRef);
                        
                        if (compraDoc.exists) {
                            const puntosCompras = compraDoc.data().puntos_compras || 0;
                            transaction.update(compraRef, {
                                puntos_compras: puntosCompras + puntoPorCompraNueva
                            });
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error en la transacción de redistribución de puntos:', error);
        throw error; // Propagar el error para manejarlo en el llamador
    }
}

// Exportar funciones necesarias
window.initWogEditModule = initWogEditModule;
window.editarWog = editarWog;