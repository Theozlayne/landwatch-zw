import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CitizenReport } from '../types/report';

export function getReportGuardMessage(
  reports: Array<{ category?: string; description?: string; status?: string; createdAt?: { toDate?: () => Date } | null }>,
  category: string,
  description: string,
): string | null {
  const now = Date.now();
  const normalized = description.trim().toLowerCase().replace(/\s+/g, ' ');
  const recentPending = reports.filter((report) => {
    const created = report.createdAt?.toDate?.()?.getTime() ?? 0;
    return now - created < 24 * 60 * 60 * 1000 && report.status !== 'Draft' && report.status !== 'Rejected' && report.status !== 'Resolved';
  });
  if (recentPending.length >= 3) return 'You already have three reports awaiting review from the last 24 hours. Please wait for an update before submitting another report.';
  const similar = recentPending.some((report) => report.category === category && (report.description ?? '').trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
  return similar ? 'A matching report is already under review. Submit again only if this concerns a new incident.' : null;
}

export async function createCitizenReport(
  report: Omit<CitizenReport, 'createdAt' | 'status'>,
  existingReportId?: string,
): Promise<string> {
  const reportRef = existingReportId ? doc(db, 'reports', existingReportId) : doc(collection(db, 'reports'));
  await setDoc(reportRef, { ...report, status: 'Submitted', aiAnalysisStatus: report.evidenceUrl ? (report.aiAnalysisStatus ?? 'unavailable') : 'not_requested', aiQuality: report.evidenceUrl ? (report.aiQuality ?? 'unavailable') : 'unavailable', updatedAt: serverTimestamp(), ...(!existingReportId ? { createdAt: serverTimestamp() } : {}) }, { merge: true });

  return reportRef.id;
}

export async function saveCitizenDraft(
  report: Omit<CitizenReport, 'createdAt' | 'status'>,
  draftId?: string,
): Promise<string> {
  const draftRef = draftId ? doc(db, 'reports', draftId) : doc(collection(db, 'reports'));
  await setDoc(draftRef, { ...report, status: 'Draft', updatedAt: serverTimestamp(), ...(!draftId ? { createdAt: serverTimestamp() } : {}) }, { merge: true });
  return draftRef.id;
}

export function subscribeToCitizenReports(
  citizenId: string,
  onReports: (reports: Array<CitizenReport & { id: string }>) => void,
): () => void {
  const reportsQuery = query(collection(db, 'reports'), where('citizenId', '==', citizenId));
  return onSnapshot(reportsQuery, (snapshot) => {
    const reports = snapshot.docs
      .map((document) => ({ id: document.id, ...(document.data() as CitizenReport) }))
      .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0));
    onReports(reports);
  });
}
