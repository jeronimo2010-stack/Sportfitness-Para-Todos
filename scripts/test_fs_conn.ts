import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    const cred = await signInAnonymously(auth);
    console.log('Anonymous sign in successful, uid:', cred.user.uid);
  } catch (authErr: any) {
    console.log('Anonymous sign in failed:', authErr.message);
  }

  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('Successfully fetched users! Count:', snap.size);
  } catch (err: any) {
    console.log('Failed to fetch users:', err.message);
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
