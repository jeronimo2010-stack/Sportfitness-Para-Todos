import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { hashPassword } from '../server/db';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function purgeFirestore() {
  console.log('[1/3] Purging Firestore cloud collections...');
  const collections = ['users', 'community_videos', 'support_tickets', 'mail', 'admins'];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(` - Collection "${colName}": found ${snap.size} documents.`);
      for (const d of snap.docs) {
        // Check for subcollections in users
        if (colName === 'users') {
          try {
            const notesSnap = await getDocs(collection(db, `users/${d.id}/notes`));
            for (const nd of notesSnap.docs) {
              await deleteDoc(doc(db, `users/${d.id}/notes`, nd.id));
            }
            const workoutsSnap = await getDocs(collection(db, `users/${d.id}/workouts`));
            for (const wd of workoutsSnap.docs) {
              await deleteDoc(doc(db, `users/${d.id}/workouts`, wd.id));
            }
          } catch {}
        }
        await deleteDoc(doc(db, colName, d.id));
        console.log(`   Deleted ${colName}/${d.id}`);
      }
    } catch (err: any) {
      console.error(`Error purging ${colName}:`, err.message);
    }
  }
}

function purgeServerDb() {
  console.log('[2/3] Resetting server JSON database file (data/sportfitness_database.json)...');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const DB_FILE = path.join(DATA_DIR, 'sportfitness_database.json');

  const adminPass = hashPassword('AdminPassword2026!');
  const cleanDb = {
    users: [
      {
        id: 'usr-admin-master',
        email: 'admin@sportfitness.com',
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        documentType: 'Cédula de Ciudadanía (CC)',
        documentNumber: '999000111',
        phone: '+57 300 000 0001',
        fullName: 'Administrador General Sportfitness',
        firstName: 'Admin',
        lastName: 'General',
        role: 'admin',
        membershipPlan: 'Obsidian Ultimate (Admin)',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: 'Activo',
        healthProfile: {
          weight: 76,
          height: 178,
          clothingSize: 'M',
          bodyType: 'Mesomorfo',
          bmi: 24,
          bmiCategory: 'Composición Atlética Óptima',
        },
        progress: {
          userId: 'usr-admin-master',
          sessionsCompleted: 0,
          weeklyVolumePercent: 0,
          totalVolumeKg: 0,
          streakDays: 0,
          streakDiscountPercent: 0,
          activeDaysTotal: 0,
          efficiencyScoreAvg: 0,
          lastUpdated: new Date().toISOString(),
          workoutLogs: [],
          milestones: [],
          gpsRoutes: [],
        },
      },
    ],
    activeSessions: {},
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');
  console.log(' - Server database successfully reset to clean slate.');
}

async function run() {
  await purgeFirestore();
  purgeServerDb();
  console.log('[3/3] Database cleanup completely finished!');
}

run().then(() => process.exit(0)).catch((e) => {
  console.error('Purge failed:', e);
  process.exit(1);
});
