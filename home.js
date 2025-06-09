// Firebase config
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
const db = firebase.firestore();

let currentUser = null;
let currentTab = "home";
let currentProfile = {displayName: '', photoURL: ''};
let notifications = [];

const feed = document.getElementById('feed');
const postForm = document.getElementById('post-form');
const postContent = document.getElementById('post-content');
const logoutBtn = document.getElementById('logout-btn');
const feedTitle = document.getElementById('feed-title');
const sidebarHome = document.getElementById('sidebar-home');
const sidebarExplore = document.getElementById('sidebar-explore');
const sidebarNotifications = document.getElementById('sidebar-notifications');
const sidebarProfile = document.getElementById('sidebar-profile');
const sidebarThemeToggle = document.getElementById('sidebar-theme-toggle');
const themeText = document.getElementById('theme-text');
const profilePreview = document.getElementById('profile-preview');
const profileAvatar = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const modalBg = document.getElementById('modal-bg');
const commentModal = document.getElementById('comment-modal');
const modalPostContent = document.getElementById('modal-post-content');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-form');
const profileDisplayName = document.getElementById('profile-displayname');
const profilePhoto = document.getElementById('profile-photo');

// THEME
let theme = localStorage.getItem('theme') || 'light';
setTheme(theme);
sidebarThemeToggle.onclick = () => {
  theme = (theme === 'light') ? 'dark' : 'light';
  setTheme(theme);
};
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  themeText.textContent = (t === 'dark') ? "Dark Mode" : "Light Mode";
}

// AUTH + PROFILE
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  // Get or create user profile
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists) {
    let defaultAvatar = user.photoURL || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(user.displayName||user.email)}`;
    await db.collection('users').doc(user.uid).set({
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: defaultAvatar,
      email: user.email,
      created: firebase.firestore.FieldValue.serverTimestamp()
    });
    currentProfile = {displayName: user.displayName || user.email.split('@')[0], photoURL: defaultAvatar};
  } else {
    currentProfile = userDoc.data();
  }
  // Fill profile
  profileName.textContent = currentProfile.displayName;
  profileAvatar.src = currentProfile.photoURL || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(currentProfile.displayName)}`;
  // Load feed
  showTab("home");
});

// LOGOUT
logoutBtn.onclick = () => auth.signOut();

// NAVIGATION
sidebarHome.onclick = () => showTab("home");
sidebarExplore.onclick = () => showTab("explore");
sidebarNotifications.onclick = () => showTab("notifications");
sidebarProfile.onclick = () => openProfileModal();

function setActiveTab(tab) {
  [sidebarHome, sidebarExplore, sidebarNotifications].forEach(el => el.classList.remove('active'));
  if (tab === 'home') sidebarHome.classList.add('active');
  if (tab === 'explore') sidebarExplore.classList.add('active');
  if (tab === 'notifications') sidebarNotifications.classList.add('active');
}

function showTab(tab) {
  setActiveTab(tab);
  currentTab = tab;
  if (tab === "home") {
    feedTitle.textContent = "Home";
    loadFeed(true);
  } else if (tab === "explore") {
    feedTitle.textContent = "Explore";
    loadFeed(false);
  } else if (tab === "notifications") {
    feedTitle.textContent = "Notifications";
    loadNotifications();
  }
}

// POST
if (postForm) {
  postForm.onsubmit = async (e) => {
    e.preventDefault();
    const content = postContent.value.trim();
    if (!content || !currentUser) return;
    await db.collection('posts').add({
      content,
      author: currentProfile.displayName,
      authorUid: currentUser.uid,
      authorPhoto: currentProfile.photoURL,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      likes: [],
      reposts: [],
      comments: [],
      public: true
    });
    postContent.value = '';
  };
}

