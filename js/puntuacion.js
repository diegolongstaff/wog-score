// Módulo para manejar el sistema de puntuación de WOG

// Constantes de puntuación - puedes ajustar estos valores
const PUNTOS_SEDE = 10;      // Puntos por ser sede
const PUNTOS_ASADOR = 5;    // Puntos totales a repartir entre asadores
const PUNTOS_COMPRAS = 7;   // Puntos totales a repartir entre los que compran
const PUNTOS_ASISTENCIA = 1;  // Puntos por asistir (nuevo)

// Actualizar puntuaciones de participantes cuando se crea un nuevo WOG
async function actualizarPuntuaciones(wogData) {
    try {
        // Array para almacenar las operaciones de actualización
        const actualizaciones = [];
        
        // 1. Actualizar puntos por sede (PUNTOS_SEDE puntos)
        if (wogData.sede) {
            const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.sede);
            actualizaciones.push(
                sedeRef.update({
                    puntos_sede: firebase.firestore.FieldValue.increment(PUNTOS_SEDE)
                })
            );
        }
        
        // 2. Actualizar puntos por asador (PUNTOS_ASADOR dividido entre todos los asadores)
        if (wogData.asadores && wogData.asadores.length > 0) {
            const puntoPorAsador = PUNTOS_ASADOR / wogData.asadores.length;
            
            for (const asadorId of wogData.asadores) {
                const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                actualizaciones.push(
                    asadorRef.update({
                        puntos_asador: firebase.firestore.FieldValue.increment(puntoPorAsador)
                    })
                );
            }
        }
        
        // 3. Actualizar puntos por compras (PUNTOS_COMPRAS dividido entre todos los que compran)
        if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
            const puntoPorCompra = PUNTOS_COMPRAS / wogData.comprasCompartidas.length;
            
            for (const compraId of wogData.comprasCompartidas) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                actualizaciones.push(
                    compraRef.update({
                        puntos_compras: firebase.firestore.FieldValue.increment(puntoPorCompra)
                    })
                );
            }
        } else if (wogData.compras) {
            const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras);
            actualizaciones.push(
                compraRef.update({
                    puntos_compras: firebase.firestore.FieldValue.increment(PUNTOS_COMPRAS)
                })
            );
        }
        
        // 4. NUEVO: Actualizar puntos por asistencia para todos los asistentes
        if (wogData.asistentes && wogData.asistentes.length > 0) {
            for (const asistenteId of wogData.asistentes) {
                const asistenteRef = db.collection(COLECCION_PARTICIPANTES).doc(asistenteId);
                
                // Si no existe el campo puntos_asistencia, lo creamos
                const asistenteDoc = await asistenteRef.get();
                if (asistenteDoc.exists) {
                    const datosAsistente = asistenteDoc.data();
                    
                    // Si el campo no existe, primero lo inicializamos
                    if (typeof datosAsistente.puntos_asistencia === 'undefined') {
                        await asistenteRef.update({
                            puntos_asistencia: 0
                        });
                    }
                    
                    // Luego actualizamos
                    actualizaciones.push(
                        asistenteRef.update({
                            puntos_asistencia: firebase.firestore.FieldValue.increment(PUNTOS_ASISTENCIA)
                        })
                    );
                }
            }
        }
        
        // Ejecutar todas las actualizaciones
        await Promise.all(actualizaciones);
        console.log('Puntuaciones actualizadas correctamente');
        
    } catch (error) {
        console.error('Error al actualizar puntuaciones:', error);
        throw error; // Relanzar el error para manejarlo en la función que llama
    }
}

