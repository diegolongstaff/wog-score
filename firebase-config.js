// Configuración de Firebase
// Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAfpElcUa7MhOmdb6n2R4sw2CVv3usvHKk",
  authDomain: "wog-score.firebaseapp.com",
  projectId: "wog-score",
  storageBucket: "wog-score.firebasestorage.app",
  messagingSenderId: "44020602488",
  appId: "1:44020602488:web:90e29d117bfc74e164ff8d",
  measurementId: "G-GRZX39NEEZ"};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias globales a servicios de Firebase
const db = firebase.firestore();
const auth = firebase.auth();

// Habilitar persistencia offline para que la aplicación funcione sin conexión
db.enablePersistence()
  .catch(err => {
    if (err.code === 'failed-precondition') {
      // Múltiples pestañas abiertas, la persistencia solo puede habilitarse en una
      console.warn('La persistencia no pudo habilitarse: múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
      // El navegador actual no soporta las características requeridas
      console.warn('La persistencia no está disponible en este navegador');
    }
  });

// Exportar para uso en otros módulos
export { db, auth };
