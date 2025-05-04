// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAfpElcUa7MhOmdb6n2R4sw2CVv3usvHKk",
  authDomain: "wog-score.firebaseapp.com",
  projectId: "wog-score",
  storageBucket: "wog-score.appspot.com",
  messagingSenderId: "44020602488",
  appId: "1:44020602488:web:90e29d117bfc74e164ff8d",
  measurementId: "G-GRZX39NEEZ"
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

// Puntuaciones para los distintos roles
const PUNTOS = {
  SEDE: 10,
  COMPRAS: 7,
  ASADOR: 5,
  ASISTENCIA: 1
};