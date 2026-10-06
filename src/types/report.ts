export const REPORT_CATEGORIES = [
  'Illegal land occupation',
  'Unauthorized land subdivision',
  'Wetland encroachment',
  'Illegal construction',
  'Suspected fraudulent land allocation',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export type ReportStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Verified' | 'Assigned' | 'Resolved' | 'Rejected';

export type CitizenReport = {
  citizenId: string;
  category: ReportCategory;
  description: string;
  latitude: number | null;
  longitude: number | null;
  locationName?: string | null;
  evidenceUrl: string | null;
  status: ReportStatus;
  aiAnalysisStatus?: 'not_requested' | 'pending' | 'completed' | 'unavailable';
  aiSuggestedCategory?: string | null;
  aiConfidence?: number | null;
  aiDuplicateMatch?: string | null;
  aiDuplicateScore?: number | null;
  aiQuality?: 'clear' | 'unclear' | 'unavailable';
  createdAt?: { toDate?: () => Date } | null;
};
