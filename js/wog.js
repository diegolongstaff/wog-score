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
        
        // Preparar objeto WOG
const wogData = {
    fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
    sede,
    subsede,
    asadores,
    asistentes,
    notas,
    fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
};


        
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
        } else if (comprasSelect.value) {
            wogData.compras = comprasSelect.value;
            
            // Asegurar que esté en la lista de asistentes
            if (!asistentes.includes(comprasSelect.value)) {
                asistentes.push(comprasSelect.value);
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
        
        // Guardar en Firestore
        await db.collection(COLECCION_WOGS).add(wogData);
        
        // Actualizar puntos de los participantes
        await actualizarPuntuaciones(wogData);
        
        // Mostrar mensaje de éxito
        mostrarToast('WOG registrado correctamente');
       
        // Limpiar vista previa de foto
previewFotoWog.innerHTML = '';
        
        // Resetear formulario
        formNuevoWog.reset();
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
