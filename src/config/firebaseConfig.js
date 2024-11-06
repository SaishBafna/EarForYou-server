import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Parse the service account JSON from environment variable
const serviceAccount = JSON.parse(process.env.serviceAccount);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
