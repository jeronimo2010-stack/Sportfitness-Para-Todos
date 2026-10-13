import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectAndClean() {
  const collections = ['users', 'community_videos', 'support_tickets', 'mail', 'admins'];
  console.log('--- Inspecting Firestore Collections ---');
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection "${colName}": ${snap.size} documents found.`);
      for (const d of snap.docs) {
        console.log(` - ID: ${d.id}`);
      }
    } catch (err: any) {
      console.log(`Collection "${colName}": Error reading: ${err.message}`);
    }
  }
}

inspectAndClean().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
