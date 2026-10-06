const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();

function normaliseEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

exports.createInspectorAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in as an administrator.');

  const adminRecord = await getFirestore().doc(`users/${request.auth.uid}`).get();
  if (!adminRecord.exists || adminRecord.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only administrators can create inspector accounts.');
  }

  const displayName = typeof request.data?.displayName === 'string' ? request.data.displayName.trim() : '';
  const email = normaliseEmail(request.data?.email);
  if (displayName.length < 2) throw new HttpsError('invalid-argument', 'Enter the inspector name.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError('invalid-argument', 'Enter a valid inspector email address.');

  let user;
  try {
    user = await getAuth().createUser({ email, displayName, password: `${crypto.randomUUID()}!Aa9` });
  } catch (error) {
    if (error?.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'An account with this email already exists.');
    throw new HttpsError('internal', 'The inspector account could not be created.');
  }

  await getFirestore().doc(`users/${user.uid}`).set({
    email,
    displayName,
    role: 'inspector',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  return { uid: user.uid };
});
