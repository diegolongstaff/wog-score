// Configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY", // Reemplazar con tus datos
  authDomain: "wog-score.firebaseapp.com",
  projectId: "wog-score",
  storageBucket: "wog-score.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancias de servicios
const db = firebase.firestore();
const storage = firebase.storage();

// Habilitar persistencia offline para que la app funcione sin conexión
db.enablePersistence()
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('La persistencia no pudo habilitarse: múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('La persistencia no está disponible en este navegador');
    }
  });

// Nombres de colecciones en Firestore
const COLECCION_PARTICIPANTES = 'participantes';
const COLECCION_WOGS = 'wogs';
