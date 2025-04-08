// Función para inicializar puntos de asistencia a participantes existentes
async function inicializarPuntosAsistencia() {
    try {
        console.log('Inicializando puntos de asistencia para participantes existentes...');
        
        // Obtener todos los participantes
        const snapshot = await db.collection(COLECCION_PARTICIPANTES).get();
        
        // Verificar si hay participantes
        if (snapshot.empty) {
            console.log('No hay participantes para actualizar');
            return;
        }
        
        // Actualizar cada participante que no tenga el campo puntos_asistencia
        let contadorActualizados = 0;
        
        // 1. Primero, para cada participante, verificamos si tienen el campo
        const actualizaciones = [];
        
        snapshot.docs.forEach(doc => {
            const participante = doc.data();
            
            // Si no tiene el campo puntos_asistencia, lo añadimos con valor 0
            if (typeof participante.puntos_asistencia === 'undefined') {
                const participanteRef = db.collection(COLECCION_PARTICIPANTES).doc(doc.id);
                actualizaciones.push(
                    participanteRef.update({
                        puntos_asistencia: 0
                    })
                );
                contadorActualizados++;
            }
        });
        
        // 2. Ejecutar todas las actualizaciones
        if (actualizaciones.length > 0) {
            await Promise.all(actualizaciones);
            console.log(`Se actualizaron ${contadorActualizados} participantes con puntos de asistencia inicializados`);
            mostrarToast(`Se actualizaron ${contadorActualizados} participantes`);
        } else {
            console.log('Todos los participantes ya tienen puntos de asistencia inicializados');
        }
        
        // 3. Ahora, para cada WOG, actualizamos los puntos de asistencia de los participantes
        console.log('Recalculando puntos de asistencia basados en asistencias pasadas...');
        
        // Obtener todos los WOGs
        const wogsSnapshot = await db.collection(COLECCION_WOGS).get();
        
        if (wogsSnapshot.empty) {
            console.log('No hay WOGs para procesar');
            return;
        }
        
        // Crear mapa para rastrear puntos por participante
        const puntosAsistencia = {};
        
        // Procesar cada WOG
        wogsSnapshot.docs.forEach(doc => {
            const wog = doc.data();
            
            // Si tiene asistentes, sumamos puntos para cada uno
            if (wog.asistentes && wog.asistentes.length > 0) {
                wog.asistentes.forEach(asistenteId => {
                    if (!puntosAsistencia[asistenteId]) {
                        puntosAsistencia[asistenteId] = 0;
                    }
                    puntosAsistencia[asistenteId] += PUNTOS_ASISTENCIA;
                });
            }
        });
        
        // Actualizar puntos de asistencia para cada participante
        const actualizacionesAsistencia = [];
        
        for (const [participanteId, puntos] of Object.entries(puntosAsistencia)) {
            const participanteRef = db.collection(COLECCION_PARTICIPANTES).doc(participanteId);
            actualizacionesAsistencia.push(
                participanteRef.update({
                    puntos_asistencia: puntos
                })
            );
        }
        
        // Ejecutar todas las actualizaciones de asistencia
        if (actualizacionesAsistencia.length > 0) {
            await Promise.all(actualizacionesAsistencia);
            console.log(`Se actualizaron puntos de asistencia para ${actualizacionesAsistencia.length} participantes`);
            mostrarToast(`Se recalcularon puntos de asistencia para ${actualizacionesAsistencia.length} participantes`);
        }
        
        // Disparar evento para actualizar la interfaz
        document.dispatchEvent(new CustomEvent('participantesActualizados'));
        
    } catch (error) {
        console.error('Error al inicializar puntos de asistencia:', error);
        mostrarToast('Error al actualizar puntos de asistencia', true);
    }
}
