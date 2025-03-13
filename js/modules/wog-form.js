// wog-form.js - Módulo para manejar el formulario de nuevo WOG

// Importar funciones de la base de datos
import { 
  getParticipantesActivos, 
  addEvento
} from '../database.js';

// Importar función para mostrar errores
import { showErrorMessage } from '../app.js';

// Eventos del DOM
document.addEventListener('DOMContentLoaded', initWogForm);
document.addEventListener('appInitialized', setupWogForm);
document.addEventListener('tabChanged', handleTabChange);

// Referencias a elementos del DOM
const form = document.getElementById('wog-form');
const fechaInput = document.getElementById('fecha');
const sedeSelect = document.getElementById('sede');
const subsedeInput = document.getElementById('subsede');
const comprasSelect = document.getElementById('compras');
const comprasCompartidasContainer = document.getElementById('compras-compartidas-container');
const asadorContainer = document.getElementById('asador-container');
const asistentesContainer = document.getElementById('asistentes-container');
const agregarAsadorBtn = document.getElementById('agregar-asador');

/**
 * Inicializa el formulario
 */
function initWogForm() {
  // Configurar la fecha actual por defecto
  fechaInput.value = formatDateForInput(new Date());
  
  // Configurar eventos
  form.addEventListener('submit', handleFormSubmit);
  comprasSelect.addEventListener('change', handleComprasChange);
  agregarAsadorBtn.addEventListener('click', agregarSelectorAsador);
}

/**
 * Configura el formulario con los datos necesarios
 */
async function setupWogForm() {
  try {
    console.log('Configurando formulario de WOG...');
    
    // Obtener participantes activos
    const participantes = await getParticipantesActivos();
    console.log('Participantes activos obtenidos:', participantes);
    
    // Llenar los selectores con los participantes
    populateSelectWithParticipantes(sedeSelect, participantes);
    populateSelectWithParticipantes(comprasSelect, participantes, true);
    populateAsadorSelectors(participantes);
    populateAsistentesCheckboxes(participantes);
    
    console.log('Formulario configurado correctamente');
  } catch (error) {
    console.error('Error al configurar formulario:', error);
    showErrorMessage('Error al cargar participantes. Por favor, recarga la página.');
  }
}

/**
 * Maneja el cambio de pestañas
 * @param {CustomEvent} event Evento de cambio de pestaña
 */
function handleTabChange(event) {
  if (event.detail.tabId === 'nuevo-wog') {
    // Refrescar participantes cuando se activa esta pestaña
    setupWogForm();
  }
}

/**
 * Llena un selector con los participantes
 * @param {HTMLSelectElement} select Elemento select a llenar
 * @param {Array} participantes Lista de participantes
 * @param {boolean} addCompartidoOption Si debe añadir la opción "Compartido"
 */
function populateSelectWithParticipantes(select, participantes, addCompartidoOption = false) {
  // Guardar la opción seleccionada actual
  const currentValue = select.value;
  
  // Limpiar opciones actuales
  while (select.options.length > 0) {
    select.remove(0);
  }
  
  // Añadir opción por defecto
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccionar...';
  select.appendChild(defaultOption);
  
  // Añadir opción compartido si es necesario
  if (addCompartidoOption) {
    const compartidoOption = document.createElement('option');
    compartidoOption.value = 'compartido';
    compartidoOption.textContent = 'Compartido';
    select.appendChild(compartidoOption);
  }
  
  // Añadir participantes
  participantes.forEach(participante => {
    const option = document.createElement('option');
    option.value = participante.id;
    option.textContent = participante.nombre;
    select.appendChild(option);
  });
  
  // Restaurar valor seleccionado si existía
  if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
    select.value = currentValue;
  }
}

/**
 * Llena los selectores de asadores con los participantes
 * @param {Array} participantes Lista de participantes
 */
function populateAsadorSelectors(participantes) {
  const asadorSelects = document.querySelectorAll('.asador-select');
  
  asadorSelects.forEach(select => {
    populateSelectWithParticipantes(select, participantes);
  });
}

/**
 * Llena los checkboxes de asistentes con los participantes
 * @param {Array} participantes Lista de participantes
 */
function populateAsistentesCheckboxes(participantes) {
  // Limpiar contenedor
  asistentesContainer.innerHTML = '';
  
  // Crear checkboxes para cada participante
  participantes.forEach(participante => {
    const checkboxItem = document.createElement('div');
    checkboxItem.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `asistente-${participante.id}`;
    checkbox.value = participante.id;
    
    const label = document.createElement('label');
    label.htmlFor = `asistente-${participante.id}`;
    label.textContent = participante.nombre;
    
    checkboxItem.appendChild(checkbox);
    checkboxItem.appendChild(label);
    asistentesContainer.appendChild(checkboxItem);
  });
}

