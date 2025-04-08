// Módulo para gestionar el sistema de puntuación de los WOGs

// Constantes para valores de puntos
const PUNTOS_POR_SEDE = 1;
const PUNTOS_POR_ASADOR = 1;
const PUNTOS_POR_COMPRAS = 1;
const PUNTOS_POR_ASISTENCIA = 0.5;

// Inicializar módulo
function initPuntuacionModule() {
    console.log('Inicializando módulo de puntuación...');
    
    // Escuchar eventos de wogs agregados o eliminados
    document.addEventListener('wogActualizado', verificarMigracion);
    
    // Verificar migración al inicio
    verificarMigracion();
    
    console.log('Módulo de puntuación inicializado correctamente');
}

// Verificar si es necesario migrar los datos
async function verificarMigracion() {
    try {
        // Verificar si hay participantes sin puntos de asistencia
        const snapshot = await db.collection('participantes')
            .where('puntos_asistencia', '==', null)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            console.log('Iniciando migración de puntos de asistencia...');
            await inicializarPuntosAsistencia();
        }
    } catch (error) {
        console.error('Error al verificar migración:', error);
    }
}

// Inicializar puntos de asistencia para todos los participantes
async function inicializarPuntosAsistencia() {
    try {
        // 1. Obtener todos los participantes
        const participantesSnapshot = await db.collection('participantes').get();
        const participantes = participantesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 2. Obtener todos los WOGs
        const wogsSnapshot = await db.collection('wogs').get();
        const wogs = wogsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 3. Calcular puntos de asistencia para cada participante
        for (const participante of participantes) {
            let puntosAsistencia = 0;
            
            // Contar asistencias
            for (const wog of wogs) {
                if (wog.asistentes && wog.asistentes.includes(participante.id)) {
                    puntosAsistencia += PUNTOS_POR_ASISTENCIA;
                }
            }
            
            // Actualizar participante
            await db.collection('participantes').doc(participante.id).update({
                puntos_asistencia: puntosAsistencia
            });
        }
        
        console.log('Migración de puntos de asistencia completada');
        
    } catch (error) {
        console.error('Error al inicializar puntos de asistencia:', error);
    }
}

// Actualizar puntuaciones cuando se crea un nuevo WOG
async function actualizarPuntuaciones(wogData) {
    try {
        // 1. Actualizar puntos por sede (1 punto)
        if (wogData.sede) {
            const sedeRef = db.collection('participantes').doc(wogData.sede);
            await sedeRef.update({
                puntos_sede: firebase.firestore.FieldValue.increment(PUNTOS_POR_SEDE)
            });
        }
        
        // 2. Actualizar puntos por asador (1 punto dividido entre todos los asadores)
        if (wogData.asadores && wogData.asadores.length > 0) {
            const puntoPorAsador = PUNTOS_POR_ASADOR / wogData.asadores.length;
            
            for (const asadorId of wogData.asadores) {
                const asadorRef = db.collection('participantes').doc(asadorId);
                await asadorRef.update({
                    puntos_asador: firebase.firestore.FieldValue.increment(puntoPorAsador)
                });
            }
        }
        
        // 3. Actualizar puntos por compras (1 punto)
        if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
            const puntoPorCompra = PUNTOS_POR_COMPRAS / wogData.comprasCompartidas.length;
            
            for (const compraId of wogData.comprasCompartidas) {
                const compraRef = db.collection('participantes').doc(compraId);
                await compraRef.update({
                    puntos_compras: firebase.firestore.FieldValue.increment(puntoPorCompra)
                });
            }
        } else if (wogData.compras) {
            const compraRef = db.collection('participantes').doc(wogData.compras);
            await compraRef.update({
                puntos_compras: firebase.firestore.FieldValue.increment(PUNTOS_POR_COMPRAS)
            });
        }
        
        // 4. Actualizar puntos por asistencia (0.5 puntos por persona)
        if (wogData.asistentes && wogData.asistentes.length > 0) {
            for (const asistenteId of wogData.asistentes) {
                const asistenteRef = db.collection('participantes').doc(asistenteId);
                await asistenteRef.update({
                    puntos_asistencia: firebase.firestore.FieldValue.increment(PUNTOS_POR_ASISTENCIA)
                });
            }
        }
    } catch (error) {
        console.error('Error al actualizar puntuaciones:', error);
        // Este error no debería detener el proceso de guardar el WOG
    }
}

// Restar puntuaciones cuando se elimina un WOG
async function restarPuntuaciones(wogData) {
    try {
        // 1. Restar puntos por sede
        if (wogData.sede) {
            const sedeRef = db.collection('participantes').doc(wogData.sede);
            const sedeDoc = await sedeRef.get();
            
            if (sedeDoc.exists) {
                const puntosSede = sedeDoc.data().puntos_sede || 0;
                await sedeRef.update({
                    puntos_sede: Math.max(0, puntosSede - PUNTOS_POR_SEDE)
                });
            }
        }
        
        // 2. Restar puntos por asador
        if (wogData.asadores && wogData.asadores.length > 0) {
            const puntoPorAsador = PUNTOS_POR_ASADOR / wogData.asadores.length;
            
            for (const asadorId of wogData.asadores) {
                const asadorRef = db.collection('participantes').doc(asadorId);
                const asadorDoc = await asadorRef.get();
                
                if (asadorDoc.exists) {
                    const puntosAsador = asadorDoc.data().puntos_asador || 0;
                    await asadorRef.update({
                        puntos_asador: Math.max(0, puntosAsador - puntoPorAsador)
                    });
                }
            }
        }
        
        // 3. Restar puntos por compras
        if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
            const puntoPorCompra = PUNTOS_POR_COMPRAS / wogData.comprasCompartidas.length;
            
            for (const compraId of wogData.comprasCompartidas) {
                const compraRef = db.collection('participantes').doc(compraId);
                const compraDoc = await compraRef.get();
                
                if (compraDoc.exists) {
                    const puntosCompras = compraDoc.data().puntos_compras || 0;
                    await compraRef.update({
                        puntos_compras: Math.max(0, puntosCompras - puntoPorCompra)
                    });
                }
            }
        } else if (wogData.compras) {
            const compraRef = db.collection('participantes').doc(wogData.compras);
            const compraDoc = await compraRef.get();
            
            if (compraDoc.exists) {
                const puntosCompras = compraDoc.data().puntos_compras || 0;
                await compraRef.update({
                    puntos_compras: Math.max(0, puntosCompras - PUNTOS_POR_COMPRAS)
                });
            }
        }
        
        // 4. Restar puntos por asistencia
        if (wogData.asistentes && wogData.asistentes.length > 0) {
            for (const asistenteId of wogData.asistentes) {
                const asistenteRef = db.collection('participantes').doc(asistenteId);
                const asistenteDoc = await asistenteRef.get();
                
                if (asistenteDoc.exists) {
                    const puntosAsistencia = asistenteDoc.data().puntos_asistencia || 0;
                    await asistenteRef.update({
                        puntos_asistencia: Math.max(0, puntosAsistencia - PUNTOS_POR_ASISTENCIA)
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error al restar puntuaciones:', error);
        throw error;
    }
}

// Exportar funciones necesarias
window.actualizarPuntuaciones = actualizarPuntuaciones;
window.restarPuntuaciones = restarPuntuaciones;
window.initPuntuacionModule = initPuntuacionModule;