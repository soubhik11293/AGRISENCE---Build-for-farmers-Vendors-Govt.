import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/src/types';
import { triggerAuthToast } from '@/src/components/ui/auth-toast';
import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  sendEmailVerification,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from '@/src/lib/firebase';
import { clearPortalRole } from '@/src/lib/portal-session';
import { callPrivatePortal } from '@/src/lib/portal-api';

export const AUTH_STORAGE_KEY = 'agrisence_auth_session';
export const USER_SESSION_KEY = 'agrisence_user_session';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    emailOrPhone: string,
    password?: string,
    keepSignedIn?: boolean
  ) => Promise<{ data?: { user: User }; error?: string | null; errorCode?: string }>;
  signup: (
    fullName: string,
    email: string,
    phone?: string,
    password?: string,
    additionalData?: Partial<User>
  ) => Promise<{ data?: { user: User }; error?: string | null; errorCode?: string }>;
  loginWithGoogle: () => Promise<{ data?: { user: User; isNewUser: boolean }; error?: string | null }>;
  logout: () => Promise<{ error?: string | null }>;
  updateProfile: (profileData: Partial<User>) => Promise<{ data?: { user: User }; error?: string | null }>;
  changePasswordInApp: (oldPass: string, newPass: string) => Promise<{ error?: string | null }>;
  deleteUserAccount: (password: string) => Promise<{ error?: string | null }>;

  // Profile Modal Controls
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  // Capability Gating Engine
  requireAuth: (action: () => void, featureTitle?: string, featureDescription?: string) => void;
  authModalOpen: boolean;
  authModalTitle: string;
  authModalDescription: string;
  authModalInitialTab?: 'signin' | 'signup' | 'forgot';
  openAuthModal: (
    featureTitle?: string,
    featureDescription?: string,
    onSuccess?: () => void,
    initialTab?: 'signin' | 'signup' | 'forgot'
  ) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Firebase is the source of truth. Do not render a protected session from
  // stale localStorage before the auth listener validates the browser session.
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Gated action execution queue
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTitle, setAuthModalTitle] = useState<string>('Agronomic Capability');
  const [authModalDescription, setAuthModalDescription] = useState<string>('');
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'signin' | 'signup' | 'forgot' | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const isAuthenticated = Boolean(user);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  // 1. Firebase Auth State Listener: Syncs session status & pulls Firestore farmer profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data() as Partial<User>;
            const activeUser: User = {
              id: firebaseUser.uid,
              email: data.email || firebaseUser.email || '',
              fullName: data.fullName || firebaseUser.displayName || 'Progressive Farmer',
              phone: data.phone || firebaseUser.phoneNumber || '',
              alternatePhone: data.alternatePhone || '',
              dob: data.dob || '1992-05-18',
              village: data.village || 'Shirur',
              district: data.district || 'Pune',
              state: data.state || 'Maharashtra',
              pincode: data.pincode || '412210',
              role: data.role || 'AgriSence Verified Farmer',
              portalRole: data.portalRole || 'farmer',
              portalRoles: data.portalRoles || [data.portalRole || 'farmer'],
              accountType: data.accountType || 'farmer',
              officialId: data.officialId,
              vendorId: data.vendorId,
              isAdmin: data.isAdmin || false,
              accessStatus: data.accessStatus || 'active',
              occupation: data.occupation || 'Precision Agriculture & Cash Crops',
              specialization: data.specialization || 'Cash Crops & Horticulture',
              crops: data.crops || ['Soybean', 'Cotton'],
              acreage: data.acreage || '4.5',
              irrigationType: data.irrigationType || 'Micro-Drip',
              farmerRole: data.farmerRole || 'Owner Cultivator',
              avatarColor: data.avatarColor || 'emerald',
              avatarType: data.avatarType || 'initials',
              avatarUrl: data.avatarUrl || firebaseUser.photoURL || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt,
            };

            setUser(activeUser);
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(activeUser));
            localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({ user: activeUser, accessToken: firebaseUser.uid })
            );
            window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: activeUser }));
          } else {
            // New user without Firestore profile yet
            const seedUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              fullName: firebaseUser.displayName || 'Progressive Farmer',
              phone: firebaseUser.phoneNumber || '',
              alternatePhone: '',
              dob: '1992-05-18',
              village: 'Shirur',
              district: 'Pune',
              state: 'Maharashtra',
              pincode: '412210',
              role: 'AgriSence Verified Farmer',
              portalRole: 'farmer',
              portalRoles: ['farmer'],
              accountType: 'farmer',
              occupation: 'Precision Agriculture & Cash Crops',
              specialization: 'Cash Crops & Horticulture',
              crops: ['Soybean', 'Cotton'],
              acreage: '4.5',
              irrigationType: 'Micro-Drip',
              farmerRole: 'Owner Cultivator',
              avatarColor: 'emerald',
              avatarType: 'initials',
              avatarUrl: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
            };

            await setDoc(userRef, { ...seedUser, createdAt: serverTimestamp() }, { merge: true }).catch(() => {});
            setUser(seedUser);
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(seedUser));
            localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({ user: seedUser, accessToken: firebaseUser.uid })
            );
            window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: seedUser }));
          }
        } catch (err) {
          console.warn('Error reading user profile from Firestore:', err);
        }
      } else {
        // User logged out
        setUser(null);
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: null }));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to cross-tab storage changes & app events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_SESSION_KEY || e.key === AUTH_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            const userObj = parsed.user || parsed;
            if (userObj && (userObj.id || userObj.email)) {
              setUser(userObj);
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    const handleProfileCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<User | null>;
      setUser(custom.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agrisence_profile_updated', handleProfileCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agrisence_profile_updated', handleProfileCustomEvent);
    };
  }, []);

  /**
   * Helper to normalize identifier to valid email for Firebase Auth
   */
  const normalizeEmail = (identifier: string): string => {
    const clean = identifier.trim();
    if (clean.includes('@')) return clean.toLowerCase();
    // If mobile digits only, create an internal alias
    const digits = clean.replace(/\D/g, '');
    return `${digits || 'farmer'}@farmer.agrisence.in`;
  };

  /**
   * LOGIN (Firebase Auth with browser persistence)
   */
  const login = useCallback(
    async (emailOrPhone: string, password = '', keepSignedIn = true) => {
      setIsLoading(true);
      try {
        const validEmail = normalizeEmail(emailOrPhone);

        // Apply browser persistence choice
        if (keepSignedIn) {
          await setPersistence(auth, browserLocalPersistence).catch(() => {});
        } else {
          await setPersistence(auth, browserSessionPersistence).catch(() => {});
        }

        const cred = await signInWithEmailAndPassword(auth, validEmail, password);
        const fbUser = cred.user;

        // Fetch or create profile in Firestore
        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);

        let activeUser: User;
        if (snap.exists()) {
          activeUser = {
            id: fbUser.uid,
            email: fbUser.email || validEmail,
            ...snap.data(),
          } as User;
        } else {
          activeUser = {
            id: fbUser.uid,
            email: fbUser.email || validEmail,
            fullName: 'Progressive Farmer',
            phone: emailOrPhone.includes('@') ? '+91 98765 43210' : emailOrPhone,
            village: 'Shirur',
            district: 'Pune',
            state: 'Maharashtra',
            pincode: '412210',
            role: 'AgriSence Verified Farmer',
            portalRole: 'farmer',
            portalRoles: ['farmer'],
            accountType: 'farmer',
            occupation: 'Precision Agriculture',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, activeUser, { merge: true }).catch(() => {});
        }

        setUser(activeUser);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(activeUser));
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user: activeUser, accessToken: fbUser.uid })
        );
        window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: activeUser }));

        // Execute queued capability action if user was gated
        if (pendingAction) {
          try {
            pendingAction();
          } catch (err) {
            console.error('Error executing queued action:', err);
          }
          setPendingAction(null);
        }

        setAuthModalOpen(false);
        setIsLoading(false);
        return { data: { user: activeUser }, error: null };
      } catch (err: any) {
        setIsLoading(false);
        let errorMsg = err.message || 'Login failed';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          errorMsg = 'Incorrect password. Please check your password and try again.';
        } else if (err.code === 'auth/user-not-found') {
          errorMsg = 'No farmer account found with this identifier. Please register a free account.';
        } else if (err.code === 'auth/too-many-requests') {
          errorMsg = 'Too many attempts. Access temporarily restricted. Try again later or reset password.';
        }
        return { error: errorMsg, errorCode: err.code };
      }
    },
    [pendingAction]
  );

  /**
   * SIGNUP (Firebase Auth + Detailed Firestore Onboarding Document)
   */
  const signup = useCallback(
    async (
      fullName: string,
      email: string,
      phone = '',
      password = '',
      additionalData: Partial<User> = {}
    ) => {
      setIsLoading(true);
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = cred.user;
        await sendEmailVerification(fbUser).catch(() => {});

        const sessionUser: User = {
          id: fbUser.uid,
          email: cleanEmail,
          fullName: fullName.trim() || 'Progressive Farmer',
          phone: phone.trim() || '+91 98765 43210',
          alternatePhone: additionalData.alternatePhone || '',
          dob: additionalData.dob || '1992-05-18',
          village: additionalData.village || 'Shirur',
          district: additionalData.district || 'Pune',
          state: additionalData.state || 'Maharashtra',
          pincode: additionalData.pincode || '412210',
          specialization: additionalData.specialization || 'Cash Crops & Horticulture',
          crops: additionalData.crops || ['Soybean', 'Cotton'],
          primaryCrop: additionalData.primaryCrop || 'Soybean',
          acreage: additionalData.acreage || '4.5',
          irrigationType: additionalData.irrigationType || 'Micro-Drip',
          farmerRole: additionalData.farmerRole || 'Owner Cultivator',
          role: 'AgriSence Verified Farmer',
          portalRole: 'farmer',
          portalRoles: ['farmer'],
          accountType: 'farmer',
          occupation: additionalData.occupation || 'Precision Agriculture & Cash Crops',
          avatarColor: 'emerald',
          avatarType: 'initials',
          createdAt: new Date().toISOString(),
        };

        // Write directly to Firestore users/{uid}
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          await setDoc(userRef, { ...sessionUser, createdAt: serverTimestamp() }, { merge: true });
        } catch (profileError) {
          await deleteUser(fbUser).catch(() => {});
          throw profileError;
        }

        setUser(sessionUser);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user: sessionUser, accessToken: fbUser.uid })
        );
        window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: sessionUser }));

        if (pendingAction) {
          try {
            pendingAction();
          } catch (err) {
            console.error('Error executing queued action:', err);
          }
          setPendingAction(null);
        }

        setAuthModalOpen(false);
        setIsLoading(false);
        return { data: { user: sessionUser }, error: null };
      } catch (err: any) {
        setIsLoading(false);
        let errorMsg = err.message || 'Signup failed';
        if (err.code === 'auth/email-already-in-use') {
          errorMsg = 'An account with this email address already exists in our farmer registry.';
        } else if (err.code === 'auth/weak-password') {
          errorMsg = 'Password must meet all complexity requirements (minimum 8 characters).';
        }
        return { error: errorMsg, errorCode: err.code };
      }
    },
    [pendingAction]
  );

  /**
   * CONTINUE WITH GOOGLE
   */
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      const isNewUser = !snap.exists();
      let profileUser: User;

      if (snap.exists()) {
        profileUser = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: snap.data().fullName || fbUser.displayName || 'Progressive Farmer',
          phone: snap.data().phone || fbUser.phoneNumber || '',
          ...snap.data(),
        } as User;
      } else {
        profileUser = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || 'Progressive Farmer',
          phone: fbUser.phoneNumber || '',
          alternatePhone: '',
          dob: '1992-05-18',
          village: 'Shirur',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '412210',
           role: 'AgriSence Verified Farmer',
           portalRole: 'farmer',
           portalRoles: ['farmer'],
           accountType: 'farmer',
          occupation: 'Precision Agriculture',
          avatarUrl: fbUser.photoURL || '',
          avatarType: fbUser.photoURL ? 'preset' : 'initials',
          avatarColor: 'emerald',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, { ...profileUser, createdAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }

      setUser(profileUser);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profileUser));
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: profileUser, accessToken: fbUser.uid })
      );
      window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: profileUser }));

      if (!isNewUser && pendingAction) {
        try {
          pendingAction();
        } catch (err) {
          console.error(err);
        }
        setPendingAction(null);
      }

      setIsLoading(false);
      return { data: { user: profileUser, isNewUser }, error: null };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Google authentication failed' };
    }
  }, [pendingAction]);

  /**
   * UPDATE PROFILE: Writes to Firestore & synchronizes React context simultaneously
   */
  const updateProfile = useCallback(
    async (profileData: Partial<User>) => {
      setIsLoading(true);
      try {
        if (!user) {
          throw new Error('No authenticated user session to update');
        }

        const updatedUser: User = {
          ...user,
          ...profileData,
          updatedAt: new Date().toISOString(),
        };

        // Write directly to Firestore users/{uid}
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });

        // Persist to agrisence_user_session for multi-component reactive sync
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser));
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        const prevSession = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ ...prevSession, user: updatedUser })
        );

        // Notify other components or tabs with the updated payload
        window.dispatchEvent(
          new CustomEvent('agrisence_profile_updated', { detail: updatedUser })
        );

        setUser(updatedUser);
        setIsLoading(false);
        return { data: { user: updatedUser }, error: null };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || 'Failed to update profile' };
      }
    },
    [user]
  );

  /**
   * IN-APP PASSWORD RESET (Others Tab)
   */
  const changePasswordInApp = useCallback(async (oldPass: string, newPass: string) => {
    setIsLoading(true);
    try {
      const currentFbUser = auth.currentUser;
      if (!currentFbUser || !currentFbUser.email) {
        throw new Error('No active authenticated session. Please sign in again.');
      }

      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentFbUser.email, oldPass);
      await reauthenticateWithCredential(currentFbUser, credential);

      // Update password
      await updatePassword(currentFbUser, newPass);

      // Record metadata in Firestore
      const userRef = doc(db, 'users', currentFbUser.uid);
      await updateDoc(userRef, {
        passwordChangedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      setIsLoading(false);
      return { error: null };
    } catch (err: any) {
      setIsLoading(false);
      let msg = err.message || 'Failed to change password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect current password. Please check and try again.';
      }
      return { error: msg };
    }
  }, []);

  /**
   * ACCOUNT DELETION (Others Tab)
   */
  const deleteUserAccount = useCallback(async (password: string) => {
    setIsLoading(true);
    try {
      const currentFbUser = auth.currentUser;
      if (!currentFbUser || !currentFbUser.email) {
        throw new Error('No active user found.');
      }

      // Re-authenticate before permanent deletion
      const credential = EmailAuthProvider.credential(currentFbUser.email, password);
      await reauthenticateWithCredential(currentFbUser, credential);

       // Remove all user-owned platform and portal records server-side before
       // deleting the Firebase identity.
       await callPrivatePortal('deleteAccountData');

      // Delete Firebase Auth user
      await deleteUser(currentFbUser);

      // Clear sessions
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: null }));

      setUser(null);
      setIsLoading(false);
      return { error: null };
    } catch (err: any) {
      setIsLoading(false);
      let msg = err.message || 'Failed to delete account.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect password. Account deletion aborted.';
      }
      return { error: msg };
    }
  }, []);

  /**
   * LOGOUT
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth).catch(() => {});
      clearPortalRole();
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('agrisence_profile_updated', { detail: null }));

      setUser(null);
      setPendingAction(null);
      setIsLoading(false);

      // Trigger pop up notification
      triggerAuthToast({
        type: 'signed_out',
        title: 'Logged Out Successfully',
        description: 'You have been securely signed out of your Agronomic session.',
      });

      return { error: null };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Logout failed' };
    }
  }, []);

  /**
   * CAPABILITY GATE ENGINE
   */
  const requireAuth = useCallback(
    (action: () => void, featureTitle = 'Agronomic Capability', featureDescription = '') => {
      if (user) {
        action();
      } else {
        setPendingAction(() => action);
        setAuthModalTitle(featureTitle);
        setAuthModalDescription(featureDescription);
        setAuthModalOpen(true);
      }
    },
    [user]
  );

  const openAuthModal = useCallback(
    (
      featureTitle = 'Agronomic Capability',
      featureDescription = '',
      onSuccess?: () => void,
      initialTab?: 'signin' | 'signup' | 'forgot'
    ) => {
      if (onSuccess) {
        setPendingAction(() => onSuccess);
      }
      setAuthModalTitle(featureTitle);
      setAuthModalDescription(featureDescription);
      setAuthModalInitialTab(initialTab);
      setAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingAction(null);
    setAuthModalInitialTab(undefined);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,
    changePasswordInApp,
    deleteUserAccount,
    isProfileModalOpen,
    openProfileModal,
    closeProfileModal,
    requireAuth,
    authModalOpen,
    authModalTitle,
    authModalDescription,
    authModalInitialTab,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
