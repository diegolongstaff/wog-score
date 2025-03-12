// settings.js - Módulo para manejar la configuración de la aplicación

// Importar funciones de la base de datos
import { 
  getParticipantes, 
  addParticipante, 
  updateParticipante, 
  toggleEstadoParticipante,
  deleteParticipante 
} from '../database.js';

// Importar función para mostrar errores
import { showErrorMessage } from '../app.js';

// Referencias a elementos del DOM
const participantesListContainer = document.getElementById('participantes-list');
const btnNuevoParticipante = document.getElementById('btn-nuevo-participante');
const modalNuevoParticipante = document.getElementById('modal-nuevo-participante');
const formNuevoParticipante = document.getElementById('form-nuevo-participante');
const inputNuevoNombre = document.getElementById('nuevo-nombre');
const inputNuevoApodo = document.getElementById('nuevo-apodo');
const btnCancelarParticipante = document.getElementById('btn-cancelar-participante');

// Eventos del DOM
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('tabChanged', handleTabChange);

// Configurar eventos de botones y formularios
btnNuevoParticipante.addEventListener('click', abrirModalNuevoParticipante);
btnCancelarParticipante.addEventListener('click', cerrarModalNuevoParticipante);
formNuevoParticipante.addEventListener('submit', guardarNuevoParticipante);

// Cerrar el modal al hacer clic en la X
document.querySelector('#modal-nuevo-participante .close-modal').addEventListener('click', cerrarModalNuevoParticipante);

/**
 * Inicializa el módulo
 */
function init() {
  console.log('Inicializando módulo de configuración...');
}

/**
 * Maneja el cambio de pestañas
 * @param {CustomEvent} event Evento de cambio de pestaña
 */
function handleTabChange(event) {
  if (event.detail.tabId === 'configuracion') {
    cargarParticipantes();
  }
}

/**
 * Carga y muestra la lista de participantes
 */