/**
 * Agrega un selector de asador adicional
 */
function agregarSelectorAsador() {
  // Obtener los participantes para llenar el selector
  getParticipantesActivos()
    .then(participantes => {
      const asadorItem = document.createElement('div');
      asadorItem.className = 'asador-item';
      
      const select = document.createElement('select');
      select.className = 'asador-select';
      select.required = true;
      
      // Llenar el selector con participantes
      populateSelectWithParticipantes(select, participantes);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-danger';
      deleteBtn.style.marginLeft = '5px';
      deleteBtn.style.padding = '5px 10px';
      deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
      deleteBtn.addEventListener('click', function() {
        asadorItem.remove();
      });
      
      asadorItem.appendChild(select);
      asadorItem.appendChild(deleteBtn);
      asadorContainer.appendChild(asadorItem);
    })
    .catch(error => {
      console.error('Error al agregar asador:', error);
      showErrorMessage('Error al cargar participantes');
    });
}

/**
 * Maneja el cambio en el selector de compras
 */
function handleComprasChange() {
  if (comprasSelect.value === 'compartido') {
    // Mostrar contenedor de compras compartidas
    comprasCompartidasContainer.style.display = 'block';
    
    // Obtener participantes para checkboxes si no existen
    if (document.getElementById('compras-compartidas-checkboxes').children.length === 0) {
      getParticipantesActivos()
        .then(participantes => {
          const checkboxesContainer = document.getElementById('compras-compartidas-checkboxes');
          checkboxesContainer.innerHTML = '';
          
          participantes.forEach(participante => {
            const checkboxItem = document.createElement('div');
            checkboxItem.className = 'checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `compra-compartida-${participante.id}`;
            checkbox.value = participante.id;
            
            const label = document.createElement('label');
            label.htmlFor = `compra-compartida-${participante.id}`;
            label.textContent = participante.nombre;
            
            checkboxItem.appendChild(checkbox);
            checkboxItem.appendChild(label);
            checkboxesContainer.appendChild(checkboxItem);
          });
        })
        .catch(error => {
          console.error('Error al cargar participantes para compras compartidas:', error);
        });
    }
  } else {
    // Ocultar contenedor de compras compartidas
    comprasCompartidasContainer.style.display = 'none';
  }
}

/**
 * Maneja el envío del formulario
 * @param {Event} event Evento de envío del formulario
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  try {
    // Recopilar datos del formulario
    const fecha = fechaInput.value;
    const sede = sedeSelect.value;
    const subsede = subsedeInput.value;
    
    // Obtener asistentes
    const asistentes = [];
    document.querySelectorAll('#asistentes-container input[type="checkbox"]:checked').forEach(checkbox => {
      asistentes.push(checkbox.value);
    });
    
    // Obtener asadores
    const asadores = [];
    document.querySelectorAll('.asador-select').forEach(select => {
      if (select.value) {
        asadores.push(select.value);
      }
    });
    
    // Validar datos obligatorios
    if (!fecha || !sede || asadores.length === 0 || asistentes.length === 0) {
      showErrorMessage('Por favor completa todos los campos obligatorios');
      return;
    }
    
    // Crear objeto de evento
    const nuevoEvento = {
      fecha,
      sede,
      subsede,
      asadores,
      asistentes
    };
    
    // Manejar compras (normal o compartidas)
    if (comprasSelect.value === 'compartido') {
      nuevoEvento.comprasCompartidas = [];
      
      document.querySelectorAll('#compras-compartidas-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
        nuevoEvento.comprasCompartidas.push(checkbox.value);
      });
      
      if (nuevoEvento.comprasCompartidas.length === 0) {
        showErrorMessage('Debes seleccionar al menos un participante para las compras compartidas');
        return;
      }
    } else {
      if (!comprasSelect.value) {
        showErrorMessage('Debes seleccionar quién hizo las compras');
        return;
      }
      nuevoEvento.compras = comprasSelect.value;
    }
    
    // Guardar evento en la base de datos
    await addEvento(nuevoEvento);
    
    // Mostrar mensaje de éxito
    alert('WOG registrado con éxito');
    
    // Resetear formulario
    form.reset();
    initWogForm();
    setupWogForm();
    
    // Disparar evento para actualizar otras vistas
    const event = new CustomEvent('wogUpdated');
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error al guardar WOG:', error);
    showErrorMessage('Error al guardar el WOG. Por favor, intenta de nuevo.');
  }
}

/**
 * Formatea una fecha para un campo input type="date"
 * @param {Date} date Fecha a formatear
 * @returns {string} Fecha formateada YYYY-MM-DD
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
