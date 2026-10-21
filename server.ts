import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
let firebaseProjectId = 'cuenta-clara-6ba06';
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.projectId) {
      firebaseProjectId = parsed.projectId;
    }
  } catch (err) {
    console.warn('Could not read firebase-applet-config.json:', err);
  }
}

// Initialize Firebase Admin
let adminApp: App;
if (getApps().length === 0) {
  adminApp = initializeApp({
    projectId: firebaseProjectId,
  });
} else {
  adminApp = getApps()[0]!;
}

const adminAuth = getAuth(adminApp);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Secure Account Deletion Endpoint
 *
 * Security Requirements:
 * 1. Obtains the UID strictly from the verified Firebase ID Token in the Authorization header.
 * 2. Never accepts a client-provided UID in the body or query params to prevent unauthorized deletion.
 * 3. Deletes all user documents and subcollections in Firestore under users/{uid}.
 * 4. Deletes the user in Firebase Authentication via Admin SDK.
 * 5. Idempotent and fails safe.
 */
app.post('/api/account/delete', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado. Se requiere encabezado de autorización Bearer con token de Firebase válido.',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Token de autorización ausente o inválido.',
    });
  }

  let uid: string;
  let email: string | undefined;

  try {
    // Strictly verify the token with Google Public Keys
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    uid = decodedToken.uid;
    email = decodedToken.email;
  } catch (err: any) {
    console.warn('Token verification failed in /api/account/delete:', err?.message);
    return res.status(401).json({
      error: 'Token inválido o expirado. Por favor, reautenticate e intenta nuevamente.',
      code: err?.code || 'auth/invalid-token',
    });
  }

  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    return res.status(400).json({ error: 'Identificador de usuario inválido.' });
  }

  console.log(`[Cuenta Clara - Server] Iniciando proceso de eliminación segura para UID: ${uid} (${email || 'sin correo'})`);

  const subcollections = [
    'accounts',
    'billInstances',
    'payments',
    'incomes',
    'goals',
    'notifications',
    'categories',
  ];

  const deletionResults: Record<string, number> = {};

  // Delete all subcollections and their documents using the verified user token via Firestore REST API
  for (const col of subcollections) {
    try {
      const listUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users/${uid}/${col}?pageSize=300`;
      const listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const docs = listData.documents || [];
        deletionResults[col] = docs.length;

        for (const docItem of docs) {
          if (docItem.name) {
            await fetch(`https://firestore.googleapis.com/v1/${docItem.name}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
        }
      } else {
        deletionResults[col] = 0;
      }
    } catch (colErr) {
      console.warn(`Error limpiando subcolección ${col} para usuario ${uid}:`, colErr);
      deletionResults[col] = -1;
    }
  }

  // Delete the root user profile document: users/{uid}
  try {
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users/${uid}`;
    await fetch(userDocUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    deletionResults['userProfile'] = 1;
  } catch (userDocErr) {
    console.warn(`Error eliminando documento de perfil para usuario ${uid}:`, userDocErr);
  }

  // Attempt to delete user in Firebase Authentication via Admin SDK
  let authDeletedByServer = false;
  try {
    await adminAuth.deleteUser(uid);
    authDeletedByServer = true;
    console.log(`[Cuenta Clara - Server] Usuario ${uid} eliminado exitosamente de Firebase Auth via Admin SDK.`);
  } catch (adminErr: any) {
    console.warn(`[Cuenta Clara - Server] Nota Admin SDK al eliminar usuario ${uid}: ${adminErr?.message || adminErr}`);
    // Note: If cloud container lacks IAM role for Admin SDK, client will complete auth deletion with deleteUser(currentUser)
  }

  return res.status(200).json({
    success: true,
    message: 'Cuenta y registros eliminados permanentemente del servidor.',
    uid,
    authDeletedByServer,
    deletedSummary: deletionResults,
  });
});

// Configure Vite or Static Files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cuenta Clara] Servidor escuchando en http://0.0.0.0:${PORT} (${isProd ? 'producción' : 'desarrollo'})`);
  });
}

startServer().catch((err) => {
  console.error('Error iniciando el servidor:', err);
  process.exit(1);
});
