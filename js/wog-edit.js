// Módulo para la edición de WOGs y redistribución de puntos

// Referencias a elementos del DOM
let modalEditWog;
let formEditWog;
let editWogIdInput;
let editFechaInput;
let editSedeSelect;
let editSubsedeInput;
let editCompradoresContainer;
let editAsadoresContainer;
let editAsistentesLista;
let editNotasInput;
let btnEditAddAsador;
let btnEditAddComprador;
let btnCancelarEdit;

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
    editCompradoresContainer = document.getElementById('edit-compradores-container');
    editAsadoresContainer = document.getElementById('edit-asadores-container');
    editAsistentesLista = document.getElementById('edit-asistentes-lista');
    editNotasInput = document.getElementById('edit-notas');
    btnEditAddAsador = document.getElementById('edit-add-asador');
    btnEditAddComprador = document.getElementById('edit-add-comprador');
    btnCancelarEdit = document.getElementById('btn-cancelar-edit');

    // Configurar eventos
    if (formEditWog) {
        formEditWog.addEventListener('submit', guardarWogEditado);
    }
    if (btnEditAddAsador) {
        btnEditAddAsador.addEventListener('click', agregarEditSelectorAsador);
    }
    if (btnEditAddComprador) {
        btnEditAddComprador.addEventListener('click', agregarEditSelectorComprador);
    }
    if (btnCancelarEdit) {
        btnCancelarEdit.addEventListener('click', () => {
            if (modalEditWog) modalEditWog.style.display = 'none';
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

// [Rest of the existing functions remain the same: cargarFormularioEditWog, llenarFormularioEdit, editarWog, guardarWogEditado, revertirPuntuaciones, asignarPuntuaciones]

// Estas funciones se mantienen igual que en tu versión original

// Exportar funciones necesarias al alcance global
window.initWogEditModule = initWogEditModule;
window.editarWog = editarWog;
window.agregarEditSelectorAsador = agregarEditSelectorAsador;
window.agregarEditSelectorComprador = agregarEditSelectorComprador;
window.llenarFormularioEdit = llenarFormularioEdit;
window.cargarFormularioEditWog = cargarFormularioEditWog;
window.guardarWogEditado = guardarWogEditado;