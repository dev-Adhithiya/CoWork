import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';

// Standard Firebase configuration parameters
export const firebaseConfig: FirebaseOptions = {
  apiKey: rawFirebaseConfig.apiKey || '',
  authDomain: rawFirebaseConfig.authDomain || '',
  projectId: rawFirebaseConfig.projectId || '',
  storageBucket: rawFirebaseConfig.storageBucket || '',
  messagingSenderId: rawFirebaseConfig.messagingSenderId || '',
  appId: rawFirebaseConfig.appId || '',
  ...(rawFirebaseConfig.measurementId ? { measurementId: rawFirebaseConfig.measurementId } : {}),
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Verification and Diagnostic Logging
if (typeof window !== 'undefined') {
  const isKeyValidFormat = typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.startsWith('AIzaSy');
  
  console.groupCollapsed('[Co-Work] 🔥 Firebase Authentication Diagnostics');
  console.log('Firebase Configuration verification:');
  console.log('  • apiKey:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}... (length: ${firebaseConfig.apiKey.length}, valid format: ${isKeyValidFormat})` : '❌ MISSING');
  console.log('  • authDomain:', firebaseConfig.authDomain || '❌ MISSING');
  console.log('  • projectId:', firebaseConfig.projectId || '❌ MISSING');
  console.log('  • appId:', firebaseConfig.appId || '❌ MISSING');
  console.log('  • storageBucket:', firebaseConfig.storageBucket || '⚠️ Not configured');
  console.log('  • messagingSenderId:', firebaseConfig.messagingSenderId || '⚠️ Not configured');
  console.log('Runtime Environment:');
  console.log('  • Current Origin:', window.location.origin);
  console.log('  • In iframe:', window.self !== window.top);
  console.log('Firebase instances:');
  console.log('  • App Name:', app.name);
  console.log('  • Options API Key verified on Auth:', auth.app.options.apiKey === firebaseConfig.apiKey);
  console.log('  • Auth current user:', auth.currentUser ? auth.currentUser.uid : 'None (Logged out)');
  console.groupEnd();

  // Expose diagnostic tool in browser console for developers
  (window as any).__firebaseDiagnostics = {
    config: {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : undefined,
    },
    rawConfigKeys: Object.keys(rawFirebaseConfig),
    appOptions: app.options,
    authInitialized: !!auth,
    currentOrigin: window.location.origin,
    isInIframe: window.self !== window.top,
  };
}

