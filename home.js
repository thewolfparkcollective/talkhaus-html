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

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const postForm = document.getElementById('post-form');
const postContent = document.getElementById('post-content');
const feedDiv = document.getElementById('feed');

// Check authentication state
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = 'index.html';
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Post submission
if (postForm) {
  postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = postContent.value.trim();
    if (content === "") return;
    const user = auth.currentUser;
    if (!user) return;
    db.collection('posts').add({
      author: user.email,
      authorUid: user.uid,
      content: content,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      postContent.value = '';
    });
  });
}

// Listen for posts (simple feed: all posts, newest first)
db.collection('posts')
  .orderBy('timestamp', 'desc')
  .onSnapshot((snapshot) => {
    feedDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const post = doc.data();
      const date = post.timestamp ? post.timestamp.toDate() : new Date();
      const postElem = document.createElement('div');
      postElem.className = 'post';
      postElem.innerHTML = `
        <span class="post-author">${post.author || "Anonymous"}</span>
        <span class="post-time">${date.toLocaleString()}</span>
        <div>${post.content ? post.content.replace(/\n/g, '<br>') : ""}</div>
      `;
      feedDiv.appendChild(postElem);
    });
  });
