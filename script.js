// Firebase config (replace with your own if different)
const firebaseConfig = {
  apiKey: "AIzaSyDfGu-YnzsXom4gpC4PcWIsRyhiTaMEnyc",
  authDomain: "talk-haus-html.firebaseapp.com",
  projectId: "talk-haus-html",
  storageBucket: "talk-haus-html.firebasestorage.app",
  messagingSenderId: "16857081329",
  appId: "1:16857081329:web:705390c8f02eee9b871050",
  measurementId: "G-7GB96042PB"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

// Modal logic for sign up / log in
const signUpBtn = document.getElementById('signUpBtn');
const logInBtn = document.getElementById('logInBtn');
const googleBtn = document.getElementById('google-auth-btn');
const googleBtnModal = document.getElementById('google-auth-btn-modal');
const authModal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const newsletterForm = document.getElementById('newsletter-form');

let authMode = "signup"; // or "login"

// Open modal
signUpBtn.onclick = () => {
  modalTitle.textContent = "Sign Up";
  authMode = "signup";
  authError.textContent = "";
  authModal.style.display = "flex";
};
logInBtn.onclick = () => {
  modalTitle.textContent = "Log In";
  authMode = "login";
  authError.textContent = "";
  authModal.style.display = "flex";
};

// Google Auth (Firebase)
googleBtn.onclick = googleBtnModal.onclick = async () => {
  authError.textContent = "";
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
    window.location = "home.html";
  } catch (e) {
    authError.textContent = e.message;
  }
};

// Modal close logic
function closeModal() { authModal.style.display = "none"; }
window.closeModal = closeModal;
authModal.onclick = e => { if (e.target === authModal) closeModal(); };
document.addEventListener('keydown', e => { if (e.key === "Escape") closeModal(); });

// Auth form (Firebase email/password)
if(authForm) {
  authForm.onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    authError.textContent = "";
    try {
      if(authMode === "signup") {
        await auth.createUserWithEmailAndPassword(email, password);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
      window.location = "home.html";
    } catch (err) {
      authError.textContent = err.message;
    }
  };
}

// Newsletter subscribe (demo only)
if(newsletterForm){
  newsletterForm.onsubmit = function(e){
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    if(email){
      alert("Subscribed: " + email + " (demo only)");
      document.getElementById('email').value = "";
    }
  };
}

// Redirect if already signed in
auth.onAuthStateChanged(user => {
  if (user) window.location = "home.html";
});
