import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../types';
import {
  auth,
  googleProvider,
  db,
  handleFirestoreError,
  OperationType,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  fbUpdateProfile
} from '../services/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, runTransaction, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isAdminClaimVerified: boolean;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginAdminWithEmail: (email: string, pass: string) => Promise<{ success: boolean; isAdmin: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdminClaims: () => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (intendedAction?: string) => void;
  closeAuthModal: () => void;
  intendedAction: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminClaimVerified, setIsAdminClaimVerified] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [intendedAction, setIntendedAction] = useState<string | null>(null);
  const adminLoginInProgressRef = useRef(false);

  const checkAdminClaims = async (fbUser: FirebaseUser, forceRefresh = false): Promise<boolean> => {
    try {
      const tokenResult = await fbUser.getIdTokenResult(forceRefresh);
      return tokenResult.claims.admin === true;
    } catch (error) {
      console.error('Could not verify Firebase custom claims:', error);
      return false;
    }
  };

  const invalidateAdminSession = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
      if (!response.ok) console.error('Server admin session could not be revoked.');
    } catch (error) {
      console.error('Server admin logout request failed:', error);
    }
  };

  const verifyAdminServerSession = async (fbUser: FirebaseUser): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/session', {
        credentials: 'same-origin'
      });
      if (!response.ok) return false;
      const result: unknown = await response.json();
      return !!result && typeof result === 'object' &&
        'authenticated' in result && result.authenticated === true &&
        'admin' in result && !!result.admin && typeof result.admin === 'object' &&
        'uid' in result.admin && result.admin.uid === fbUser.uid;
    } catch (error) {
      console.error('Could not verify the server admin session:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      setFirebaseUser(fbUser);
      setIsAuthLoading(true);
      setIsAdmin(false);
      setIsAdminClaimVerified(false);

      if (!fbUser) {
        setUser(null);
        setIsAuthLoading(false);
        return;
      }

      const hasAdminClaim = await checkAdminClaims(fbUser);
      const verifiedAdmin = hasAdminClaim && (
        adminLoginInProgressRef.current || await verifyAdminServerSession(fbUser)
      );
      if (hasAdminClaim && !verifiedAdmin) {
        console.error('Admin claim found without a valid matching server session.');
        await fbSignOut(auth);
        await invalidateAdminSession();
        setIsAuthLoading(false);
        return;
      }
      setIsAdmin(verifiedAdmin);
      setIsAdminClaimVerified(true);

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const initialProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Client ZStore',
          phone: fbUser.phoneNumber || '',
          city: 'Cotonou',
          district: '',
          savedAddresses: [],
          wishlist: [],
          role: 'customer'
        };
        const profile = await runTransaction(db, async transaction => {
          const userSnap = await transaction.get(userDocRef);
          if (userSnap.exists()) return userSnap.data() as UserProfile;
          transaction.set(userDocRef, initialProfile);
          return initialProfile;
        });
        setUser({
          ...profile,
          uid: fbUser.uid,
          role: verifiedAdmin ? 'admin' : 'customer'
        });
      } catch (error) {
        console.error('Error fetching or initializing the Firebase user profile:', error);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Client ZStore',
          role: verifiedAdmin ? 'admin' : 'customer',
          savedAddresses: [],
          wishlist: []
        });
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onIdTokenChanged(auth, async fbUser => {
      if (!fbUser) return;
      const hasAdminClaim = await checkAdminClaims(fbUser);
      const hasValidSession = hasAdminClaim && await verifyAdminServerSession(fbUser);
      if (!hasValidSession) {
        console.error('Admin credentials or server session expired; signing out.');
        await fbSignOut(auth);
        await invalidateAdminSession();
        setIsAdmin(false);
        setIsAdminClaimVerified(false);
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    if (!(await checkAdminClaims(credential.user))) await invalidateAdminSession();
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    if (!(await checkAdminClaims(credential.user))) await invalidateAdminSession();
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) await fbUpdateProfile(credential.user, { displayName: name });
    await invalidateAdminSession();
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  const loginAdminWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; isAdmin: boolean; error?: string }> => {
    setIsAuthLoading(true);
    adminLoginInProgressRef.current = true;
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass })
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'message' in result &&
          typeof result.message === 'string'
          ? result.message
          : 'La connexion administrateur a échoué.';
        return { success: false, isAdmin: false, error: message };
      }
      if (
        !result ||
        typeof result !== 'object' ||
        !('customToken' in result) ||
        typeof result.customToken !== 'string'
      ) {
        return {
          success: false,
          isAdmin: false,
          error: 'Le serveur a renvoyé une réponse d’authentification invalide.'
        };
      }
      const credential = await signInWithCustomToken(auth, result.customToken);
      const verifiedAdmin = await checkAdminClaims(credential.user);
      if (!verifiedAdmin) {
        await fbSignOut(auth);
        await invalidateAdminSession();
        setIsAdmin(false);
        setIsAdminClaimVerified(false);
        return {
          success: false,
          isAdmin: false,
          error: 'Le jeton Firebase ne contient pas le claim administrateur attendu.'
        };
      }
      const idToken = await credential.user.getIdToken();
      const sessionResponse = await fetch('/api/admin/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!sessionResponse.ok) {
        const sessionResult: unknown = await sessionResponse.json().catch(() => null);
        const message = sessionResult && typeof sessionResult === 'object' &&
          'message' in sessionResult && typeof sessionResult.message === 'string'
          ? sessionResult.message
          : 'La session administrateur sécurisée n’a pas pu être créée.';
        await fbSignOut(auth);
        await invalidateAdminSession();
        setIsAdmin(false);
        setIsAdminClaimVerified(false);
        return { success: false, isAdmin: false, error: message };
      }
      setIsAdmin(true);
      setIsAdminClaimVerified(true);
      setUser(current => current ? { ...current, role: 'admin' } : current);
      setIsAuthModalOpen(false);
      setIntendedAction(null);
      return { success: true, isAdmin: true };
    } catch (error) {
      if (auth.currentUser && await checkAdminClaims(auth.currentUser)) {
        await fbSignOut(auth);
      }
      await invalidateAdminSession();
      setIsAdmin(false);
      setIsAdminClaimVerified(false);
      return {
        success: false,
        isAdmin: false,
        error: error instanceof Error
          ? error.message
          : 'Échec de la communication avec le service d’authentification.'
      };
    } finally {
      adminLoginInProgressRef.current = false;
      setIsAuthLoading(false);
    }
  };

  const refreshAdminClaims = async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsAdmin(false);
      setIsAdminClaimVerified(false);
      return false;
    }
    const hasAdminClaim = await checkAdminClaims(currentUser);
    const verifiedAdmin = hasAdminClaim && await verifyAdminServerSession(currentUser);
    if (hasAdminClaim && !verifiedAdmin) {
      await fbSignOut(auth);
      await invalidateAdminSession();
    }
    setIsAdmin(verifiedAdmin);
    setIsAdminClaimVerified(true);
    return verifiedAdmin;
  };

  const logout = async () => {
    await invalidateAdminSession();
    await fbSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setIsAdmin(false);
    setIsAdminClaimVerified(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !firebaseUser) return;
    try {
      const { role, uid, ...safeUpdates } = data;
      void role;
      void uid;
      await updateDoc(doc(db, 'users', firebaseUser.uid), safeUpdates);
      setUser({ ...user, ...safeUpdates });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const openAuthModal = (action?: string) => {
    setIntendedAction(action || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAdmin,
        isAdminClaimVerified,
        isAuthLoading,
        loginWithGoogle,
        loginWithEmail,
        loginAdminWithEmail,
        registerWithEmail,
        logout,
        refreshAdminClaims,
        updateProfile,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        intendedAction
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
