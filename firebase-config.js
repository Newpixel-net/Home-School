// ====================================
// Mia's Home School - Firebase Configuration
// ====================================
// This file should be hosted and included in all educational apps
// Usage: <script src="path/to/firebase-config.js"></script>

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlqcPJaO0-JXSFKi__rwYALR9PgBhT8-k",
  authDomain: "mia-home-school-513d2.firebaseapp.com",
  projectId: "mia-home-school-513d2",
  storageBucket: "mia-home-school-513d2.firebasestorage.app",
  messagingSenderId: "645973670570",
  appId: "1:645973670570:web:78782661d182ce9e17aed3",
  measurementId: "G-6YGP5Z1ZQX"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

console.log(String.fromCodePoint(0x2705) + ' Firebase initialized from shared config');

// Track current user globally
let currentUser = null;

// Auth state listener - tracks user across all apps
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log(String.fromCodePoint(0x1F464) + ' User signed in:', user.email);
  } else {
    currentUser = null;
    console.log('No user signed in');
  }
});

// ====================================
// Shared Firebase Helper Functions
// ====================================

/**
 * Update module progress in Firestore
 * @param {string} moduleName - Name of the module (e.g., 'math-adventures', 'abc-learning')
 * @param {number} progressPercent - Progress percentage (0-100)
 */
async function updateModuleProgress(moduleName, progressPercent) {
  if (!currentUser) {
    console.warn('Cannot update progress - user not signed in');
    return;
  }

  try {
    const updateData = {};
    updateData[`progress.${moduleName}`] = progressPercent;

    await db.collection('users').doc(currentUser.uid).update(updateData);
    console.log(String.fromCodePoint(0x2705) + ` ${moduleName} progress updated: ${progressPercent}%`);
  } catch (error) {
    console.error(String.fromCodePoint(0x274C) + ' Error updating progress:', error);

    if (error.code === 'permission-denied') {
      console.error(String.fromCodePoint(0x1F512) + ' Firestore permission denied - check security rules');
    }
  }
}

/**
 * Add activity to user's activity feed
 * @param {string} module - Module name (e.g., 'math-adventures')
 * @param {string} title - Activity title (e.g., 'Solved 5 Math Problems')
 * @param {string} emoji - Emoji for the activity
 */
async function addActivityToFeed(module, title, emoji) {
  if (!currentUser) {
    console.warn('Cannot add activity - user not signed in');
    return;
  }

  try {
    const activity = {
      module: module,
      title: title,
      emoji: emoji,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(currentUser.uid).update({
      activityFeed: firebase.firestore.FieldValue.arrayUnion(activity)
    });

    console.log(String.fromCodePoint(0x2705) + ' Activity added:', title);
  } catch (error) {
    console.error(String.fromCodePoint(0x274C) + ' Error adding activity:', error);
  }
}

/**
 * Update user stats
 * @param {Object} updates - Object with stat updates (e.g., { totalActivities: 1, skillsMastered: 2 })
 */
async function updateUserStats(updates) {
  if (!currentUser) {
    console.warn('Cannot update stats - user not signed in');
    return;
  }

  try {
    const statsUpdates = {};
    Object.keys(updates).forEach(key => {
      statsUpdates[`stats.${key}`] = firebase.firestore.FieldValue.increment(updates[key]);
    });

    await db.collection('users').doc(currentUser.uid).update(statsUpdates);
    console.log(String.fromCodePoint(0x2705) + ' Stats updated');
  } catch (error) {
    console.error(String.fromCodePoint(0x274C) + ' Error updating stats:', error);
  }
}

/**
 * Add achievement to user profile
 * @param {string} achievementId - Achievement ID (e.g., 'first-artwork', 'creative-star')
 */
async function addAchievement(achievementId) {
  if (!currentUser) {
    console.warn('Cannot add achievement - user not signed in');
    return;
  }

  try {
    // Check if user already has this achievement
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (userData && userData.achievements && userData.achievements.includes(achievementId)) {
      console.log('Achievement already unlocked:', achievementId);
      return;
    }

    // Add achievement
    await db.collection('users').doc(currentUser.uid).update({
      achievements: firebase.firestore.FieldValue.arrayUnion(achievementId),
      'stats.badgesEarned': firebase.firestore.FieldValue.increment(1)
    });

    console.log(String.fromCodePoint(0x1F3C6) + ` Achievement unlocked: ${achievementId}`);
  } catch (error) {
    console.error(String.fromCodePoint(0x274C) + ' Error adding achievement:', error);
  }
}

// Export for use in apps
window.MiaHomeFirebase = {
  auth,
  db,
  storage,
  analytics,
  currentUser: () => currentUser,
  updateModuleProgress,
  addActivityToFeed,
  updateUserStats,
  addAchievement
};
