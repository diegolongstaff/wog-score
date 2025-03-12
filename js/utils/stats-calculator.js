// stats-calculator.js - Cálculos estadísticos para WOG Score

/**
 * Calcula estadísticas detalladas para un participante
 * @param {string} participanteId ID del participante
 * @param {Array} eventos Lista de eventos (WOGs)
 * @returns {Object} Estadísticas del participante
 */
export function calcularEstadisticasParticipante(participanteId, eventos) {
  // Inicializar estadísticas
  const stats = {
    totalWogs: 0,                // Total de WOGs asistidos
    sede: 0,                     // Veces como sede
    subsedes: {},                // Conteo por subsede
    asador: 0,                   // Veces como asador
    asadorCompartido: 0,         // Veces compartiendo asador
    compras: a0,                  // Veces haciendo compras
    comprasCompartido: 0,        // Veces compartiendo compras
    racha: 0,                    // WOGs consecutivos actuales
    rachaMaxima: 0,              // Máxima racha de WOGs consecutivos
    diasPreferidos: {},          // Día de la semana preferido
    puntosTotales: 0,            // Puntos totales acumulados
    ultimaAsistencia: null,      // Fecha de última asistencia
    primerWog: null,             // Fecha del primer WOG
    logros: []                   // Logros desbloqueados
  };
  
  // Ordenar eventos por fecha ascendente
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = a.fecha instanceof Date ? a.fecha : a.fecha.toDate();
    const fechaB = b.fecha instanceof Date ? b.fecha : b.fecha.toDate();
    return fechaA - fechaB;
  });
  
  // Variables para calcular rachas
  let rachaActual = 0;
  let ultimoWogAsistido = null;
  
  // Procesar cada evento
  eventosOrdenados.forEach(evento => {
    // Convertir fecha a objeto Date si es un Timestamp
    const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
    
    // Verificar asistencia
    const asistio = evento.asistentes.includes(participanteId);
    
    if (asistio) {
      // Incrementar contador de asistencia
      stats.totalWogs++;
      
      // Verificar primera asistencia
      if (!stats.primerWog) {
        stats.primerWog = fecha;
      }
      
      // Actualizar última asistencia
      stats.ultimaAsistencia = fecha;
      
      // Contar día de la semana
      const diaSemana = fecha.getDay();
      stats.diasPreferidos[diaSemana] = (stats.diasPreferidos[diaSemana] || 0) + 1;
      
      // Calcular racha
      if (ultimoWogAsistido) {
        // Verificar si asistió al último WOG
        const diferenciaDias = Math.round((fecha - ultimoWogAsistido) / (1000 * 60 * 60 * 24));
        
        // Si no pasaron más de 14 días entre WOGs, continuar la racha
        if (diferenciaDias <= 14) {
          rachaActual++;
        } else {
          // Reiniciar racha
          rachaActual = 1;
        }
      } else {
        // Primera asistencia
        rachaActual = 1;
      }
      
      // Actualizar racha máxima
      stats.rachaMaxima = Math.max(stats.rachaMaxima, rachaActual);
      
      // Almacenar último WOG asistido
      ultimoWogAsistido = fecha;
    }
    
    // Verificar si fue sede
    if (evento.sede === participanteId) {
      stats.sede++;
      
      // Contar subsede
      if (evento.subsede) {
        const subsede = evento.subsede.trim().toLowerCase();
        stats.subsedes[subsede] = (stats.subsedes[subsede] || 0) + 1;
      }
      
      // Sumar punto por ser sede
      stats.puntosTotales += 1;
    }
    
    // Verificar si fue asador
    if (evento.asadores.includes(participanteId)) {
      // Asador compartido o individual
      if (evento.asadores.length > 1) {
        stats.asadorCompartido++;
        stats.puntosTotales += 1 / evento.asadores.length;
      } else {
        stats.asador++;
        stats.puntosTotales += 1;
      }
    }
    
    // Verificar si hizo compras
    if (evento.comprasCompartidas && evento.comprasCompartidas.includes(participanteId)) {
      stats.comprasCompartido++;
      stats.puntosTotales += 1 / evento.comprasCompartidas.length;
    } else if (evento.compras === participanteId) {
      stats.compras++;
      stats.puntosTotales += 1;
    }
  });
  
  // Establecer racha actual
  stats.racha = rachaActual;
  
  // Calcular día preferido
  let diaMasAsistencias = -1;
  let maxAsistencias = 0;
  
  Object.entries(stats.diasPreferidos).forEach(([dia, cantidad]) => {
    if (cantidad > maxAsistencias) {
      diaMasAsistencias = parseInt(dia);
      maxAsistencias = cantidad;
    }
  });
  
  // Nombres de días
  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  stats.diaPreferido = diaMasAsistencias >= 0 ? nombresDias[diaMasAsistencias] : null;
  
  // Calcular subsede favorita
  let subsedeFavorita = null;
  let maxSubsede = 0;
  
  Object.entries(stats.subsedes).forEach(([subsede, cantidad]) => {
    if (cantidad > maxSubsede) {
      subsedeFavorita = subsede;
      maxSubsede = cantidad;
    }
  });
  
  stats.subsedeFavorita = subsedeFavorita;
  
  // Calcular logros
  calcularLogros(stats);
  
  return stats;
}

