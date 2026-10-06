import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Report } from '../screens/CitizenSecondaryScreens';
import type { ReportStatus } from '../types/report';
import type { AiAdvisory } from './ai';

export type AdminRole = 'admin' | 'inspector' | 'citizen';
export type StaffMember = { id: string; email?: string; displayName?: string; role: 'inspector' };
export type UserAccount = { id: string; email?: string; displayName?: string; role: AdminRole };

export function subscribeToRole(_uid: string, email: string | null, onRole: (role: AdminRole) => void) {
  if (!email?.trim()) {
    onRole('citizen');
    return () => undefined;
  }
  return onSnapshot(query(collection(db, 'users'), where('email', '==', email.trim())), (snapshot) => {
    const roles = snapshot.docs.map((item) => item.data()?.role);
    onRole(roles.includes('admin') ? 'admin' : roles.includes('inspector') ? 'inspector' : 'citizen');
  }, () => onRole('citizen'));
}

export function subscribeToAllReports(onReports: (reports: Report[]) => void, onError: () => void) {
  return onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (snapshot) => {
    onReports(snapshot.docs.map((item) => ({ ...(item.data() as Report), id: item.id })));
  }, onError);
}

export function subscribeToStaffDirectory(onStaff: (staff: StaffMember[]) => void, onError: () => void) {
  return onSnapshot(query(collection(db, 'users'), where('role', '==', 'inspector')), (snapshot) => {
    const unique = new Map<string, StaffMember>();
    snapshot.docs.forEach((item) => {
      const data = item.data() as Partial<Omit<StaffMember, 'id'>>;
      const role = data.role;
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
      if (role !== 'inspector' || (!email && !displayName) || /fieldPaths|^\.?$/.test(`${email} ${displayName}`)) return;
      const member = { id: item.id, email: email || undefined, displayName: displayName || undefined, role } satisfies StaffMember;
      const key = email || displayName.toLowerCase();
      if (!unique.has(key)) unique.set(key, member);
    });
    onStaff(Array.from(unique.values()).sort((a, b) => `${a.displayName ?? ''}${a.email ?? ''}`.localeCompare(`${b.displayName ?? ''}${b.email ?? ''}`)));
  }, onError);
}

export function subscribeToUserDirectory(onUsers: (users: UserAccount[]) => void, onError: () => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map((item) => {
      const data = item.data() as Partial<Omit<UserAccount, 'id'>>;
      const role = data.role === 'admin' || data.role === 'inspector' ? data.role : 'citizen';
      return {
        id: item.id,
        email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : undefined,
        displayName: typeof data.displayName === 'string' ? data.displayName.trim() : undefined,
        role,
      } satisfies UserAccount;
    }).sort((a, b) => `${a.displayName ?? ''}${a.email ?? ''}`.localeCompare(`${b.displayName ?? ''}${b.email ?? ''}`));
    onUsers(users);
  }, onError);
}

export async function updateReportStatus(reportId: string, status: ReportStatus, adminId: string, reviewNote?: string) {
  await updateDoc(doc(db, 'reports', reportId), {
    status,
    reviewedBy: adminId,
    reviewedAt: new Date(),
    ...(reviewNote?.trim() ? { reviewNote: reviewNote.trim() } : {}),
  });
}

export async function updateReportAiAdvisory(reportId: string, advisory: AiAdvisory) {
  await updateDoc(doc(db, 'reports', reportId), {
    ...advisory,
    aiAnalyzedAt: serverTimestamp(),
  });
}

export async function updateReportAssignment(reportId: string, inspector: string, adminId: string) {
  await updateDoc(doc(db, 'reports', reportId), {
    assignedInspector: inspector.trim() || null,
    assignedBy: adminId,
    assignedAt: new Date(),
  });
}

export async function requestReportClarification(reportId: string, message: string, adminId: string) {
  await updateDoc(doc(db, 'reports', reportId), {
    status: 'Under Review',
    clarificationRequest: message.trim(),
    clarificationRequestedBy: adminId,
    clarificationRequestedAt: serverTimestamp(),
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
  });
}

export async function submitInvestigationFindings(reportId: string, findings: { observation: string; severity: string; action: string; evidenceUrl?: string | null }, inspectorId: string) {
  await updateDoc(doc(db, 'reports', reportId), {
    investigationObservation: findings.observation.trim(),
    investigationSeverity: findings.severity,
    investigationAction: findings.action.trim(),
    investigationEvidenceUrl: findings.evidenceUrl ?? null,
    investigationSubmittedBy: inspectorId,
    investigationSubmittedAt: serverTimestamp(),
    status: 'Verified',
  });
}
