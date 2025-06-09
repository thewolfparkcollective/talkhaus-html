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
let currentProfile = {displayName: '', photoURL: ''};
let currentTab = "home";

// DOM elements
const feed = document.getElementById('feed');
const postForm = document.getElementById('post-form');
const postContent = document.getElementById('post-content');
const logoutBtn = document.getElementById('logout-btn');
const feedTitle = document.getElementById('feed-title');
const sidebarHome = document.getElementById('sidebar-home');
const sidebarExplore = document.getElementById('sidebar-explore');
const sidebarNotifications = document.getElementById('sidebar-notifications');
const sidebarProfile = document.getElementById('sidebar-profile');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
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
const postComposerSection = document.getElementById('post-composer-section');

// THEME
let theme = localStorage.getItem('theme') || 'light';
setTheme(theme);
themeToggleBtn.onclick = () => {
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
logoutBtn.onclick = (e) => {
  e.preventDefault();
  auth.signOut();
};

// NAVIGATION
sidebarHome.onclick = (e) => {
  e.preventDefault();
  showTab("home");
};
sidebarExplore.onclick = (e) => {
  e.preventDefault();
  showTab("explore");
};
sidebarNotifications.onclick = (e) => {
  e.preventDefault();
  showTab("notifications");
};
sidebarProfile.onclick = (e) => {
  e.preventDefault();
  if (currentUser) window.location = `profile.html?uid=${currentUser.uid}`;
};

function setActiveTab(tab) {
  [sidebarHome, sidebarExplore, sidebarNotifications, sidebarProfile].forEach(el => el.classList.remove('active'));
  if (tab === 'home') sidebarHome.classList.add('active');
  if (tab === 'explore') sidebarExplore.classList.add('active');
  if (tab === 'notifications') sidebarNotifications.classList.add('active');
  if (tab === 'profile') sidebarProfile.classList.add('active');
}

function showTab(tab) {
  setActiveTab(tab);
  currentTab = tab;
  // Only show composer on home
  if (postComposerSection) postComposerSection.style.display = (tab === "home") ? "block" : "none";
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
    showTab("home");
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
      // Home: only posts by user and their follows; Explore: all
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
            <span class="post-author clickable" onclick="window.location='profile.html?uid=${n.actorUid || ""}'">${n.actor}</span>
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
  const isRepost = post.isRepost && post.originalPostId;
  return `<div class="post${isRepost ? " repost" : ""}" data-id="${id}">
    <img src="${post.authorPhoto || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(post.author)}`}" class="post-avatar" onclick="window.location='profile.html?uid=${post.authorUid}'" style="cursor:pointer"/>
    <div class="post-content-block">
      <div class="post-header">
        <span class="post-author clickable" onclick="window.location='profile.html?uid=${post.authorUid}'">${post.author}</span>
        <span class="post-time">${post.timestamp ? post.timestamp.toDate().toLocaleString() : ''}</span>
        ${isRepost ? `<span style="margin-left:1em;color:var(--primary);font-size:0.95em;">🔁 Repost</span>` : ""}
      </div>
      <div class="post-main">${post.content.replace(/\n/g, '<br>')}</div>
      <div class="post-actions">
        <button class="action-btn like-btn${liked ? ' liked' : ''}" title="Like">
          <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 21s-8-6.6-8-11.3C4 5.1 7.3 2 12 7.1 16.7 2 20 5.1 20 9.7c0 4.7-8 11.3-8 11.3z"/></svg>
          <span class="count">${post.likes ? post.likes.length : 0}</span>
        </button>
        <button class="action-btn comment-btn commented" title="Comment">
          <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="count">${post.comments ? post.comments.length : 0}</span>
        </button>
        <button class="action-btn repost-btn${reposted ? ' reposted' : ''}" title="Repost">
          <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 2v6h6"/><path d="M7 22v-6H1"/><path d="M22 8a9.77 9.77 0 0 0-7-3c-5 0-9 3.6-9 8"/><path d="M2 16a9.77 9.77 0 0 0 7 3c5 0 9-3.6 9-8"/></svg>
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
            actorUid: currentUser.uid,
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
        // Create new post for repost, point to original
        const originalPostId = post.isRepost && post.originalPostId ? post.originalPostId : id;
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
          originalPostId
        });
        // Update original post's repost count globally
        const origRef = db.collection('posts').doc(originalPostId);
        const origDoc = await origRef.get();
        let origReposts = origDoc.data().reposts || [];
        if (!origReposts.includes(currentUser.uid)) {
          origReposts.push(currentUser.uid);
          await origRef.update({ reposts: origReposts });
        }
        // Notification for repost
        if (post.authorUid !== currentUser.uid) {
          await db.collection('notifications').add({
            toUid: post.authorUid,
            actor: currentProfile.displayName,
            actorPhoto: currentProfile.photoURL,
            actorUid: currentUser.uid,
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
  document.querySelectorAll('.post-author, .post-avatar').forEach(el => {
    el.onclick = function(e) {
      const postDiv = el.closest('.post');
      const id = postDiv ? postDiv.getAttribute('data-id') : null;
      let uid = null;
      if (postDiv) {
        const post = feed.querySelector(`[data-id="${id}"]`);
        if (post) {
          uid = post.querySelector('.post-author').getAttribute('onclick').match(/uid=(\w+)/)[1];
        }
      }
      if (uid) window.location = `profile.html?uid=${uid}`;
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
        actorUid: currentUser.uid,
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

// PROFILE EDIT
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
