// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDfGu-YnzsXom4gpC4PcWIsRyhiTaMEnyc",
  authDomain: "talk-haus-html.firebaseapp.com",
  projectId: "talk-haus-html",
  storageBucket: "talk-haus-html.appspot.com",
  messagingSenderId: "16857081329",
  appId: "1:16857081329:web:705390c8f02eee9b871050",
  measurementId: "G-7GB96042PB"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Modal logic
function showAuthModal(action) {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = action;
  document.getElementById('auth-form').dataset.action = action;
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-password').value = '';
}
function closeModal() {
  document.getElementById('auth-modal').style.display = 'none';
}
document.getElementById('signUpBtn').onclick = function() { showAuthModal('Sign Up'); };
document.getElementById('logInBtn').onclick = function() { showAuthModal('Log In'); };

// Auth form submit
function submitAuthForm(event) {
  event.preventDefault();
  const action = event.target.dataset.action;
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errorDiv = document.getElementById('auth-error');

  if (action === 'Sign Up') {
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        errorDiv.style.color = 'green';
        errorDiv.textContent = "Sign up successful!";
        setTimeout(closeModal, 1200);
      })
      .catch(e => {
        errorDiv.style.color = 'red';
        errorDiv.textContent = e.message;
      });
  } else {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        errorDiv.style.color = 'green';
        errorDiv.textContent = "Logged in!";
        setTimeout(closeModal, 1200);
      })
      .catch(e => {
        errorDiv.style.color = 'red';
        errorDiv.textContent = e.message;
      });
  }
}

// Google Auth
document.getElementById('google-auth-btn').onclick = function() {
  const errorDiv = document.getElementById('auth-error');
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      errorDiv.style.color = 'green';
      errorDiv.textContent = "Signed in with Google!";
      setTimeout(closeModal, 1200);
    })
    .catch(e => {
      errorDiv.style.color = 'red';
      errorDiv.textContent = e.message;
    });
};

// Newsletter subscription logic
function subscribeNewsletter(event) {
  event.preventDefault();
  const emailInput = document.getElementById('email');
  if (emailInput.value) {
    alert('Thank you for subscribing, ' + emailInput.value + '!');
    emailInput.value = '';
  }
}

// Update the tagline if the user is logged in
auth.onAuthStateChanged(user => {
  const tagline = document.querySelector('.tagline');
  if (user) {
    tagline.textContent = `Welcome, ${user.displayName || user.email}!`;
  } else {
    tagline.textContent = 'Where conversations feel like home.';
  }
});

// Optional: Close modal when clicking outside modal content
window.onclick = function(event) {
  const modal = document.getElementById('auth-modal');
  if (event.target === modal) {
    closeModal();
  }
};
