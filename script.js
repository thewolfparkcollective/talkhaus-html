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

// Open modal
signUpBtn.onclick = () => {
  modalTitle.textContent = "Sign Up";
  authModal.style.display = "flex";
};
logInBtn.onclick = () => {
  modalTitle.textContent = "Log In";
  authModal.style.display = "flex";
};

// Google Auth (placeholder)
googleBtn.onclick = googleBtnModal.onclick = () => {
  // Replace with Firebase Google auth logic
  alert("Google sign-in coming soon!");
};

// Modal close logic
function closeModal() { authModal.style.display = "none"; }
window.closeModal = closeModal;
authModal.onclick = e => { if (e.target === authModal) closeModal(); };
document.addEventListener('keydown', e => { if (e.key === "Escape") closeModal(); });

// Auth form (placeholder)
if(authForm) {
  authForm.onsubmit = e => {
    e.preventDefault();
    // Replace with Firebase email/password logic
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    authError.textContent = "Demo only. Connect to Firebase for real auth.";
    // On real: signInWithEmailAndPassword or createUserWithEmailAndPassword
  };
}

// Newsletter subscribe (placeholder)
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
