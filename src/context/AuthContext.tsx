import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, CurrencyCode } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  bypassLoading: () => void;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (currency: CurrencyCode, timezone?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Bypass loading manually if mobile network is stalled
  const bypassLoading = useCallback(() => {
    setLoading(false);
  }, []);

  // Load user profile with instant localStorage cache & network timeout safeguard
  const syncUserProfile = async (firebaseUser: User) => {
    const cacheKey = `cc_profile_${firebaseUser.uid}`;

    // 1. Try reading instantly from localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setUserProfile((prev) => prev || parsed);
      }
    } catch (_) {
      // ignore
    }

    const fallbackProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Usuario',
      defaultCurrency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      onboarded: true,
      theme: 'light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userRef = doc(db, 'users', firebaseUser.uid);

    try {
      // 2. Fetch with a 2.5s timeout so slow cellular connection never leaves the app frozen
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2500)
      );

      const snapPromise = getDoc(userRef);
      const snap = (await Promise.race([snapPromise, timeoutPromise])) as any;

      if (snap && snap.exists && snap.exists()) {
        const profileData = snap.data() as UserProfile;
        setUserProfile(profileData);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(profileData));
        } catch (_) {}
      } else if (snap) {
        const initialProfile: UserProfile = {
          ...fallbackProfile,
          onboarded: false,
        };
        await setDoc(userRef, initialProfile).catch((e) =>
          console.warn('Could not set initial profile doc:', e)
        );
        setUserProfile(initialProfile);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(initialProfile));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Network slow or offline while syncing user profile, using fallback:', err);
      // Ensure we have a working profile object so nothing breaks
      setUserProfile((prev) => prev || fallbackProfile);
    }
  };

  useEffect(() => {
    // Watchdog timer: Guarantee loading finishes within max 2.2s on any mobile connection
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2200);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimer);
      setUser(currentUser);

      if (currentUser) {
        // Run sync in the background so it never blocks the screen
        syncUserProfile(currentUser)
          .catch((e) => console.warn('Background sync notice:', e))
          .finally(() => {
            setLoading(false);
          });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const signInGuest = async () => {
    try {
      const result = await signInAnonymously(auth);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.warn('Anonymous auth unavailable, trying demo session:', err);
      try {
        await loginWithEmail('demo@cuentaclara.app', 'demo123456');
      } catch (e2) {
        try {
          await registerWithEmail('demo@cuentaclara.app', 'demo123456', 'Usuario Demo');
        } catch (e3) {
          throw err;
        }
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error: any) {
      console.error('Email Login Error:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }
        await syncUserProfile(result.user);
      }
    } catch (error: any) {
      console.error('Email Registration Error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const updated = {
      ...prefs,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic state and local storage update so UI responds instantly
    setUserProfile((prev) => {
      const next = prev ? { ...prev, ...updated } : ({ uid: user.uid, ...updated } as UserProfile);
      try {
        localStorage.setItem(`cuentaclara_profile_${user.uid}`, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (prefs.theme) {
      try {
        localStorage.setItem('cuentaclara_theme', prefs.theme);
      } catch (_) {}
    }

    try {
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const completeOnboarding = async (currency: CurrencyCode, timezone = 'America/Argentina/Buenos_Aires') => {
    await updateUserPreferences({
      defaultCurrency: currency,
      timezone,
      onboarded: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        signInGuest,
        bypassLoading,
        resetPassword,
        logout,
        updateUserPreferences,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
