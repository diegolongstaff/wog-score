// date-helpers.js - Utilidades para manejo de fechas

/**
 * Formatea una fecha para un campo input type="date"
 * @param {Date} date Fecha a formatear
 * @returns {string} Fecha formateada YYYY-MM-DD
 */
export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {Date|firebase.firestore.Timestamp} date Fecha a formatear
 * @param {Object} options Opciones de formato
 * @returns {string} Fecha formateada según las opciones
 */
export function formatDateForDisplay(date, options = {}) {
  // Si es un timestamp de Firestore, convertirlo a Date
  const dateObj = date instanceof Date ? date : date.toDate();
  
  // Opciones por defecto
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  // Combinar opciones
  const formatOptions = { ...defaultOptions, ...options };
  
  // Formatear usando la API de Intl
  return dateObj.toLocaleDateString('es-ES', formatOptions);
}

/**
 * Obtiene una fecha con la hora reseteada (00:00:00)
 * @param {Date} date Fecha a resetear
 * @returns {Date} Fecha con hora reseteada
 */
export function getDateWithoutTime(date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Compara dos fechas ignorando la hora
 * @param {Date} date1 Primera fecha
 * @param {Date} date2 Segunda fecha
 * @returns {number} -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = getDateWithoutTime(date1);
  const d2 = getDateWithoutTime(date2);
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Obtiene la fecha del próximo día de la semana
 * @param {number} dayOfWeek Día de la semana (0: domingo, 1: lunes, ..., 6: sábado)
 * @returns {Date} Fecha del próximo día de la semana indicado
 */
export function getNextDayOfWeek(dayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay();
  
  // Calcular diferencia de días
  let daysToAdd = dayOfWeek - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Si es el mismo día o ya pasó, ir a la próxima semana
  }
  
  // Crear nueva fecha
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate;
}

/**
 * Obtiene una lista de martes (o cualquier día) para las próximas semanas
 * @param {number} dayOfWeek Día de la semana (0: domingo, 1: lunes, ..., 6: sábado)
 * @param {number} weeks Número de semanas a incluir
 * @returns {Array<Date>} Lista de fechas
 */
export function getUpcomingDaysOfWeek(dayOfWeek, weeks = 4) {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < weeks; i++) {
    // Crear fecha base
    const date = new Date(today);
    date.setDate(today.getDate() + (i * 7));
    
    // Ajustar al día de la semana deseado
    const currentDay = date.getDay();
    let diff = dayOfWeek - currentDay;
    if (diff < 0) diff += 7;
    
    // Añadir la diferencia de días
    date.setDate(date.getDate() + diff);
    
    // Si es la primera semana y el día ya pasó, sumar una semana
    if (i === 0 && diff === 0 && date.getDate() <= today.getDate()) {
      date.setDate(date.getDate() + 7);
    }
    
    dates.push(date);
  }
  
  return dates;
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date} date1 Primera fecha
 * @param {Date} date2 Segunda fecha
 * @returns {number} Número de días entre las fechas
 */
export function daysBetween(date1, date2) {
  // Convertir a timestamp de medianoche
  const d1 = getDateWithoutTime(date1).getTime();
  const d2 = getDateWithoutTime(date2).getTime();
  
  // Calcular diferencia en días
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}
