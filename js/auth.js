// auth.js - Módulo para manejar la autenticación de usuarios (opcional)

// Importar configuración de Firebase
import { auth } from '../firebase-config.js';

// Referencias al DOM
const userInfoContainer = document.getElementById('user-info');

// Variable para almacenar el usuario actual
let currentUser = null;

// Evento de inicialización
document.addEventListener('DOMContentLoaded', initAuth);

/**
 * Inicializa el módulo de autenticación
 */
function initAuth() {
  console.log('Inicializando módulo de autenticación...');
  
  // Escuchar cambios en el estado de autenticación
  auth.onAuthStateChanged(user => {
    if (user) {
      // Usuario ha iniciado sesión
      currentUser = user;
      updateUserInfo(user);
      
      // Disparar evento de usuario autenticado
      const event = new CustomEvent('userAuthenticated', { detail: { user } });
      document.dispatchEvent(event);
    } else {
      // Usuario ha cerrado sesión
      currentUser = null;
      updateUserInfo(null);
      
      // Disparar evento de usuario no autenticado
      const event = new CustomEvent('userSignedOut');
      document.dispatchEvent(event);
      
      // En una implementación inicial, podemos hacer que todos accedan sin login
      // Si posteriormente se quiere restringir acceso, descomentar la siguiente línea:
      // showLoginUI();
    }
  });
}

/**
 * Actualiza la información del usuario en la interfaz
 * @param {Object|null} user Usuario autenticado o null si no hay usuario
 */
function updateUserInfo(user) {
  if (!userInfoContainer) return;
  
  if (user) {
    // Mostrar información del usuario
    userInfoContainer.innerHTML = `
      <div class="user-info-container">
        <span class="user-name">${user.displayName || user.email || 'Usuario'}</span>
        <button id="btn-logout" class="btn-logout">Salir</button>
      </div>
    `;
    
    // Configurar botón de cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', signOut);
  } else {
    // Mostrar botón de inicio de sesión
    userInfoContainer.innerHTML = `
      <button id="btn-login" class="btn-login">Iniciar sesión</button>
    `;
    
    // Configurar botón de inicio de sesión
    document.getElementById('btn-login').addEventListener('click', showLoginUI);
  }
}

/**
 * Muestra la interfaz de inicio de sesión
 * Esta es una implementación básica, se puede expandir según las necesidades
 */
function showLoginUI() {
  // Aquí se podría mostrar un modal de inicio de sesión
  // Por ahora usaremos un enfoque simple:
  const email = prompt('Correo electrónico:');
  if (!email) return;
  
  const password = prompt('Contraseña:');
  if (!password) return;
  
  signIn(email, password);
}

/**
 * Inicia sesión con correo y contraseña
 * @param {string} email Correo electrónico del usuario
 * @param {string} password Contraseña del usuario
 */
async function signIn(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert(`Error al iniciar sesión: ${error.message}`);
  }
}

/**
 * Cierra la sesión del usuario actual
 */
async function signOut() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

/**
 * Registra un nuevo usuario
 * @param {string} email Correo electrónico del usuario
 * @param {string} password Contraseña del usuario
 */
async function registerUser(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  }
}

/**
 * Comprueba si hay un usuario autenticado
 * @returns {boolean} True si hay un usuario autenticado, false en caso contrario
 */
function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Obtiene el usuario actual
 * @returns {Object|null} Usuario actual o null si no hay usuario autenticado
 */
function getCurrentUser() {
  return currentUser;
}

// Exportar funciones públicas
export {
  signIn,
  signOut,
  registerUser,
  isAuthenticated,
  getCurrentUser
};
