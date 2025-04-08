// Módulo para gestionar los WOGs

// Referencias a elementos del DOM
let formNuevoWog;
let fechaInput;
let sedeSelect;
let subsedeInput;
let comprasSelect;
let comprasCompartidasDiv;
let comprasParticipantesDiv;
let asadoresContainer;
let asistentesLista;
let notasInput;
let btnAddAsador;

// Función para formatear fecha para un input date (implementada localmente)
function formatearFechaInput(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Inicializar módulo
function initWogModule() {
    console.log('Inicializando módulo de WOGs...');
    
    // Obtener referencias a los elementos DOM
    formNuevoWog = document.getElementById('nuevo-wog-form');
    fechaInput = document.getElementById('fecha');
    sedeSelect = document.getElementById('sede');
    subsedeInput = document.getElementById('subsede');
    comprasSelect = document.getElementById('compras');
    comprasCompartidasDiv = document.getElementById('compras-compartidas');
    comprasParticipantesDiv = document.getElementById('compras-participantes');
    asadoresContainer = document.getElementById('asadores-container');
    asistentesLista = document.getElementById('asistentes-lista');
    notasInput = document.getElementById('notas');
    btnAddAsador = document.getElementById('add-asador');
    
    // Verificar que los elementos existen antes de configurar eventos
    if (formNuevoWog) {
        // Establecer fecha actual por defecto
        if (fechaInput) {
            const hoy = new Date();
            fechaInput.value = formatearFechaInput(hoy);
        }
        
        // Configurar eventos
        formNuevoWog.addEventListener('submit', guardarWog);
        
        if (comprasSelect) {
            comprasSelect.addEventListener('change', toggleComprasCompartidas);
        }
        
        if (btnAddAsador) {
            btnAddAsador.addEventListener('click', agregarSelectorAsador);
        }
    } else {
        console.warn('Formulario de nuevo WOG no encontrado');
    }
    
    // Escuchar eventos de cambio de pestaña
    document.addEventListener('tabChanged', function(event) {
        if (event.detail && event.detail.tabId === 'tab-nuevo') {
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
        // Verificar que los elementos del DOM existen
        if (!sedeSelect || !comprasSelect || !asadoresContainer || !asistentesLista || !comprasParticipantesDiv) {
            console.warn('Elementos del formulario WOG no encontrados');
            return;
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
        if (asadorSelect) {
            asadorSelect.innerHTML = '<option value="">Seleccionar asador</option>';
            participantes.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.nombre;
                asadorSelect.appendChild(option);
            });
        }
        
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
        if (notasInput) {
            notasInput.value = '';
        }
        
    } catch (error) {
        console.error('Error al cargar formulario de WOG:', error);
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Error al cargar participantes', true);
        }
    }
}

// Mostrar/ocultar sección de compras compartidas
function toggleComprasCompartidas() {
    if (!comprasSelect || !comprasCompartidasDiv) return;
    
    if (comprasSelect.value === 'compartido') {
        comprasCompartidasDiv.style.display = 'block';
    } else {
        comprasCompartidasDiv.style.display = 'none';
    }
}

// Agregar un selector de asador adicional
function agregarSelectorAsador() {
    if (!asadoresContainer) return;
    
    // Crear contenedor para el nuevo selector
    const asadorItem = document.createElement('div');
    asadorItem.className = 'asador-item';
    
    // Clonar el primer selector de asador
    const templateSelect = asadoresContainer.querySelector('.asador-select');
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
    asadoresContainer.appendChild(asadorItem);
}

// Guardar un nuevo WOG
async function guardarWog(event) {
    event.preventDefault();
    
    try {
        // Verificar existencia de elementos
        if (!fechaInput || !sedeSelect || !subsedeInput || !notasInput || !asadoresContainer || !asistentesLista) {
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast('Error: Formulario incompleto', true);
            }
            return;
        }
        
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
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast('Debes seleccionar una fecha', true);
            }
            return;
        }
        
        if (!sede) {
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast('Debes seleccionar una sede', true);
            }
            return;
        }
        
        if (asadores.length === 0) {
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast('Debes seleccionar al menos un asador', true);
            }
            return;
        }
        
        if (asistentes.length === 0) {
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast('Debes seleccionar al menos un asistente', true);
            }
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
        if (comprasSelect && comprasSelect.value === 'compartido') {
            // Obtener participantes seleccionados para compras compartidas
            const comprasCompartidas = [];
            if (comprasParticipantesDiv) {
                comprasParticipantesDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                    comprasCompartidas.push(checkbox.value);
                    
                    // Asegurar que estén en la lista de asistentes
                    if (!asistentes.includes(checkbox.value)) {
                        asistentes.push(checkbox.value);
                    }
                });
            }
            
            if (comprasCompartidas.length === 0) {
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast('Debes seleccionar al menos un participante para compras compartidas', true);
                }
                return;
            }
            
            wogData.comprasCompartidas = comprasCompartidas;
        } else if (comprasSelect && comprasSelect.value) {
            wogData.compras = comprasSelect.value;
            
            // Asegurar que esté en la lista de asistentes
            if (!asistentes.includes(comprasSelect.value)) {
                asistentes.push(comprasSelect.value);
            }
        } else {
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast('Debes seleccionar quién hizo las compras', true);
            }
            return;
        }
        
        // Cambiar botón a estado de carga
        const submitBtn = formNuevoWog.querySelector('button[type="submit"]');
        if (submitBtn) {
            const btnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        // Guardar en Firestore
        await db.collection(COLECCION_WOGS).add(wogData);
        
        // Actualizar puntos de los participantes usando el módulo de puntuación
        if (typeof window.actualizarPuntuaciones === 'function') {
            await window.actualizarPuntuaciones(wogData);
        } else {
            console.warn('Función actualizarPuntuaciones no disponible');
        }
        
        // Mostrar mensaje de éxito
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('WOG registrado correctamente');
        }
        
        // Resetear formulario
        formNuevoWog.reset();
        if (fechaInput) {
            fechaInput.value = formatearFechaInput(new Date());
        }
        if (comprasCompartidasDiv) {
            comprasCompartidasDiv.style.display = 'none';
        }
        
        // Mantener solo un selector de asador
        if (asadoresContainer) {
            const primerAsador = asadoresContainer.querySelector('.asador-item');
            if (primerAsador) {
                asadoresContainer.innerHTML = '';
                asadoresContainer.appendChild(primerAsador);
            }
        }
        
        // Recargar formulario
        cargarFormularioWog();
        
        // Disparar evento para actualizar otros módulos
        document.dispatchEvent(new CustomEvent('wogActualizado'));
        
        // Redirigir a la pestaña de historial (usando método seguro)
        if (window.openTab) {
            window.openTab('tab-historial');
        } else {
            // Alternativa si openTab no está disponible
            const historialTab = document.getElementById('tab-historial');
            if (historialTab) {
                // Mostrar tab de forma manual
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                historialTab.classList.add('active');
                
                // Activar botón
                document.querySelectorAll('.tab-button').forEach(btn => {
                    if (btn.getAttribute('onclick')?.includes('tab-historial')) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                
                // Cargar historial si la función existe
                if (typeof window.cargarHistorialSimple === 'function') {
                    window.cargarHistorialSimple();
                }
            }
        }
        
    } catch (error) {
        console.error('Error al guardar WOG:', error);
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('Error al guardar WOG: ' + error.message, true);
        }
    } finally {
        // Restaurar botón
        const submitBtn = formNuevoWog?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar WOG';
        }
    }
}

// Exportamos la función de formatear fecha al ámbito global
window.formatearFechaInputWog = formatearFechaInput;