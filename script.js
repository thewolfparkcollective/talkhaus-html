// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfGu-YnzsXom4gpC4PcWIsRyhiTaMEnyc",
  authDomain: "talk-haus-html.firebaseapp.com",
  projectId: "talk-haus-html",
  storageBucket: "talk-haus-html.firebasestorage.app",
  messagingSenderId: "16857081329",
  appId: "1:16857081329:web:705390c8f02eee9b871050",
  measurementId: "G-7GB96042PB"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// DOM elements
const signUpBtn = document.getElementById('signUpBtn');
const logInBtn = document.getElementById('logInBtn');
const modal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const googleAuthBtn = document.getElementById('google-auth-btn');

// Modal logic
function openModal(mode) {
  modal.style.display = 'flex';
  modalTitle.textContent = mode === 'signup' ? 'Sign Up' : 'Log In';
  authForm.setAttribute('data-mode', mode);
  authError.textContent = '';
}
function closeModal() {
  modal.style.display = 'none';
}
signUpBtn.onclick = () => openModal('signup');
logInBtn.onclick = () => openModal('login');
window.closeModal = closeModal; // so close button in modal works

// Email/Password Sign Up or Log In
authForm.onsubmit = function(event) {
  event.preventDefault();
  const mode = authForm.getAttribute('data-mode');
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  authError.textContent = '';

  if (mode === 'signup') {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signup successful, redirect to home
        window.location.href = 'home.html';
      })
      .catch((error) => {
        authError.textContent = error.message;
      });
  } else {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Login successful, redirect to home
        window.location.href = 'home.html';
      })
      .catch((error) => {
        authError.textContent = error.message;
      });
  }
};

// Google Auth
googleAuthBtn.onclick = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      // Google Auth successful, redirect to home
      window.location.href = 'home.html';
    })
    .catch((error) => {
      authError.textContent = error.message;
    });
};

// Newsletter stub
function subscribeNewsletter(event) {
  event.preventDefault();
  const emailInput = document.getElementById('email');
  if (emailInput.value) {
    alert('Thank you for subscribing, ' + emailInput.value + '!');
    emailInput.value = '';
  }
}
window.subscribeNewsletter = subscribeNewsletter;
