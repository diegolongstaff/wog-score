// ui-helpers.js - Funciones auxiliares para la interfaz de usuario

/**
 * Muestra un mensaje de error en la interfaz
 * @param {string} message Mensaje de error
 * @param {number} duration Duración en milisegundos (0 para no ocultar automáticamente)
 * @param {string} containerId ID del contenedor donde mostrar el mensaje
 */
export function showErrorMessage(message, duration = 5000, containerId = null) {
  // Crear elemento para el mensaje de error
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  
  // Añadir contenido
  errorDiv.innerHTML = `
    ${message}
    <button type="button" class="close-message">&times;</button>
  `;
  
  // Añadir al DOM
  const container = containerId 
    ? document.getElementById(containerId) 
    : document.querySelector('.container');
  
  if (container) {
    container.insertBefore(errorDiv, container.firstChild);
    
    // Configurar botón para cerrar mensaje
    errorDiv.querySelector('.close-message').addEventListener('click', () => {
      errorDiv.remove();
    });
    
    // Eliminar después del tiempo especificado
    if (duration > 0) {
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, duration);
    }
  } else {
    // Fallback a alert si no hay contenedor
    alert(message);
  }
}

/**
 * Muestra un mensaje de éxito en la interfaz
 * @param {string} message Mensaje de éxito
 * @param {number} duration Duración en milisegundos (0 para no ocultar automáticamente)
 * @param {string} containerId ID del contenedor donde mostrar el mensaje
 */
export function showSuccessMessage(message, duration = 3000, containerId = null) {
  // Crear elemento para el mensaje
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  
  // Añadir contenido
  successDiv.innerHTML = `
    ${message}
    <button type="button" class="close-message">&times;</button>
  `;
  
  // Añadir al DOM
  const container = containerId 
    ? document.getElementById(containerId) 
    : document.querySelector('.container');
  
  if (container) {
    container.insertBefore(successDiv, container.firstChild);
    
    // Configurar botón para cerrar mensaje
    successDiv.querySelector('.close-message').addEventListener('click', () => {
      successDiv.remove();
    });
    
    // Eliminar después del tiempo especificado
    if (duration > 0) {
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.remove();
        }
      }, duration);
    }
  } else {
    // Fallback a alert si no hay contenedor
    alert(message);
  }
}

/**
 * Muestra un diálogo de confirmación personalizado
 * @param {Object} options Opciones del diálogo
 * @param {string} options.title Título del diálogo
 * @param {string} options.message Mensaje del diálogo
 * @param {string} options.confirmText Texto del botón de confirmación
 * @param {string} options.cancelText Texto del botón de cancelación
 * @param {Function} options.onConfirm Función a ejecutar al confirmar
 * @param {Function} options.onCancel Función a ejecutar al cancelar
 */
export function showConfirmDialog(options) {
  const modal = document.getElementById('modal-confirmacion');
  const titulo = document.getElementById('modal-confirmacion-titulo');
  const mensaje = document.getElementById('modal-confirmacion-mensaje');
  const btnConfirmar = document.getElementById('btn-confirmar-accion');
  const btnCancelar = document.getElementById('btn-cancelar-confirmacion');
  
  // Si no existe el modal, usar confirm nativo
  if (!modal || !titulo || !mensaje || !btnConfirmar || !btnCancelar) {
    const confirmed = confirm(options.message);
    if (confirmed && options.onConfirm) {
      options.onConfirm();
    } else if (!confirmed && options.onCancel) {
      options.onCancel();
    }
    return;
  }
  
  // Configurar contenido
  titulo.textContent = options.title || 'Confirmar acción';
  mensaje.textContent = options.message || '¿Estás seguro de realizar esta acción?';
  btnConfirmar.textContent = options.confirmText || 'Confirmar';
  btnCancelar.textContent = options.cancelText || 'Cancelar';
  
  // Eliminar listeners previos
  const newBtnConfirmar = btnConfirmar.cloneNode(true);
  const newBtnCancelar = btnCancelar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);
  btnCancelar.parentNode.replaceChild(newBtnCancelar, btnCancelar);
  
  // Configurar eventos
  newBtnConfirmar.addEventListener('click', () => {
    modal.style.display = 'none';
    if (options.onConfirm) options.onConfirm();
  });
  
  newBtnCancelar.addEventListener('click', () => {
    modal.style.display = 'none';
    if (options.onCancel) options.onCancel();
  });
  
  // Mostrar modal
  modal.style.display = 'block';
}

