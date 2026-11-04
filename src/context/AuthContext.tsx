import React, { createContext, useContext, useEffect, useState } from 'react';
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
  signInWithEmailAndPassword,
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

  const checkAdminClaims = async (fbUser: FirebaseUser, forceRefresh = false): Promise<boolean> => {
    try {
      const tokenResult = await fbUser.getIdTokenResult(forceRefresh);
      return tokenResult.claims.admin === true;
    } catch (error) {
      console.error('Could not verify Firebase custom claims:', error);
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

      const verifiedAdmin = await checkAdminClaims(fbUser);
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

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) await fbUpdateProfile(credential.user, { displayName: name });
    setIsAuthModalOpen(false);
    setIntendedAction(null);
  };

  const loginAdminWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; isAdmin: boolean; error?: string }> => {
    setIsAuthLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const verifiedAdmin = await checkAdminClaims(credential.user, true);
      setIsAdmin(verifiedAdmin);
      setIsAdminClaimVerified(true);
      return verifiedAdmin
        ? { success: true, isAdmin: true }
        : {
            success: false,
            isAdmin: false,
            error: 'Ce compte est connecté, mais ne possède pas le rôle administrateur Firebase.'
          };
    } catch (error) {
      return {
        success: false,
        isAdmin: false,
        error: error instanceof Error ? error.message : 'Échec de l’authentification Firebase.'
      };
    } finally {
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
    const verifiedAdmin = await checkAdminClaims(currentUser, true);
    setIsAdmin(verifiedAdmin);
    setIsAdminClaimVerified(true);
    return verifiedAdmin;
  };

  const logout = async () => {
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
