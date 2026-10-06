import { sendPasswordResetEmail } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, firebaseApp } from '../lib/firebase';

const functions = getFunctions(firebaseApp);

export async function createInspectorAccount(displayName: string, email: string) {
  const create = httpsCallable<{ displayName: string; email: string }, { uid: string }>(functions, 'createInspectorAccount');
  const result = await create({ displayName: displayName.trim(), email: email.trim().toLowerCase() });
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  return result.data.uid;
}
