// app.js - Punto de entrada principal de la aplicación

// Importar módulos de la base de datos
import { initializeDatabase } from './database.js';

// Evento DOMContentLoaded para inicializar la aplicación
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Inicializa la aplicación
 */
async function initApp() {
  try {
    console.log('Inicializando WOG Score App...');
    
    // Inicializar la base de datos (crea datos de ejemplo si es la primera vez)
    await initializeDatabase();
    
    // Configurar la navegación por pestañas
    setupTabNavigation();
    
    // Cargar los datos iniciales
    loadInitialData();
    
    console.log('Aplicación inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    showErrorMessage('Error al inicializar la aplicación. Por favor, recarga la página.');
  }
}

/**
 * Configura la navegación por pestañas
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      openTab(tabId);
    });
  });
}

/**
 * Abre una pestaña específica
 * @param {string} tabId ID de la pestaña a abrir
 */
function openTab(tabId) {
  // Ocultar todas las pestañas y desactivar botones
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Mostrar la pestaña seleccionada y activar su botón
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
  
  // Disparar evento de cambio de pestaña para que los módulos puedan reaccionar
  const event = new CustomEvent('tabChanged', { detail: { tabId } });
  document.dispatchEvent(event);
}
// Exportar función openTab globalmente
window.openTab = openTab;

// Función openTab
function openTab(tabId) {
  // Ocultar todas las pestañas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Desactivar todos los botones
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Mostrar la pestaña seleccionada
  document.getElementById(tabId).classList.add('active');
  
  // Activar el botón correspondiente
  document.querySelector(`.tab-button[onclick="window.openTab('${tabId}')"]`).classList.add('active');
  
  // Disparar evento de cambio de pestaña
  const event = new CustomEvent('tabChanged', { detail: { tabId } });
  document.dispatchEvent(event);
}
/**
 * Carga los datos iniciales de la aplicación
 */
function loadInitialData() {
  // Disparar el evento de carga inicial
  const event = new CustomEvent('appInitialized');
  document.dispatchEvent(event);
}

/**
 * Muestra un mensaje de error en la aplicación
 * @param {string} message Mensaje de error
 */
function showErrorMessage(message) {
  // Crear elemento para el mensaje de error
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('error-message');
  errorDiv.textContent = message;
  
  // Añadir al DOM
  const container = document.querySelector('.container');
  container.insertBefore(errorDiv, container.firstChild);
  
  // Eliminar después de 5 segundos
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Exportar funciones útiles para otros módulos
export { openTab, showErrorMessage };
