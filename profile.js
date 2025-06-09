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
let profileUid = null;
let profileUser = null;
let following = [];

const params = new URLSearchParams(window.location.search);
profileUid = params.get('uid');

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeText = document.getElementById('theme-text');
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

// LOGOUT
document.getElementById('logout-btn').onclick = (e) => {
  e.preventDefault();
  auth.signOut();
};

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  if (!profileUid) profileUid = user.uid;
  await loadProfilePage();
});

async function loadProfilePage() {
  const userDoc = await db.collection('users').doc(profileUid).get();
  if (!userDoc.exists) {
    document.getElementById('profile-header').innerHTML = `<b>User not found.</b>`;
    return;
  }
  profileUser = userDoc.data();

  document.getElementById('profile-avatar').src = profileUser.photoURL || `https://api.dicebear.com/7.x/person/svg?seed=${encodeURIComponent(profileUser.displayName)}`;
  document.getElementById('profile-displayname').textContent = profileUser.displayName || "User";
  document.getElementById('profile-bio').textContent = profileUser.bio || "";
  document.title = profileUser.displayName + ' – Talk Haus';

  // Stats
  const postsSnap = await db.collection('posts').where('authorUid', '==', profileUid).get();
  document.getElementById('post-count').textContent = postsSnap.size + " Post" + (postsSnap.size !== 1 ? "s" : "");

  const followersSnap = await db.collection('users').doc(profileUid).collection('followers').get();
  const followingSnap = await db.collection('users').doc(profileUid).collection('following').get();
  document.getElementById('follower-count').textContent = followersSnap.size + " Follower" + (followersSnap.size !== 1 ? "s" : "");
  document.getElementById('following-count').textContent = followingSnap.size + " Following";

  // Follow button
  if (profileUid === currentUser.uid) {
    document.getElementById('follow-btn').style.display = "none";
  } else {
    // Is current user following this profile?
    const meFollowingSnap = await db.collection('users').doc(currentUser.uid).collection('following').doc(profileUid).get();
    setFollowButton(meFollowingSnap.exists);
    document.getElementById('follow-btn').onclick = async () => {
      if (meFollowingSnap.exists) {
        // Unfollow
        await db.collection('users').doc(currentUser.uid).collection('following').doc(profileUid).delete();
        await db.collection('users').doc(profileUid).collection('followers').doc(currentUser.uid).delete();
        setFollowButton(false);
        // update stats
        loadProfilePage();
      } else {
        // Follow
        await db.collection('users').doc(currentUser.uid).collection('following').doc(profileUid).set({
          uid: profileUid,
          displayName: profileUser.displayName,
          photoURL: profileUser.photoURL
        });
        await db.collection('users').doc(profileUid).collection('followers').doc(currentUser.uid).set({
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email.split('@')[0],
          photoURL: currentUser.photoURL
        });
        setFollowButton(true);
        // update stats
        loadProfilePage();
      }
    };
  }

  // Show posts
  let html = '';
  postsSnap.forEach(doc => {
    const post = doc.data();
    html += renderPost(doc.id, post, profileUser);
  });
  document.getElementById('feed').innerHTML = html || `<div style="color:#999;text-align:center;">No posts yet.</div>`;
  attachPostEvents();
}

function setFollowButton(isFollowing) {
  const btn = document.getElementById('follow-btn');
  if (isFollowing) {
    btn.textContent = "Following";
    btn.classList.add("following");
    btn.classList.remove("not-following");
  } else {
    btn.textContent = "Follow";
    btn.classList.remove("following");
    btn.classList.add("not-following");
  }
}

// Render post card (universal, matches home.js)
function renderPost(id, post, authorData) {
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

// Like, repost, comment events (reuse home.js logic, update original post on repost)
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
            actor: currentUser.displayName || currentUser.email.split('@')[0],
            actorPhoto: currentUser.photoURL,
            type: 'like',
            postId: id,
            message: `${currentUser.displayName || currentUser.email.split('@')[0]} liked your post.`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      await ref.update({ likes });
      loadProfilePage();
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
          author: currentUser.displayName || currentUser.email.split('@')[0],
          authorUid: currentUser.uid,
          authorPhoto: currentUser.photoURL,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          likes: [],
          reposts: [],
          comments: [],
          public: true,
          isRepost: true,
          originalPostId
        });
        // Update original post's repost count (and everywhere else, since we always read from the original)
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
            actor: currentUser.displayName || currentUser.email.split('@')[0],
            actorPhoto: currentUser.photoURL,
            type: 'repost',
            postId: id,
            message: `${currentUser.displayName || currentUser.email.split('@')[0]} reposted your post.`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      await ref.update({ reposts });
      loadProfilePage();
    };
  });
  // Comment: If you want a modal, you can add modal logic here.
}
