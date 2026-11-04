import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes,
  getDownloadURL 
} from 'firebase/storage';
import firebaseConfig from '../../firebase-target-config.json';

if (
  firebaseConfig.projectId !== 'zstore-7ed88' ||
  firebaseConfig.appId !== '1:698636651398:web:df0fb887a0c9bc2746ba07' ||
  firebaseConfig.authDomain !== 'zstore-7ed88.firebaseapp.com' ||
  firebaseConfig.storageBucket !== 'zstore-7ed88.firebasestorage.app' ||
  firebaseConfig.messagingSenderId !== '698636651398'
) {
  throw new Error('Firebase Web configuration does not match the approved ZStore target project.');
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Error handler specified by the Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function uploadImageToStorage(
  file: File,
  folder = 'products',
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const fileExt = (file.name.split('.').pop() || (file.type === 'image/webp' ? 'webp' : 'jpg'))
    .toLowerCase();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const storageRef = ref(storage, fileName);

  onProgress?.(30);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/webp'
  });
  onProgress?.(80);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  onProgress?.(100);
  return downloadUrl;
}

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  fbUpdateProfile, 
  fbSignOut, 
  signInWithPopup, 
  onAuthStateChanged,
  sendPasswordResetEmail
};