async function cargarParticipantes() {
  try {
    // Mostrar indicador de carga
    participantesListContainer.innerHTML = `
      <div class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i> Cargando participantes...
      </div>
    `;
    
    // Obtener participantes
    const participantes = await getParticipantes();
    
    // Verificar si hay participantes
    if (participantes.length === 0) {
      participantesListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>No hay participantes registrados. Agrega algunos para comenzar.</p>
        </div>
      `;
      return;
    }
    
    // Ordenar por nombre
    participantes.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Crear tabla de participantes
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Apodo</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${participantes.map(p => `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.apodo || '-'}</td>
            <td>${p.activo ? 'Activo' : 'Inactivo'}</td>
            <td>
              <button onclick="window.settingsModule.editarParticipante('${p.id}')" class="btn-primary" style="padding: 5px 10px;">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="window.settingsModule.toggleEstadoParticipante('${p.id}', ${!p.activo})" class="btn-${p.activo ? 'danger' : 'success'}" style="padding: 5px 10px;">
                <i class="fas fa-${p.activo ? 'user-slash' : 'user-check'}"></i>
              </button>
              <button onclick="window.settingsModule.confirmarEliminarParticipante('${p.id}')" class="btn-danger" style="padding: 5px 10px;">
            <i class="fas fa-trash"></i>
          </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    
    // Limpiar contenedor y añadir tabla
    participantesListContainer.innerHTML = '';
    participantesListContainer.appendChild(table);
    
  } catch (error) {
    console.error('Error al cargar participantes:', error);
    showErrorMessage('Error al cargar participantes. Por favor, intenta de nuevo.');
    
    participantesListContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Hubo un error al cargar los participantes. Intenta de nuevo más tarde.</p>
      </div>
    `;
  }
}

/**
 * Abre el modal para agregar un nuevo participante
 */
function abrirModalNuevoParticipante() {
  // Limpiar formulario
  formNuevoParticipante.reset();
  
  // Mostrar modal
  modalNuevoParticipante.style.display = 'block';
}

/**
 * Cierra el modal de nuevo participante
 */
function cerrarModalNuevoParticipante() {
  modalNuevoParticipante.style.display = 'none';
}

/**
 * Guarda un nuevo participante
 * @param {Event} event Evento de envío del formulario
 */
async function guardarNuevoParticipante(event) {
  event.preventDefault();
  
  try {
    const nombre = inputNuevoNombre.value.trim();
    const apodo = inputNuevoApodo.value.trim();
    
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    
    // Crear objeto de participante
    const nuevoParticipante = {
      nombre: nombre,
      apodo: apodo || nombre,
      activo: true
    };
    
    // Guardar en la base de datos
    await addParticipante(nuevoParticipante);
    
    // Cerrar modal
    cerrarModalNuevoParticipante();
    
    // Recargar lista de participantes
    cargarParticipantes();
    
    // Disparar evento para actualizar otros componentes
    const event = new CustomEvent('participantesUpdated');
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error al guardar participante:', error);
    showErrorMessage('Error al guardar el participante. Por favor, intenta de nuevo.');
  }
}

/**
 * Edita un participante existente
 * @param {string} id ID del participante
 */
async function editarParticipante(id) {
  try {
    // Obtener todos los participantes
    const participantes = await getParticipantes();
    
    // Encontrar el participante a editar
    const participante = participantes.find(p => p.id === id);
    
    if (!participante) {
      showErrorMessage('No se encontró el participante');
      return;
    }
    
    // Solicitar nuevos datos usando prompt (en una versión más avanzada, se podría usar un modal)
    const nuevoNombre = prompt('Nombre:', participante.nombre);
    if (nuevoNombre === null) return; // Usuario canceló
    
    const nuevoApodo = prompt('Apodo:', participante.apodo || '');
    if (nuevoApodo === null) return; // Usuario canceló
    
    // Validar nombre
    if (!nuevoNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    // Actualizar datos
    await updateParticipante(id, {
      nombre: nuevoNombre.trim(),
      apodo: nuevoApodo.trim() || nuevoNombre.trim()
    });
    
    // Recargar lista de participantes
    cargarParticipantes();
    
    // Disparar evento para actualizar otros componentes
    const event = new CustomEvent('participantesUpdated');
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error al editar participante:', error);
    showErrorMessage('Error al editar el participante. Por favor, intenta de nuevo.');
  }
}

/**
 * Cambia el estado activo/inactivo de un participante
 * @param {string} id ID del participante
 * @param {boolean} nuevoEstado Nuevo estado (true = activo, false = inactivo)
 */
async function toggleEstadoParticipante(id, nuevoEstado) {
  try {
    await toggleEstadoParticipante(id, nuevoEstado);
    
    // Recargar lista de participantes
    cargarParticipantes();
    
    // Disparar evento para actualizar otros componentes
    const event = new CustomEvent('participantesUpdated');
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error al cambiar estado del participante:', error);
    showErrorMessage('Error al cambiar el estado del participante. Por favor, intenta de nuevo.');
  }
}
/**
 * Muestra el diálogo de confirmación para eliminar un participante
 * @param {string} id ID del participante a eliminar
 */
async function confirmarEliminarParticipante(id) {
  try {
    // Obtener todos los participantes
    const participantes = await getParticipantes();
    
    // Encontrar el participante a eliminar
    const participante = participantes.find(p => p.id === id);
    
    if (!participante) {
      showErrorMessage('No se encontró el participante');
      return;
    }
    
    // Mostrar diálogo de confirmación personalizado
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const modalTitulo = document.getElementById('modal-confirmacion-titulo');
    const modalMensaje = document.getElementById('modal-confirmacion-mensaje');
    const btnConfirmar = document.getElementById('btn-confirmar-accion');
    
    modalTitulo.textContent = 'Eliminar Participante';
    modalMensaje.textContent = `¿Estás seguro de que deseas eliminar a ${participante.nombre}? Esta acción no se puede deshacer y solo debe realizarse si el participante no ha participado en ningún WOG.`;
    
    // Configurar evento de confirmación
    const handleConfirmar = async () => {
      try {
        await deleteParticipante(id);
        
        // Recargar lista de participantes
        cargarParticipantes();
        
        // Cerrar modal
        modalConfirmacion.style.display = 'none';
        
        // Mostrar mensaje de éxito
        showErrorMessage(`Se ha eliminado a ${participante.nombre} correctamente`, false);
        
        // Eliminar el event listener para evitar duplicados
        btnConfirmar.removeEventListener('click', handleConfirmar);
      } catch (error) {
        showErrorMessage(error.message || 'Error al eliminar el participante');
        // Cerrar modal
        modalConfirmacion.style.display = 'none';
        // Eliminar el event listener
        btnConfirmar.removeEventListener('click', handleConfirmar);
      }
    };
    
    // Eliminar event listeners anteriores y añadir el nuevo
    btnConfirmar.replaceWith(btnConfirmar.cloneNode(true));
    document.getElementById('btn-confirmar-accion').addEventListener('click', handleConfirmar);
    
    // Mostrar modal
    modalConfirmacion.style.display = 'block';
  } catch (error) {
    console.error('Error al preparar eliminación:', error);
    showErrorMessage('Error al preparar la eliminación del participante');
  }
}
// Exponer funciones necesarias al alcance global
window.settingsModule = {
  editarParticipante,
  toggleEstadoParticipante,
  confirmarEliminarParticipante
};
