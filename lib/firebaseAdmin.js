// lib/firebaseAdmin.js
// Modul terpusat untuk inisialisasi Firebase Admin SDK.
// Dipakai oleh api/create-transaction.js dan api/notifications.js
// agar keduanya bisa membaca/menulis ke Firestore dari sisi server.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel menyimpan newline sebagai teks "\n", jadi perlu diubah balik jadi newline asli
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = { admin, db };