/**
 * Calcula y asigna logros basados en estadísticas
 * @param {Object} stats Estadísticas del participante
 */
function calcularLogros(stats) {
  const logros = [];
  
  // Logros de asistencia
  if (stats.totalWogs >= 10) logros.push('Asistente Dedicado');
  if (stats.totalWogs >= 20) logros.push('WOG Elite');
  if (stats.totalWogs >= 30) logros.push('Leyenda WOG');
  
  // Logros de sede
  if (stats.sede >= 3) logros.push('Anfitrión Frecuente');
  if (stats.sede >= 6) logros.push('Anfitrión de Élite');
  if (stats.sede >= 10) logros.push('Casa Abierta');
  
  // Logros de asador
  if (stats.asador >= 3) logros.push('Chef Maestro');
  if (stats.asador >= 6) logros.push('Rey de la Parrilla');
  
  // Logros de compras
  if (stats.compras >= 3) logros.push('Abastecedor Oficial');
  if (stats.compras >= 6) logros.push('Comprador Premium');
  
  // Logros de racha
  if (stats.rachaMaxima >= 3) logros.push('Racha Corta');
  if (stats.rachaMaxima >= 5) logros.push('Racha Sólida');
  if (stats.rachaMaxima >= 8) logros.push('Ultra Racha');
  
  // Logros de equilibrio
  if (stats.sede > 0 && stats.asador > 0 && stats.compras > 0) {
    logros.push('Todoterreno');
  }
  
  if (stats.sede >= 3 && stats.asador >= 3 && stats.compras >= 3) {
    logros.push('Maestro WOG');
  }
  
  // Logros especiales
  if (stats.puntosTotales >= 10) logros.push('Diez Puntos');
  if (stats.puntosTotales >= 20) logros.push('Veinte Puntos');
  if (stats.puntosTotales >= 30) logros.push('Treinta Puntos');
  
  // Asignar logros a las estadísticas
  stats.logros = logros;
}

/**
 * Calcula estadísticas generales de todos los WOGs
 * @param {Array} eventos Lista de eventos (WOGs)
 * @param {Array} participantes Lista de participantes
 * @returns {Object} Estadísticas generales
 */