// Restar puntuaciones cuando se elimina un WOG
async function restarPuntuaciones(wogData) {
    try {
        return await db.runTransaction(async transaction => {
            // 1. Restar puntos por sede
            if (wogData.sede) {
                const sedeRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.sede);
                const sedeDoc = await transaction.get(sedeRef);
                
                if (sedeDoc.exists) {
                    const puntosSede = sedeDoc.data().puntos_sede || 0;
                    transaction.update(sedeRef, {
                        puntos_sede: Math.max(0, puntosSede - PUNTOS_SEDE)
                    });
                }
            }
            
            // 2. Restar puntos por asador
            if (wogData.asadores && wogData.asadores.length > 0) {
                const puntoPorAsador = PUNTOS_ASADOR / wogData.asadores.length;
                
                for (const asadorId of wogData.asadores) {
                    const asadorRef = db.collection(COLECCION_PARTICIPANTES).doc(asadorId);
                    const asadorDoc = await transaction.get(asadorRef);
                    
                    if (asadorDoc.exists) {
                        const puntosAsador = asadorDoc.data().puntos_asador || 0;
                        transaction.update(asadorRef, {
                            puntos_asador: Math.max(0, puntosAsador - puntoPorAsador)
                        });
                    }
                }
            }
            
            // 3. Restar puntos por compras
            if (wogData.comprasCompartidas && wogData.comprasCompartidas.length > 0) {
                const puntoPorCompra = PUNTOS_COMPRAS / wogData.comprasCompartidas.length;
                
                for (const compraId of wogData.comprasCompartidas) {
                    const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(compraId);
                    const compraDoc = await transaction.get(compraRef);
                    
                    if (compraDoc.exists) {
                        const puntosCompras = compraDoc.data().puntos_compras || 0;
                        transaction.update(compraRef, {
                            puntos_compras: Math.max(0, puntosCompras - puntoPorCompra)
                        });
                    }
                }
            } else if (wogData.compras) {
                const compraRef = db.collection(COLECCION_PARTICIPANTES).doc(wogData.compras);
                const compraDoc = await transaction.get(compraRef);
                
                if (compraDoc.exists) {
                    const puntosCompras = compraDoc.data().puntos_compras || 0;
                    transaction.update(compraRef, {
                        puntos_compras: Math.max(0, puntosCompras - PUNTOS_COMPRAS)
                    });
                }
            }
            
            // 4. NUEVO: Restar puntos por asistencia
            if (wogData.asistentes && wogData.asistentes.length > 0) {
                for (const asistenteId of wogData.asistentes) {
                    const asistenteRef = db.collection(COLECCION_PARTICIPANTES).doc(asistenteId);
                    const asistenteDoc = await transaction.get(asistenteRef);
                    
                    if (asistenteDoc.exists && asistenteDoc.data().puntos_asistencia !== undefined) {
                        const puntosAsistencia = asistenteDoc.data().puntos_asistencia || 0;
                        transaction.update(asistenteRef, {
                            puntos_asistencia: Math.max(0, puntosAsistencia - PUNTOS_ASISTENCIA)
                        });
                    }
                }
            }
            
            return true; // Retornar éxito
        });
        
    } catch (error) {
        console.error('Error al restar puntuaciones:', error);
        throw error;
    }
}

// Calcular puntos totales
function calcularPuntosTotales(participante) {
    return (participante.puntos_sede || 0) + 
           (participante.puntos_asador || 0) + 
           (participante.puntos_compras || 0) +
           (participante.puntos_asistencia || 0); // Incluir los nuevos puntos por asistencia
}

// Exportar funciones y constantes
window.actualizarPuntuaciones = actualizarPuntuaciones;
window.restarPuntuaciones = restarPuntuaciones;
window.calcularPuntosTotales = calcularPuntosTotales;
window.PUNTOS_SEDE = PUNTOS_SEDE;
window.PUNTOS_ASADOR = PUNTOS_ASADOR;
window.PUNTOS_COMPRAS = PUNTOS_COMPRAS;
window.PUNTOS_ASISTENCIA = PUNTOS_ASISTENCIA;
window.inicializarPuntosAsistencia = inicializarPuntosAsistencia;
