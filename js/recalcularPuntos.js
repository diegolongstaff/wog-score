
// recalcularPuntos.js
async function recalcularPuntos() {
  const participantesSnapshot = await db.collection("participantes").get();
  const wogsSnapshot = await db.collection("wogs").get();

  const puntajes = {};

  participantesSnapshot.forEach(doc => {
    const id = doc.id;
    puntajes[id] = {
      puntos_sede: 0,
      puntos_asador: 0,
      puntos_compras: 0,
      puntos_asistencia: 0,
    };
  });

  wogsSnapshot.forEach(doc => {
    const data = doc.data();
    const { sede, asadores = [], compras = [], asistentes = [] } = data;

    if (sede && puntajes[sede]) puntajes[sede].puntos_sede += 10;

    const puntosAsador = asadores.length ? 5 / asadores.length : 0;
    asadores.forEach(id => {
      if (puntajes[id]) puntajes[id].puntos_asador += puntosAsador;
    });

    const puntosCompra = compras.length ? 7 / compras.length : 0;
    compras.forEach(id => {
      if (puntajes[id]) puntajes[id].puntos_compras += puntosCompra;
    });

    asistentes.forEach(id => {
      if (puntajes[id]) puntajes[id].puntos_asistencia += 1;
    });
  });

  for (const id in puntajes) {
    const puntos = puntajes[id];
    const puntos_total = puntos.puntos_sede + puntos.puntos_asador + puntos.puntos_compras + puntos.puntos_asistencia;
    await db.collection("participantes").doc(id).update({
      ...puntos,
      puntos_total: Math.round(puntos_total * 100) / 100,
      fecha_actualizacion: new Date()
    });
  }

  alert("Puntajes recalculados y actualizados.");
}
