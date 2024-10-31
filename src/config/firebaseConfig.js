import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Parse the service account key from the environment variable
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
