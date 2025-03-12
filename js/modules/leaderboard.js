// leaderboard.js - Módulo para manejar la tabla de puntuación

// Importar funciones de la base de datos
import { calcularPuntajes } from '../database.js';

// Importar función para mostrar errores
import { showErrorMessage } from '../app.js';

// Referencias a elementos del DOM
const leaderboardContainer = document.getElementById('leaderboard-container');

// Eventos del DOM
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('tabChanged', handleTabChange);
document.addEventListener('wogUpdated', updateLeaderboard);

/**
 * Inicializa el módulo
 */
function init() {
  console.log('Inicializando módulo de puntuación...');
}

/**
 * Maneja el cambio de pestañas
 * @param {CustomEvent} event Evento de cambio de pestaña
 */
function handleTabChange(event) {
  if (event.detail.tabId === 'puntajes') {
    updateLeaderboard();
  }
}

/**
 * Actualiza la tabla de puntuación
 */
async function updateLeaderboard() {
  try {
    // Mostrar indicador de carga
    leaderboardContainer.innerHTML = `
      <div class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i> Calculando puntuaciones...
      </div>
    `;
    
    // Obtener los puntajes calculados
    const puntajes = await calcularPuntajes();
    
    // Verificar si hay puntajes
    if (puntajes.length === 0) {
      leaderboardContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <p>No hay datos de puntaje aún. Registra algunos WOGs para comenzar.</p>
        </div>
      `;
      return;
    }
    
    // Limpiar contenedor
    leaderboardContainer.innerHTML = '';
    
    // Crear tarjetas para cada participante con puntaje
    puntajes.forEach((jugador, index) => {
      const card = document.createElement('div');
      card.className = 'player-card';
      
      let logrosHTML = '';
      if (jugador.logros && jugador.logros.length > 0) {
        logrosHTML = `
          <div class="badge-section">
            ${jugador.logros.map(logro => `<span class="player-badge">${logro}</span>`).join('')}
          </div>
        `;
      }
      
      card.innerHTML = `
        <div class="ranking">${index + 1}</div>
        <h3>${jugador.nombre}</h3>
        <div class="player-stats">
          <div class="stat-item">
            <div class="stat-value">${jugador.puntos.toFixed(1)}</div>
            <div class="stat-label">Puntos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${jugador.sede}</div>
            <div class="stat-label">Anfitrión</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${jugador.asador.toFixed(1)}</div>
            <div class="stat-label">Asador</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${jugador.compras.toFixed(1)}</div>
            <div class="stat-label">Compras</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${jugador.totalWogs}</div>
            <div class="stat-label">Asistencias</div>
          </div>
        </div>
        ${logrosHTML}
      `;
      
      leaderboardContainer.appendChild(card);
    });
    
  } catch (error) {
    console.error('Error al actualizar tabla de puntuación:', error);
    showErrorMessage('Error al cargar los puntajes. Por favor, intenta de nuevo.');
    
    leaderboardContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Hubo un error al cargar los puntajes. Intenta de nuevo más tarde.</p>
      </div>
    `;
  }
}
