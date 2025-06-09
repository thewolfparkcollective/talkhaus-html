// Initialize Firebase (use your same config as before)
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
const db = firebase.firestore();

// Redirect to login if not signed in
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadFeed(user);
    document.getElementById('logout-btn').onclick = () => {
      auth.signOut();
    };
    document.getElementById('post-form').onsubmit = (e) => submitPost(e, user);
  }
});

// Create post
function submitPost(event, user) {
  event.preventDefault();
  const content = document.getElementById('post-content').value.trim();
  if (!content) return;
  db.collection('posts').add({
    uid: user.uid,
    author: user.displayName || user.email,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById('post-content').value = '';
  });
}

// Load posts from Firestore in real time
function loadFeed(user) {
  // For demo: show all posts. 
  // For real moots: filter posts by moots' uids. (You'd need to store a "moots" array per user in Firestore.)
  db.collection('posts').orderBy('timestamp', 'desc').limit(50)
    .onSnapshot(snapshot => {
      const feed = document.getElementById('feed');
      feed.innerHTML = '';
      snapshot.forEach(doc => {
        const post = doc.data();
        const time = post.timestamp?.toDate?.().toLocaleString() || '';
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
          <div>
            <span class="post-author">${post.author}</span>
            <span class="post-time">${time}</span>
          </div>
          <div>${escapeHtml(post.content)}</div>
        `;
        feed.appendChild(postDiv);
      });
    });
}

// Basic escape to prevent XSS
function escapeHtml(txt) {
  return txt.replace(/[<>&'"]/g, c =>
    ({'<':'&lt;','>':'&gt;','&':'&amp;','\'':'&#39;','"':'&quot;'}[c])
  );
}