/**
 * Carga un conjunto de opciones en un elemento select
 * @param {HTMLSelectElement} selectElement Elemento select a llenar
 * @param {Array} options Array de opciones
 * @param {string} valueProperty Propiedad a usar como valor
 * @param {string} textProperty Propiedad a usar como texto
 * @param {string} defaultOptionText Texto de la opción por defecto (null para no incluirla)
 */
export function populateSelectOptions(selectElement, options, valueProperty = 'id', textProperty = 'nombre', defaultOptionText = 'Seleccionar...') {
  // Guardar valor seleccionado actual
  const currentValue = selectElement.value;
  
  // Limpiar opciones existentes
  selectElement.innerHTML = '';
  
  // Añadir opción por defecto si se especifica
  if (defaultOptionText !== null) {
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = defaultOptionText;
    selectElement.appendChild(defaultOption);
  }
  
  // Añadir opciones
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option[valueProperty];
    optionElement.textContent = option[textProperty];
    selectElement.appendChild(optionElement);
  });
  
  // Restaurar valor seleccionado si existe
  if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
    selectElement.value = currentValue;
  }
}

/**
 * Crea elementos checkbox a partir de un array de opciones
 * @param {HTMLElement} container Contenedor donde añadir los checkboxes
 * @param {Array} options Array de opciones
 * @param {string} valueProperty Propiedad a usar como valor
 * @param {string} textProperty Propiedad a usar como texto
 * @param {Array} selectedValues Array de valores seleccionados
 * @param {string} namePrefix Prefijo para los atributos id y name
 */
export function createCheckboxes(container, options, valueProperty = 'id', textProperty = 'nombre', selectedValues = [], namePrefix = 'checkbox') {
  // Limpiar contenedor
  container.innerHTML = '';
  
  // Crear checkbox para cada opción
  options.forEach(option => {
    const value = option[valueProperty];
    const text = option[textProperty];
    
    const checkboxItem = document.createElement('div');
    checkboxItem.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${namePrefix}-${value}`;
    checkbox.name = namePrefix;
    checkbox.value = value;
    checkbox.checked = selectedValues.includes(value);
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = text;
    
    checkboxItem.appendChild(checkbox);
    checkboxItem.appendChild(label);
    container.appendChild(checkboxItem);
  });
}

/**
 * Crea un elemento de avatar a partir de un nombre
 * @param {string} name Nombre para el avatar
 * @param {string} size Tamaño del avatar ('sm', '', 'lg')
 * @returns {HTMLElement} Elemento de avatar
 */
export function createAvatar(name, size = '') {
  const avatar = document.createElement('div');
  avatar.className = `avatar ${size ? 'avatar-' + size : ''}`;
  
  // Obtener iniciales
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  avatar.textContent = initials;
  
  return avatar;
}

/**
 * Crea un gráfico de barras simple usando divs
 * @param {HTMLElement} container Contenedor donde crear el gráfico
 * @param {Array} data Datos para el gráfico
 * @param {string} labelProperty Propiedad a usar como etiqueta
 * @param {string} valueProperty Propiedad a usar como valor
 * @param {string} colorProperty Propiedad a usar como color (opcional)
 */
export function createSimpleBarChart(container, data, labelProperty, valueProperty, colorProperty = null) {
  // Limpiar contenedor
  container.innerHTML = '';
  
  // Obtener valor máximo
  const maxValue = Math.max(...data.map(item => item[valueProperty]));
  
  // Crear barras
  data.forEach(item => {
    const barContainer = document.createElement('div');
    barContainer.className = 'chart-bar-container';
    
    const label = document.createElement('div');
    label.className = 'chart-bar-label';
    label.textContent = item[labelProperty];
    
    const barOuter = document.createElement('div');
    barOuter.className = 'chart-bar-outer';
    
    const barInner = document.createElement('div');
    barInner.className = 'chart-bar-inner';
    barInner.style.width = `${(item[valueProperty] / maxValue) * 100}%`;
    
    if (colorProperty && item[colorProperty]) {
      barInner.style.backgroundColor = item[colorProperty];
    }
    
    const value = document.createElement('div');
    value.className = 'chart-bar-value';
    value.textContent = item[valueProperty];
    
    barOuter.appendChild(barInner);
    barContainer.appendChild(label);
    barContainer.appendChild(barOuter);
    barContainer.appendChild(value);
    
    container.appendChild(barContainer);
  });
}