export function calcularEstadisticasGenerales(eventos, participantes) {
  // Crear mapa de participantes para acceso rápido
  const participantesMap = new Map();
  participantes.forEach(p => {
    participantesMap.set(p.id, p);
  });
  
  // Inicializar estadísticas
  const stats = {
    totalWogs: eventos.length,
    wogsPromedioPorMes: 0,
    asistenciaPromedio: 0,
    subsedeMasUsada: null,
    diaMasFrecuente: null,
    participanteMasAsistencias: null,
    participanteMasSede: null,
    participanteMasAsador: null,
    participanteMasCompras: null,
    participanteMasPuntos: null
  };
  
  // Si no hay eventos, devolver estadísticas vacías
  if (eventos.length === 0) {
    return stats;
  }
  
  // Contadores
  const conteoSubsedes = {};
  const conteoDias = [0, 0, 0, 0, 0, 0, 0]; // Dom, Lun, Mar, Mié, Jue, Vie, Sáb
  const conteoAsistencia = {};
  const conteoSede = {};
  const conteoAsador = {};
  const conteoCompras = {};
  let asistenciaTotal = 0;
  
  // Ordenar eventos por fecha
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = a.fecha instanceof Date ? a.fecha : a.fecha.toDate();
    const fechaB = b.fecha instanceof Date ? b.fecha : b.fecha.toDate();
    return fechaA - fechaB;
  });
  
  // Obtener primera y última fecha
  const primeraFecha = eventosOrdenados[0].fecha instanceof Date 
    ? eventosOrdenados[0].fecha 
    : eventosOrdenados[0].fecha.toDate();
    
  const ultimaFecha = eventosOrdenados[eventosOrdenados.length - 1].fecha instanceof Date 
    ? eventosOrdenados[eventosOrdenados.length - 1].fecha 
    : eventosOrdenados[eventosOrdenados.length - 1].fecha.toDate();
  
  // Calcular duración en meses
  const mesesDuracion = (ultimaFecha.getFullYear() - primeraFecha.getFullYear()) * 12 + 
    (ultimaFecha.getMonth() - primeraFecha.getMonth());
  
  stats.wogsPromedioPorMes = mesesDuracion > 0 
    ? (eventos.length / mesesDuracion).toFixed(1) 
    : eventos.length;
  
  // Procesar cada evento
  eventos.forEach(evento => {
    // Convertir fecha a objeto Date si es un Timestamp
    const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
    
    // Contar día de la semana
    const diaSemana = fecha.getDay();
    conteoDias[diaSemana]++;
    
    // Contar subsede
    if (evento.subsede) {
      const subsede = evento.subsede.trim().toLowerCase();
      conteoSubsedes[subsede] = (conteoSubsedes[subsede] || 0) + 1;
    }
    
    // Contar asistencias
    asistenciaTotal += evento.asistentes.length;
    
    evento.asistentes.forEach(id => {
      conteoAsistencia[id] = (conteoAsistencia[id] || 0) + 1;
    });
    
    // Contar sede
    conteoSede[evento.sede] = (conteoSede[evento.sede] || 0) + 1;
    
    // Contar asador
    evento.asadores.forEach(id => {
      conteoAsador[id] = (conteoAsador[id] || 0) + (1 / evento.asadores.length);
    });
    
    // Contar compras
    if (evento.comprasCompartidas && evento.comprasCompartidas.length > 0) {
      evento.comprasCompartidas.forEach(id => {
        conteoCompras[id] = (conteoCompras[id] || 0) + (1 / evento.comprasCompartidas.length);
      });
    } else if (evento.compras) {
      conteoCompras[evento.compras] = (conteoCompras[evento.compras] || 0) + 1;
    }
  });
  
  // Calcular asistencia promedio
  stats.asistenciaPromedio = (asistenciaTotal / eventos.length).toFixed(1);
  
  // Encontrar subsede más usada
  let maxSubsede = 0;
  
  Object.entries(conteoSubsedes).forEach(([subsede, cantidad]) => {
    if (cantidad > maxSubsede) {
      stats.subsedeMasUsada = subsede;
      maxSubsede = cantidad;
    }
  });
  
  // Encontrar día más frecuente
  const indiceDiaMasFrecuente = conteoDias.indexOf(Math.max(...conteoDias));
  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  stats.diaMasFrecuente = nombresDias[indiceDiaMasFrecuente];
  
  // Encontrar participante con más asistencias
  let maxAsistencias = 0;
  
  Object.entries(conteoAsistencia).forEach(([id, cantidad]) => {
    if (cantidad > maxAsistencias) {
      const participante = participantesMap.get(id);
      if (participante) {
        stats.participanteMasAsistencias = participante.nombre;
        maxAsistencias = cantidad;
      }
    }
  });
  
  // Encontrar participante con más veces como sede
  let maxSede = 0;
  
  Object.entries(conteoSede).forEach(([id, cantidad]) => {
    if (cantidad > maxSede) {
      const participante = participantesMap.get(id);
      if (participante) {
        stats.participanteMasSede = participante.nombre;
        maxSede = cantidad;
      }
    }
  });
  
  // Encontrar participante con más veces como asador
  let maxAsador = 0;
  
  Object.entries(conteoAsador).forEach(([id, cantidad]) => {
    if (cantidad > maxAsador) {
      const participante = participantesMap.get(id);
      if (participante) {
        stats.participanteMasAsador = participante.nombre;
        maxAsador = cantidad;
      }
    }
  });
  
  // Encontrar participante con más veces haciendo compras
  let maxCompras = 0;
  
  Object.entries(conteoCompras).forEach(([id, cantidad]) => {
    if (cantidad > maxCompras) {
      const participante = participantesMap.get(id);
      if (participante) {
        stats.participanteMasCompras = participante.nombre;
        maxCompras = cantidad;
      }
    }
  });
  
  // Calcular puntos totales para cada participante
  const puntosTotales = {};
  
  // Sumar puntos por sede
  Object.entries(conteoSede).forEach(([id, cantidad]) => {
    puntosTotales[id] = (puntosTotales[id] || 0) + cantidad;
  });
  
  // Sumar puntos por asador
  Object.entries(conteoAsador).forEach(([id, cantidad]) => {
    puntosTotales[id] = (puntosTotales[id] || 0) + cantidad;
  });
  
  // Sumar puntos por compras
  Object.entries(conteoCompras).forEach(([id, cantidad]) => {
    puntosTotales[id] = (puntosTotales[id] || 0) + cantidad;
  });
  
  // Encontrar participante con más puntos
  let maxPuntos = 0;
  
  Object.entries(puntosTotales).forEach(([id, cantidad]) => {
    if (cantidad > maxPuntos) {
      const participante = participantesMap.get(id);
      if (participante) {
        stats.participanteMasPuntos = participante.nombre;
        maxPuntos = cantidad;
      }
    }
  });
  
  return stats;
}