// LOAD FEED
function loadFeed(homeOnly=true) {
  feed.innerHTML = '<div style="text-align:center;color:#888;padding:1em;">Loading...</div>';
  let ref = db.collection('posts').orderBy('timestamp', 'desc').limit(50);
  ref.get().then(async (snap) => {
    let html = '';
    snap.forEach(doc => {
      const post = doc.data();
      // Home: only posts by user and their moots; Explore: all
      if (homeOnly && post.authorUid !== currentUser.uid) return;
      html += renderPost(doc.id, post);
    });
    if (!html) html = '<div style="text-align:center;color:#888;padding:1em;">No posts yet.</div>';
    feed.innerHTML = html;
    attachPostEvents();
  });
}

// LOAD NOTIFICATIONS
function loadNotifications() {
  feed.innerHTML = '<div style="text-align:center;color:#888;padding:1em;">Loading...</div>';
  db.collection('notifications')
    .where('toUid', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .limit(30)
    .get().then(snap => {
      let html = '';
      snap.forEach(doc => {
        const n = doc.data();
        html += `<div class="post notification">
          <img src="${n.actorPhoto || `https://api.dicebear.com/7.x/person/svg?seed=${n.actor}`}" class="post-avatar" />
          <div class="post-content-block">
            <span class="post-author">${n.actor}</span>
            <span class="post-time">${n.type.charAt(0).toUpperCase() + n.type.slice(1)}</span>
            <div class="post-main">${n.message || ''}</div>
          </div>
        </div>`;
      });
      if (!html) html = '<div style="text-align:center;color:#888;padding:1em;">No notifications yet.</div>';
      feed.innerHTML = html;
    });
}

// RENDER POST
function renderPost(id, post) {
  const liked = post.likes && post.likes.includes(currentUser.uid);
  const reposted = post.reposts && post.reposts.includes(currentUser.uid);
  return `<div class="post" data-id="${id}">
    <img src="${post.authorPhoto || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(post.author)}`}" class="post-avatar"/>
    <div class="post-content-block">
      <div class="post-header">
        <span class="post-author">${post.author}</span>
        <span class="post-time">${post.timestamp ? post.timestamp.toDate().toLocaleString() : ''}</span>
      </div>
      <div class="post-main">${post.content.replace(/\n/g, '<br>')}</div>
      <div class="post-actions">
        <button class="action-btn like-btn${liked ? ' liked' : ''}" title="Like">
          <span>♥</span>
          <span class="count">${post.likes ? post.likes.length : 0}</span>
        </button>
        <button class="action-btn comment-btn commented" title="Comment">
          <span>💬</span>
          <span class="count">${post.comments ? post.comments.length : 0}</span>
        </button>
        <button class="action-btn repost-btn${reposted ? ' reposted' : ''}" title="Repost">
          <span>🔁</span>
          <span class="count">${post.reposts ? post.reposts.length : 0}</span>
        </button>
      </div>
    </div>
  </div>`;
}

// POST INTERACTION EVENTS
function attachPostEvents() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async function() {
      const postDiv = btn.closest('.post');
      const id = postDiv.getAttribute('data-id');
      const ref = db.collection('posts').doc(id);
      const doc = await ref.get();
      const post = doc.data();
      let likes = post.likes || [];
      if (likes.includes(currentUser.uid)) {
        likes = likes.filter(uid => uid !== currentUser.uid);
      } else {
        likes.push(currentUser.uid);
        // Notification for like
        if (post.authorUid !== currentUser.uid) {
          await db.collection('notifications').add({
            toUid: post.authorUid,
            actor: currentProfile.displayName,
            actorPhoto: currentProfile.photoURL,
            type: 'like',
            postId: id,
            message: `${currentProfile.displayName} liked your post.`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      await ref.update({ likes });
      showTab(currentTab);
    };
  });
  document.querySelectorAll('.repost-btn').forEach(btn => {
    btn.onclick = async function() {
      const postDiv = btn.closest('.post');
      const id = postDiv.getAttribute('data-id');
      const ref = db.collection('posts').doc(id);
      const doc = await ref.get();
      const post = doc.data();
      let reposts = post.reposts || [];
      if (reposts.includes(currentUser.uid)) {
        reposts = reposts.filter(uid => uid !== currentUser.uid);
      } else {
        reposts.push(currentUser.uid);
        // Create new post for repost
        await db.collection('posts').add({
          content: post.content,
          author: currentProfile.displayName,
          authorUid: currentUser.uid,
          authorPhoto: currentProfile.photoURL,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          likes: [],
          reposts: [],
          comments: [],
          public: true,
          isRepost: true,
          originalPostId: id
        });
        // Notification for repost
        if (post.authorUid !== currentUser.uid) {
          await db.collection('notifications').add({
            toUid: post.authorUid,
            actor: currentProfile.displayName,
            actorPhoto: currentProfile.photoURL,
            type: 'repost',
            postId: id,
            message: `${currentProfile.displayName} reposted your post.`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      await ref.update({ reposts });
      showTab(currentTab);
    };
  });
  document.querySelectorAll('.comment-btn').forEach(btn => {
    btn.onclick = function() {
      const postDiv = btn.closest('.post');
      const id = postDiv.getAttribute('data-id');
      openCommentModal(id);
    };
  });
}

// COMMENTS
let currentCommentPostId = null;
function openCommentModal(postId) {
  currentCommentPostId = postId;
  modalBg.style.display = commentModal.style.display = 'block';
  db.collection('posts').doc(postId).get().then(doc => {
    const post = doc.data();
    modalPostContent.innerHTML = `<strong>${post.author}</strong><br>${post.content.replace(/\n/g, '<br>')}`;
    loadComments(postId);
  });
}
function closeCommentModal() {
  modalBg.style.display = commentModal.style.display = 'none';
  commentInput.value = '';
}
window.closeCommentModal = closeCommentModal;

function loadComments(postId) {
  db.collection('posts').doc(postId).get().then(doc => {
    const post = doc.data();
    const comments = post.comments || [];
    commentsList.innerHTML = comments.map(c =>
      `<div class="comment">
        <img class="comment-avatar" src="${c.photoURL || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(c.author)}`}" />
        <div class="comment-content-block">
          <span class="comment-author">${c.author}</span>
          <span class="comment-time">${c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</span>
          <div class="comment-main">${c.text.replace(/\n/g, '<br>')}</div>
        </div>
      </div>`
    ).join('');
  });
}
if (commentForm) {
  commentForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentCommentPostId || !currentUser) return;
    const text = commentInput.value.trim();
    if (!text) return;
    const docRef = db.collection('posts').doc(currentCommentPostId);
    const doc = await docRef.get();
    const post = doc.data();
    const comments = post.comments || [];
    const commentObj = {
      author: currentProfile.displayName,
      uid: currentUser.uid,
      photoURL: currentProfile.photoURL,
      text,
      timestamp: Date.now()
    };
    comments.push(commentObj);
    await docRef.update({ comments });
    // Notification for comment
    if (post.authorUid !== currentUser.uid) {
      await db.collection('notifications').add({
        toUid: post.authorUid,
        actor: currentProfile.displayName,
        actorPhoto: currentProfile.photoURL,
        type: 'comment',
        postId: currentCommentPostId,
        message: `${currentProfile.displayName} commented: "${text}"`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    commentInput.value = '';
    loadComments(currentCommentPostId);
  };
}

// PROFILE
function openProfileModal() {
  modalBg.style.display = profileModal.style.display = 'block';
  profileDisplayName.value = currentProfile.displayName;
  profilePhoto.value = currentProfile.photoURL;
}
function closeProfileModal() {
  modalBg.style.display = profileModal.style.display = 'none';
}
window.closeProfileModal = closeProfileModal;

if (profileForm) {
  profileForm.onsubmit = async (e) => {
    e.preventDefault();
    const displayName = profileDisplayName.value.trim();
    const photoURL = profilePhoto.value.trim() || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(displayName)}`;
    await db.collection('users').doc(currentUser.uid).update({
      displayName,
      photoURL
    });
    currentProfile.displayName = displayName;
    currentProfile.photoURL = photoURL;
    profileName.textContent = displayName;
    profileAvatar.src = photoURL;
    closeProfileModal();
    showTab(currentTab);
  };
}

// CLOSE MODALS BY CLICKING BG
modalBg.onclick = () => {
  closeCommentModal();
  closeProfileModal();
};
