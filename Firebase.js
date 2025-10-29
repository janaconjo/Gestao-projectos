// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb3iHNzRHaO6QrXkBxshWdFRwgIQ2fuXQ",
  authDomain: "gestao-projectos.firebaseapp.com",
  projectId: "gestao-projectos",
  storageBucket: "gestao-projectos.appspot.com",
  messagingSenderId: "878240925167",
  appId: "1:878240925167:web:25eda532fccefac0d5e21a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