/**
 * Genera datos para una "carta coleccionable" de un participante
 * @param {Object} participante Datos del participante
 * @param {Object} stats Estadísticas del participante
 * @returns {Object} Datos de la carta coleccionable
 */
export function generarCartaColeccionable(participante, stats) {
  // Calcular nivel según puntos totales
  const nivel = Math.floor(stats.puntosTotales / 5) + 1;
  
  // Calcular habilidades principales (del 1 al 10)
  const habilidades = {
    anfitrion: Math.min(10, Math.ceil(stats.sede * 2)),
    parrillero: Math.min(10, Math.ceil((stats.asador + stats.asadorCompartido) * 2)),
    abastecedor: Math.min(10, Math.ceil((stats.compras + stats.comprasCompartido) * 2)),
    constancia: Math.min(10, Math.ceil(stats.rachaMaxima * 1.2)),
    veterania: Math.min(10, Math.ceil(stats.totalWogs / 3))
  };
  
  // Calcular rareza (común, rara, épica, legendaria)
  let rareza = 'Común';
  
  if (nivel >= 5) rareza = 'Rara';
  if (nivel >= 10) rareza = 'Épica';
  if (nivel >= 15) rareza = 'Legendaria';
  
  // Calcular habilidad especial según logros
  let habilidadEspecial = null;
  
  if (stats.logros.includes('Maestro WOG')) {
    habilidadEspecial = 'WOG Magistral: Obtiene puntos extra en todas las categorías.';
  } else if (stats.logros.includes('Rey de la Parrilla')) {
    habilidadEspecial = 'Maestro del Fuego: Nunca falla al preparar un asado perfecto.';
  } else if (stats.logros.includes('Anfitrión de Élite')) {
    habilidadEspecial = 'Casa Acogedora: Hace que todos se sientan como en casa.';
  } else if (stats.logros.includes('Ultra Racha')) {
    habilidadEspecial = 'Asistencia Perfecta: Nunca falta a un WOG sin importar las circunstancias.';
  } else if (stats.logros.includes('Todoterreno')) {
    habilidadEspecial = 'Multitarea: Puede desempeñar cualquier rol con eficacia.';
  }
  
  return {
    nombre: participante.nombre,
    apodo: participante.apodo || participante.nombre,
    nivel,
    rareza,
    habilidades,
    logros: stats.logros,
    habilidadEspecial,
    fecha: new Date().toISOString()
  };
}
