// database.js - Módulo para manejar todas las operaciones de la base de datos

// Importar la configuración de Firebase
import { db } from '../firebase-config.js';

// Nombres de las colecciones en Firestore
const PARTICIPANTES_COLLECTION = 'participantes';
const EVENTOS_COLLECTION = 'eventos';

/**
 * Obtiene todos los participantes de la base de datos
 * @returns {Promise<Array>} Array de participantes
 */
export async function getParticipantes() {
  try {
    const snapshot = await db.collection(PARTICIPANTES_COLLECTION).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    throw error;
  }
}

/**
 * Obtiene los participantes activos
 * @returns {Promise<Array>} Array de participantes activos
 */
export async function getParticipantesActivos() {
  try {
    const snapshot = await db.collection(PARTICIPANTES_COLLECTION)
      .where('activo', '==', true)
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener participantes activos:', error);
    throw error;
  }
}

/**
 * Agrega un nuevo participante a la base de datos
 * @param {Object} participante Datos del participante
 * @returns {Promise<string>} ID del participante creado
 */
export async function addParticipante(participante) {
  try {
    const docRef = await db.collection(PARTICIPANTES_COLLECTION).add({
      ...participante,
      activo: true,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar participante:', error);
    throw error;
  }
}

/**
 * Actualiza un participante existente
 * @param {string} id ID del participante
 * @param {Object} data Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateParticipante(id, data) {
  try {
    await db.collection(PARTICIPANTES_COLLECTION).doc(id).update({
      ...data,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar participante:', error);
    throw error;
  }
}

/**
 * Cambia el estado activo/inactivo de un participante
 * @param {string} id ID del participante
 * @param {boolean} estado Nuevo estado (activo/inactivo)
 * @returns {Promise<void>}
 */
export async function toggleEstadoParticipante(id, estado) {
  try {
    await db.collection(PARTICIPANTES_COLLECTION).doc(id).update({
      activo: estado,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error al cambiar estado del participante:', error);
    throw error;
  }
}

/**
 * Obtiene todos los eventos (WOGs) de la base de datos
 * @returns {Promise<Array>} Array de eventos
 */
export async function getEventos() {
  try {
    const snapshot = await db.collection(EVENTOS_COLLECTION)
      .orderBy('fecha', 'desc')
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    throw error;
  }
}

/**
 * Agrega un nuevo evento (WOG) a la base de datos
 * @param {Object} evento Datos del evento
 * @returns {Promise<string>} ID del evento creado
 */
export async function addEvento(evento) {
  try {
    // Asegurarse de que la fecha sea un objeto Date para Firebase
    const eventoData = {
      ...evento,
      fecha: firebase.firestore.Timestamp.fromDate(new Date(evento.fecha)),
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection(EVENTOS_COLLECTION).add(eventoData);
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar evento:', error);
    throw error;
  }
}

/**
 * Actualiza un evento existente
 * @param {string} id ID del evento
 * @param {Object} data Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateEvento(id, data) {
  try {
    // Si hay una fecha, convertirla a Timestamp
    const updateData = { ...data };
    if (updateData.fecha) {
      updateData.fecha = firebase.firestore.Timestamp.fromDate(new Date(updateData.fecha));
    }
    
    updateData.fechaActualizacion = firebase.firestore.FieldValue.serverTimestamp();
    
    await db.collection(EVENTOS_COLLECTION).doc(id).update(updateData);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    throw error;
  }
}

/**
 * Elimina un evento
 * @param {string} id ID del evento
 * @returns {Promise<void>}
 */
export async function deleteEvento(id) {
  try {
    await db.collection(EVENTOS_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    throw error;
  }
}

/**
 * Inicializa la base de datos con datos de muestra si está vacía
 * @returns {Promise<void>}
 */
export async function initializeDatabase() {
  try {
    // Verificar si ya existen participantes
    const participantesSnapshot = await db.collection(PARTICIPANTES_COLLECTION).limit(1).get();
    
    if (participantesSnapshot.empty) {
      console.log('Inicializando base de datos con datos de muestra...');
      
      // Datos de muestra - Participantes
      const participantesMuestra = [
        { nombre: 'Longy', apodo: 'Longy', activo: true },
        { nombre: 'Sapo', apodo: 'Sapo', activo: true },
        { nombre: 'Sax', apodo: 'Sax', activo: true },
        { nombre: 'Yao', apodo: 'Yao', activo: true },
        { nombre: 'Joao', apodo: 'Joao', activo: true },
        { nombre: 'Largo', apodo: 'Largo', activo: true },
        { nombre: 'Gato', apodo: 'Gato', activo: true },
        { nombre: 'Melo', apodo: 'Melo', activo: true }
      ];
      
      // Crear los participantes
      const participantesIds = {};
      for (const participante of participantesMuestra) {
        const docRef = await db.collection(PARTICIPANTES_COLLECTION).add({
          ...participante,
          fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        participantesIds[participante.nombre] = docRef.id;
      }
      
      // Datos de muestra - Eventos (WOGs)
      const eventosMuestra = [
        { 
          fecha: new Date('2025-01-14'),
          sede: participantesIds['Longy'],
          subsede: 'Casa', 
          compras: participantesIds['Longy'], 
          asadores: [participantesIds['Longy']], 
          asistentes: [
            participantesIds['Longy'], 
            participantesIds['Sapo'], 
            participantesIds['Sax'], 
            participantesIds['Yao'], 
            participantesIds['Joao']
          ] 
        },
        { 
          fecha: new Date('2025-01-21'),
          sede: participantesIds['Sapo'],
          subsede: 'Melo', 
          compras: participantesIds['Yao'], 
          asadores: [participantesIds['Sapo']], 
          asistentes: [
            participantesIds['Longy'], 
            participantesIds['Sapo'], 
            participantesIds['Sax'], 
            participantesIds['Yao'], 
            participantesIds['Joao'],
            participantesIds['Melo']
          ] 
        },
        { 
          fecha: new Date('2025-01-28'),
          sede: participantesIds['Sapo'],
          subsede: 'Melo', 
          compras: participantesIds['Sax'], 
          asadores: [participantesIds['Sax']], 
          asistentes: [
            participantesIds['Longy'], 
            participantesIds['Sapo'], 
            participantesIds['Sax'], 
            participantesIds['Yao'], 
            participantesIds['Joao'],
            participantesIds['Melo']
          ] 
        }
      ];
      
      // Crear los eventos
      for (const evento of eventosMuestra) {
        await db.collection(EVENTOS_COLLECTION).add({
          ...evento,
          fecha: firebase.firestore.Timestamp.fromDate(evento.fecha),
          fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      console.log('Base de datos inicializada correctamente');
    } else {
      console.log('La base de datos ya contiene datos, omitiendo inicialización');
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
}

/**
 * Calcula los puntajes de todos los participantes
 * @returns {Promise<Array>} Array de participantes con sus puntajes
 */
export async function calcularPuntajes() {
  try {
    // Obtener todos los participantes y eventos
    const participantes = await getParticipantes();
    const eventos = await getEventos();
    
    // Inicializar estadísticas para cada participante
    const estadisticas = {};
    participantes.forEach(p => {
      estadisticas[p.id] = {
        id: p.id,
        nombre: p.nombre,
        apodo: p.apodo,
        totalWogs: 0,
        sede: 0,
        asador: 0,
        compras: 0,
        puntos: 0,
        logros: []
      };
    });
    
    // Procesar cada evento para calcular puntos
    eventos.forEach(evento => {
      // Contar asistencia
      evento.asistentes.forEach(id => {
        if (estadisticas[id]) {
          estadisticas[id].totalWogs++;
        }
      });
      
      // Puntos por sede (1 punto)
      if (estadisticas[evento.sede]) {
        estadisticas[evento.sede].sede++;
        estadisticas[evento.sede].puntos += 1;
      }
      
      // Puntos por asador (1 punto, dividido si son varios)
      const puntosAsador = 1 / evento.asadores.length;
      evento.asadores.forEach(id => {
        if (estadisticas[id]) {
          estadisticas[id].asador += puntosAsador;
          estadisticas[id].puntos += puntosAsador;
        }
      });
      
      // Puntos por compras (1 punto, dividido si son varios)
      if (evento.comprasCompartidas && evento.comprasCompartidas.length > 0) {
        const puntosCompras = 1 / evento.comprasCompartidas.length;
        evento.comprasCompartidas.forEach(id => {
          if (estadisticas[id]) {
            estadisticas[id].compras += puntosCompras;
            estadisticas[id].puntos += puntosCompras;
          }
        });
      } else if (estadisticas[evento.compras]) {
        estadisticas[evento.compras].compras++;
        estadisticas[evento.compras].puntos += 1;
      }
    });
    
    // Calcular logros
    Object.values(estadisticas).forEach(stat => {
      // Logros basados en estadísticas
      if (stat.sede >= 3) stat.logros.push('Anfitrión Frecuente');
      if (stat.asador >= 3) stat.logros.push('Chef Maestro');
      if (stat.compras >= 3) stat.logros.push('Abastecedor Oficial');
      if (stat.totalWogs >= 8) stat.logros.push('Nunca Falta');
      if (stat.sede > 0 && stat.asador > 0 && stat.compras > 0) stat.logros.push('Todoterreno');
    });
    
    // Convertir a array y ordenar por puntos
    return Object.values(estadisticas)
      .filter(p => p.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos);
      
  } catch (error) {
    console.error('Error al calcular puntajes:', error);
    throw error;
  }
/**
 * Elimina un participante de la base de datos
 * @param {string} id ID del participante a eliminar
 * @returns {Promise<void>}
 */
export async function deleteParticipante(id) {
  try {
    // Antes de eliminar, verificar si el participante está asociado a eventos
    const eventosSnapshot = await db.collection(EVENTOS_COLLECTION)
      .where('asistentes', 'array-contains', id)
      .limit(1)
      .get();
      
    const eventosSedeSnapshot = await db.collection(EVENTOS_COLLECTION)
      .where('sede', '==', id)
      .limit(1)
      .get();
      
    const eventosAsadorSnapshot = await db.collection(EVENTOS_COLLECTION)
      .where('asadores', 'array-contains', id)
      .limit(1)
      .get();
      
    const eventosComprasSnapshot = await db.collection(EVENTOS_COLLECTION)
      .where('compras', '==', id)
      .limit(1)
      .get();
      
    // Si está asociado a eventos, no permitir eliminación
    if (!eventosSnapshot.empty || !eventosSedeSnapshot.empty || 
        !eventosAsadorSnapshot.empty || !eventosComprasSnapshot.empty) {
      throw new Error('No se puede eliminar el participante porque está asociado a uno o más eventos. Considere desactivarlo en lugar de eliminarlo.');
    }
    
    // Si no está asociado a eventos, proceder con la eliminación
    await db.collection(PARTICIPANTES_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    throw error;
  }
}
