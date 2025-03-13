# Resumen del proyecto WOG Score

WOG Score es una aplicación web que permite gestionar los encuentros semanales "Martes WOG", registrando participantes, sedes, asadores, compras y notas de cada evento. La aplicación incluye un sistema de puntuación y estadísticas.

## Tecnologías utilizadas
- HTML, CSS y JavaScript puro (sin frameworks)
- Firebase (Firestore para la base de datos y Storage para imágenes)
- Estilo retro inspirado en los años 60

## Estructura del proyecto
- **index.html**: Interfaz principal con pestañas (Inicio, Nuevo WOG, Ranking, Historial, Participantes)
- **css/style.css**: Estilos visuales con tema retro
- **js/config.js**: Configuración de Firebase
- **js/app.js**: Funciones principales y manejo de pestañas
- **js/participantes.js**: Gestión de participantes (CRUD)
- **js/wog.js**: Creación y gestión de eventos WOG
- **js/ranking.js**: Visualización del ranking de participantes
- **js/historial.js**: Visualización del historial de WOGs (reemplazado por funcionalidad en app.js)

## Principales funcionalidades
1. **Gestión de participantes** con imágenes de perfil
2. **Registro de eventos WOG** con asignación de sede, asadores, compras y notas
3. **Sistema de puntuación** basado en roles (sede, asador, compras)
4. **Visualización de ranking** con estadísticas detalladas
5. **Historial de WOGs** con capacidad para ver notas y eliminar registros

## Problemas solucionados
1. **Subida de imágenes** mejorada con compresión y manejo de errores
2. **Visualización del historial** implementado directamente en app.js para mayor confiabilidad
3. **Gestión de notas** para cada WOG

## Estructura de datos
- **participantes**: Colección con documentos para cada participante
- **wogs**: Colección con documentos para cada evento WOG

## Repositorio y Demo
- **Repositorio GitHub**: [https://github.com/diegolongstaff/wog-score](https://github.com/diegolongstaff/wog-score)
- **Demo en vivo**: [https://diegolongstaff.github.io/wog-score/](https://diegolongstaff.github.io/wog-score/)

La aplicación está publicada en GitHub Pages y utiliza un diseño responsive para funcionar en dispositivos móviles y de escritorio.
