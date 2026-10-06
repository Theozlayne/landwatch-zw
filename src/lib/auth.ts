import {
  AuthError,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; message: string; code?: string };

function friendlyAuthMessage(error: unknown): string {
  const code = (error as AuthError)?.code;
  console.error('[LandWatch ZW] Firebase authentication error:', error);
  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least six characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is not correct.';
    case 'auth/network-request-failed':
      return 'Connection failed. Check your network and try again.';
    case 'auth/operation-not-allowed':
      return 'Sign-in is temporarily unavailable. Please try again later.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/api-key-not-valid':
      return 'Sign-in is temporarily unavailable. Please try again later.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Sign-in is temporarily unavailable. Please try again later.';
    case 'auth/configuration-not-found':
      return 'Sign-in is temporarily unavailable. Please try again later.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google sign-in is not available on this device yet. Use email and password instead.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/internal-error':
      return 'Firebase could not complete the request. Check your connection and try again.';
    default:
      return 'We could not complete that request. Please try again.';
  }
}

export async function registerCitizen(email: string, password: string): Promise<AuthResult> {
  try {
    const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true, user: credentials.user };
  } catch (error) {
    return { ok: false, message: friendlyAuthMessage(error), code: (error as AuthError)?.code };
  }
}

export async function loginCitizen(email: string, password: string): Promise<AuthResult> {
  try {
    const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true, user: credentials.user };
  } catch (error) {
    return { ok: false, message: friendlyAuthMessage(error), code: (error as AuthError)?.code };
  }
}

export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credentials = await signInWithPopup(auth, provider);
    return { ok: true, user: credentials.user };
  } catch (error) {
    return { ok: false, message: friendlyAuthMessage(error), code: (error as AuthError)?.code };
  }
}

export async function logoutCitizen(): Promise<void> {
  await signOut(auth);
}
