import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

async function run() {
  try {
    const q = query(collection(db, 'products'), limit(50));
    const snap = await getDocs(q);
    const allKeys = new Set();
    const sampleDocs = [];
    snap.forEach(doc => {
      const d = doc.data();
      sampleDocs.push(d);
      Object.keys(d).forEach(k => allKeys.add(k));
    });
    console.log("=== ALL UNIQUE FIRESTORE FIELDS DETECTED IN PRODUCTS ===");
    console.log(Array.from(allKeys).sort());
    console.log("\n=== SAMPLE DOCUMENT DATA ===");
    console.log(JSON.stringify(sampleDocs[0], null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

run();
