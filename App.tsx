import { StatusBar } from 'expo-status-bar';
import { Ionicons } from './src/components/Ionicons';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  Image,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CitizenReportScreen } from './src/screens/CitizenReportScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './src/lib/firebase';
import { logoutCitizen } from './src/lib/auth';
import { subscribeToCitizenReports } from './src/services/reports';
import { CitizenActivityScreen, CitizenMapScreen, CitizenProfileScreen, Report, Tab } from './src/screens/CitizenSecondaryScreens';
import { CitizenReportDetailScreen } from './src/screens/CitizenReportDetailScreen';
import { ReportSubmittedScreen } from './src/screens/ReportSubmittedScreen';
import { DataLoadingScreen } from './src/screens/DataLoadingScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { reportDate, reportLocation } from './src/utils/reportPresentation';
import { resolveCityName } from './src/utils/geocoding';
import { requestReportClarification, submitInvestigationFindings, subscribeToAllReports, subscribeToRole, subscribeToStaffDirectory, subscribeToUserDirectory, updateReportAiAdvisory, updateReportAssignment, updateReportStatus, type AdminRole, type StaffMember, type UserAccount } from './src/services/admin';
import { analyseEvidence } from './src/services/ai';
import { playNotificationSound } from './src/lib/notificationSound';

type IconName = ComponentProps<typeof Ionicons>['name'];

const colors = {
  green900: '#06291A',
  green800: '#093D26',
  green700: '#0E5232',
  green600: '#14663E',
  green50: '#EDF6F1',
  gold500: '#A9812F',
  ink900: '#14181A',
  ink600: '#47525A',
  ink400: '#7C878E',
  ink100: '#E8ECEE',
  app: '#F4F6F7',
  white: '#FFFFFF',
};

type ActionCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  onPress?: () => void;
};

function ActionCard({ eyebrow, title, description, icon, onPress }: ActionCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
      <View style={styles.actionIcon}><Ionicons name={icon} size={23} color={colors.white} /></View>
      <View style={styles.actionCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'gold' | 'neutral' }) {
  return <View style={[styles.statusPill, tone === 'green' && styles.statusGreen, tone === 'gold' && styles.statusGold]}><Text style={styles.statusText}>{label}</Text></View>;
}

function formatClock(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [showReportNotice, setShowReportNotice] = useState(false);
  const [screen, setScreen] = useState<'home' | 'report'>('home');
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [draftToEdit, setDraftToEdit] = useState<Report | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  // Kept false so the original inline modal remains dormant while the animated sheet is used below.
  const showNotifications = false;
  const setShowNotifications = (_show: boolean) => undefined;
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [role, setRole] = useState<AdminRole>('citizen');
  const [roleReady, setRoleReady] = useState(false);
  const [adminReports, setAdminReports] = useState<Report[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [staffDirectory, setStaffDirectory] = useState<StaffMember[]>([]);
  const [userDirectory, setUserDirectory] = useState<UserAccount[]>([]);
  const [adminCreatingReport, setAdminCreatingReport] = useState(false);
  const [adminSubmittedReportId, setAdminSubmittedReportId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => formatClock(new Date()));
  const [homeLocationName, setHomeLocationName] = useState<string | null>(null);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';
  const initials = displayName.slice(0, 2).toUpperCase();
  const [noticeIndex, setNoticeIndex] = useState(0);
  const noticeSlide = useRef(new Animated.Value(0)).current;
  const notificationSheet = useRef(new Animated.Value(0)).current;
  const citizenReportsInitialized = useRef(false);
  const citizenReportStateRef = useRef<Record<string, string>>({});
  const notices = [
    { title: 'Report responsibly', body: 'Only submit information you believe is accurate. Your report will be reviewed by Ministry officials.' },
    { title: 'Protect our wetlands', body: 'Wetlands help manage water and support wildlife. Reporting encroachment helps preserve these important areas.' },
    { title: 'Land supports communities', body: 'Responsible land use protects homes, livelihoods and public services for communities across Zimbabwe.' },
    { title: 'Every report matters', body: 'Clear descriptions and accurate locations help officials assess land activities more effectively.' },
  ];

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      Animated.timing(noticeSlide, { toValue: 420, duration: 420, useNativeDriver: true }).start(() => {
        setNoticeIndex((current) => (current + 1) % notices.length);
        noticeSlide.setValue(-420);
        Animated.timing(noticeSlide, { toValue: 0, duration: 420, useNativeDriver: true }).start();
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [noticeSlide, user]);

  useEffect(() => {
    if (!showNotificationSheet) return;
    notificationSheet.setValue(0);
    Animated.spring(notificationSheet, {
      toValue: 1,
      friction: 9,
      tension: 68,
      useNativeDriver: true,
    }).start();
  }, [notificationSheet, showNotificationSheet]);

  useEffect(() => {
    const latest = reports[0];
    if (!latest) { setHomeLocationName(null); return; }
    if (latest.locationName?.trim()) { setHomeLocationName(latest.locationName.trim()); return; }
    if (latest.latitude == null || latest.longitude == null) { setHomeLocationName(null); return; }
    let active = true;
    setHomeLocationName(null);
    void resolveCityName(latest.latitude, latest.longitude).then((name) => {
      if (active) setHomeLocationName(name);
    });
    return () => { active = false; };
  }, [reports]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatClock(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.setAttribute('data-landwatch-scrollbars', 'hidden');
    style.textContent = `html, body, #root, #root * { scrollbar-width: none; -ms-overflow-style: none; } html::-webkit-scrollbar, body::-webkit-scrollbar, #root::-webkit-scrollbar, #root *::-webkit-scrollbar { width: 0; height: 0; display: none; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setRoleReady(false);
    if (!nextUser) setRole('citizen');
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!user) {
      citizenReportsInitialized.current = false;
      citizenReportStateRef.current = {};
      setReports([]);
      setReportsLoading(false);
      return;
    }
    citizenReportsInitialized.current = false;
    citizenReportStateRef.current = {};
    setReportsLoading(true);
    return subscribeToCitizenReports(user.uid, (nextReports) => {
      const signatureFor = (report: Report) => JSON.stringify([
        report.status,
        report.reviewNote ?? null,
        report.clarificationRequest ?? null,
        report.investigationObservation ?? null,
        report.investigationSeverity ?? null,
        report.investigationAction ?? null,
        report.assignedInspector ?? null,
        report.assignedFacilitator ?? null,
        report.aiAnalysisStatus ?? null,
        report.aiSuggestedCategory ?? null,
      ]);
      const nextState = Object.fromEntries(nextReports.map((report) => [report.id, signatureFor(report)]));

      if (citizenReportsInitialized.current) {
        const caseWasUpdated = nextReports.some((report) => (
          citizenReportStateRef.current[report.id] !== undefined
          && citizenReportStateRef.current[report.id] !== nextState[report.id]
        ));
        if (caseWasUpdated) {
          setHasNewNotification(true);
          setShowNotificationSheet(true);
          void playNotificationSound();
        }
      } else {
        citizenReportsInitialized.current = true;
      }

      citizenReportStateRef.current = nextState;
      setReports(nextReports);
      setReportsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) { setRole('citizen'); setRoleReady(true); return; }
    let active = true;
    const unsubscribe = subscribeToRole(user.uid, user.email, (nextRole) => { if (!active) return; setRole(nextRole); setRoleReady(true); });
    return () => { active = false; unsubscribe?.(); };
  }, [user]);

  useEffect(() => {
    if (!user || role === 'citizen') { setAdminReports([]); return; }
    setAdminLoading(true); setAdminError('');
    return subscribeToAllReports((nextReports) => { const identity = (user.email || user.uid).toLowerCase(); const scoped = role === 'admin' ? nextReports : nextReports.filter((report) => report.assignedInspector?.toLowerCase() === identity); setAdminReports(scoped); setAdminLoading(false); }, () => { setAdminError('Reports could not be loaded. Check your connection and try again.'); setAdminLoading(false); });
  }, [role, user]);

  useEffect(() => {
    if (!user || role !== 'admin') { setStaffDirectory([]); return; }
    return subscribeToStaffDirectory(setStaffDirectory, () => setStaffDirectory([]));
  }, [role, user]);

  useEffect(() => {
    if (!user || role !== 'admin') { setUserDirectory([]); return; }
    return subscribeToUserDirectory(setUserDirectory, () => setUserDirectory([]));
  }, [role, user]);

  const handleTab = (tab: Tab) => {
    if (tab === 'Report') {
      setActiveTab('Report');
      setScreen('report');
      return;
    }
    setScreen('home');
    setActiveTab(tab);
  };

  const openNotification = (report: Report) => {
    setShowNotifications(false);
    setHasNewNotification(false);
    setSelectedReport(report);
  };

  if (!authReady) return <DataLoadingScreen title="Preparing LandWatch" />;
  if (!user) return <AuthScreen />;
  if (!roleReady) return <DataLoadingScreen title="Preparing your workspace" />;
  if (role !== 'citizen') {
    if (adminSubmittedReportId) return <ReportSubmittedScreen reportId={adminSubmittedReportId} onViewReports={() => { setAdminSubmittedReportId(null); setAdminCreatingReport(false); }} onHome={() => setAdminSubmittedReportId(null)} />;
    if (adminCreatingReport) return <CitizenReportScreen citizenId={user.uid} existingReports={adminReports} onBack={() => setAdminCreatingReport(false)} onSubmitted={(id) => { setAdminCreatingReport(false); setAdminSubmittedReportId(id); }} onDraftSaved={() => setAdminCreatingReport(false)} />;
    return <AdminScreen reports={adminReports} loading={adminLoading} error={adminError} adminId={user.uid} adminEmail={user.email} staffRole={role} staffDirectory={staffDirectory} userDirectory={userDirectory} onUpdateStatus={updateReportStatus} onAssignReport={updateReportAssignment} onRequestClarification={requestReportClarification} onSubmitFindings={submitInvestigationFindings} onAnalyseEvidence={async (reportId, evidenceUrl) => { const advisory = await analyseEvidence(evidenceUrl); await updateReportAiAdvisory(reportId, advisory); if (advisory.aiAnalysisStatus === 'unavailable') throw new Error('AI service unavailable'); }} onCreateReport={() => setAdminCreatingReport(true)} onSignOut={() => void logoutCitizen()} />;
  }

  if (activeTab === 'Map' && reportsLoading) return <DataLoadingScreen title="Loading reported locations" />;
  if (activeTab === 'Map') return <CitizenMapScreen reports={reports} onTab={handleTab} />;
  if (submittedReportId) return <ReportSubmittedScreen reportId={submittedReportId} onViewReports={() => { setSubmittedReportId(null); setActiveTab('Activity'); }} onHome={() => { setSubmittedReportId(null); setActiveTab('Home'); }} />;
  if (selectedReport) return <CitizenReportDetailScreen report={selectedReport} onBack={() => setSelectedReport(null)} onTab={handleTab} />;
  if (activeTab === 'Activity' && reportsLoading) return <DataLoadingScreen />;
  if (activeTab === 'Activity') return <CitizenActivityScreen reports={reports} onTab={handleTab} onEditDraft={(draft) => { setDraftToEdit(draft); setActiveTab('Report'); setScreen('report'); }} onOpenReport={setSelectedReport} />;
  if (activeTab === 'Profile') return <CitizenProfileScreen user={user} onTab={handleTab} />;

  if (screen === 'report') {
    return <CitizenReportScreen citizenId={user.uid} existingReports={reports} draft={draftToEdit} onBack={() => { setScreen('home'); setActiveTab('Home'); }} onSubmitted={(id) => { void playNotificationSound(); setDraftToEdit(null); setSubmittedReportId(id); }} onDraftSaved={() => { setDraftToEdit(null); setScreen('home'); setActiveTab('Home'); }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.crestFrame}>
            <Image source={require('./coat-of-arms-transparent.png')} style={styles.crest} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.brandTitle}>LandWatch ZW</Text>
            <Text style={styles.brandSubtitle}>Ministry of Local Government and Public Works</Text>
          </View>
        </View>
        <Pressable accessibilityLabel="Notifications" onPress={() => { setHasNewNotification(false); setShowNotificationSheet(true); }} style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={21} color={colors.white} />
          {hasNewNotification && <View style={styles.notificationDot} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.overline}>CITIZEN PORTAL</Text>
            <Text style={styles.greeting}>Good morning, {displayName}</Text>
            <Text style={styles.subheading}>Help protect Zimbabwe’s land and communities.</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        </View>

        <Animated.View style={[styles.notice, { transform: [{ translateX: noticeSlide }] }]}>
          <View style={styles.noticeMark}><Text style={styles.noticeMarkText}>i</Text></View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>{notices[noticeIndex].title}</Text>
            <Text style={styles.noticeBody}>{notices[noticeIndex].body}</Text>
          </View>
        </Animated.View>

        <View style={styles.reportHeading}><Text style={styles.sectionTitle}>Make a report</Text><Text style={styles.digitalTime}>{currentTime}</Text></View>
        <ActionCard
          eyebrow="NEW REPORT"
          title="Report a land activity"
          description="Share a location, description and supporting evidence."
          icon="add"
          onPress={() => setScreen('report')}
        />

        <Text style={styles.sectionTitle}>Your activity</Text>
        <View style={styles.statsRow}>
          {reportsLoading ? <><View style={styles.statCard}><View style={styles.skeletonValue} /><View style={styles.skeletonLabel} /></View><View style={styles.statCard}><View style={styles.skeletonValue} /><View style={styles.skeletonLabel} /></View></> : <><View style={styles.statCard}><Text style={styles.statValue}>{String(reports.length).padStart(2, '0')}</Text><Text style={styles.statLabel}>Reports submitted</Text></View><View style={styles.statCard}><Text style={styles.statValue}>--</Text><Text style={styles.statLabel}>Reward points</Text></View></>}
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent reports</Text><Pressable onPress={() => handleTab('Activity')} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}><Text style={styles.viewAll}>View all</Text></Pressable></View>
        {reportsLoading ? <View style={styles.reportCard}><View style={styles.skeletonLine} /><View style={styles.skeletonLineWide} /><View style={styles.skeletonLine} /></View> : reports.length === 0 ? <View style={styles.emptyHome}><Ionicons name="document-text-outline" size={25} color={colors.green700} /><Text style={styles.emptyHomeTitle}>No reports yet</Text><Text style={styles.emptyHomeText}>Your submitted reports will appear here.</Text></View> : <View style={styles.reportCard}>
          <View style={styles.reportTop}><Text style={styles.reportReference}>LW-{reports[0]?.id.slice(0, 6).toUpperCase()}</Text><StatusPill label={reports[0]?.status ?? 'Submitted'} tone={reports[0]?.status === 'Resolved' ? 'green' : 'gold'} /></View>
           <Text style={styles.reportTitle}>{reports[0]?.category}</Text>
           <Text style={styles.reportMeta}>{homeLocationName || reportLocation(reports[0])} · {reportDate(reports[0]?.createdAt)}</Text>
          <View style={styles.progressTrack}><View style={styles.progressValue} /></View>
          <Text style={styles.progressLabel}>Open report details</Text>
        </View>}

        <View style={[styles.reportCard, { display: 'none' }]}>
          <View style={styles.reportTop}><Text style={styles.reportReference}>LW-2026-0031</Text><StatusPill label="Resolved" tone="green" /></View>
          <Text style={styles.reportTitle}>Unauthorised land subdivision</Text>
          <Text style={styles.reportMeta}>Gweru · 08 August 2026</Text>
          <View style={styles.resolvedRow}><Text style={styles.check}>✓</Text><Text style={styles.progressLabel}>Investigation completed</Text></View>
        </View>

        <View style={styles.disclaimer}><Text style={styles.disclaimerText}>Academic prototype · Subject to Ministry approval</Text></View>
      </ScrollView>

      <View style={styles.tabBar}>
        {['Home', 'Map', 'Report', 'Activity', 'Profile'].map((tab) => (
          <Pressable key={tab} onPress={() => handleTab(tab as Tab)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <Ionicons name={tab === 'Report' ? 'add-circle-outline' : tab === 'Home' ? 'home-outline' : tab === 'Map' ? 'map-outline' : tab === 'Activity' ? 'list-outline' : 'person-outline'} size={21} color={activeTab === tab ? colors.green700 : colors.ink400} />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {showReportNotice && <Pressable style={styles.modalOverlay} onPress={() => setShowReportNotice(false)}><View style={styles.modal}><Text style={styles.modalEyebrow}>NEW REPORT</Text><Text style={styles.modalTitle}>Ready to report a land activity?</Text><Text style={styles.modalBody}>The next steps will collect the category, location, evidence and description of the activity.</Text><Pressable style={styles.modalButton} onPress={() => setShowReportNotice(false)}><Text style={styles.modalButtonText}>Continue</Text></Pressable><Pressable onPress={() => setShowReportNotice(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable></View></Pressable>}
      {showNotifications && <Pressable style={styles.modalOverlay} onPress={() => setShowNotifications(false)}><View style={styles.notificationPanel}><View style={styles.notificationPanelHeader}><View><Text style={styles.modalEyebrow}>UPDATES</Text><Text style={styles.notificationPanelTitle}>Report notifications</Text></View><Pressable onPress={() => setShowNotifications(false)}><Ionicons name="close" size={22} color={colors.ink900} /></Pressable></View>{reports.length === 0 ? <Text style={styles.notificationEmpty}>Your report updates will appear here.</Text> : reports.slice(0, 4).map((report) => <View key={report.id} style={styles.notificationRow}><View style={styles.notificationMark}><Ionicons name={report.status === 'Resolved' ? 'checkmark' : 'document-text-outline'} size={17} color={colors.green700} /></View><View style={styles.notificationCopy}><Text style={styles.notificationTitle}>Report {report.status.toLowerCase()}</Text><Text style={styles.notificationBody}>LW-{report.id.slice(0, 6).toUpperCase()} · {report.category}</Text></View></View>)}</View></Pressable>}
      {showNotificationSheet && <View style={styles.modalOverlay}><Pressable accessibilityLabel="Close notifications" style={styles.modalBackdrop} onPress={() => setShowNotificationSheet(false)} /><Animated.View style={[styles.notificationPanel, { transform: [{ translateY: notificationSheet.interpolate({ inputRange: [0, 1], outputRange: [260, 0] }) }] }]}><View style={styles.notificationHandle} /><View style={styles.notificationPanelHeader}><View><Text style={styles.modalEyebrow}>UPDATES</Text><Text style={styles.notificationPanelTitle}>Report notifications</Text></View><Pressable accessibilityLabel="Close notifications" hitSlop={10} onPress={() => setShowNotificationSheet(false)}><Ionicons name="close" size={22} color={colors.ink900} /></Pressable></View>{reports.length === 0 ? <Text style={styles.notificationEmpty}>Your report updates will appear here.</Text> : reports.slice(0, 4).map((report) => <Pressable key={report.id} accessibilityRole="button" onPress={() => openNotification(report)} style={({ pressed }) => [styles.notificationRow, pressed && styles.pressed]}><View style={styles.notificationMark}><Ionicons name={report.status === 'Resolved' ? 'checkmark' : 'document-text-outline'} size={17} color={colors.green700} /></View><View style={styles.notificationCopy}><Text style={styles.notificationTitle}>Report {report.status.toLowerCase()}</Text><Text style={styles.notificationBody}>LW-{report.id.slice(0, 6).toUpperCase()} · {report.category}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.ink400} /></Pressable>)}</Animated.View></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeletonValue: { width: 42, height: 25, borderRadius: 6, backgroundColor: '#DDE4E1' },
  skeletonLabel: { width: '75%', height: 10, borderRadius: 5, backgroundColor: '#E3E8E9', marginTop: 7 },
  skeletonLine: { width: '34%', height: 10, borderRadius: 5, backgroundColor: '#E3E8E9', marginBottom: 14 },
  skeletonLineWide: { width: '72%', height: 15, borderRadius: 5, backgroundColor: '#E3E8E9', marginBottom: 12 },
  safeArea: { flex: 1, backgroundColor: colors.app },
  header: { backgroundColor: colors.green900, paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  crestFrame: { width: 43, height: 43, borderRadius: 9, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: 11, overflow: 'hidden' },
  crest: { width: 38, height: 38 },
  brandTitle: { color: colors.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  brandSubtitle: { color: '#B7D5C5', fontSize: 9, marginTop: 3, maxWidth: 210 },
  notificationButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  notificationIcon: { color: colors.white, fontSize: 25, lineHeight: 25, transform: [{ rotate: '45deg' }] },
  notificationDot: { position: 'absolute', right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#DCC189', borderWidth: 1, borderColor: colors.green900 },
  content: { padding: 20, paddingBottom: 32, width: '100%', maxWidth: 920, alignSelf: 'center' },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  overline: { color: colors.green700, fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 5 },
  greeting: { color: colors.ink900, fontSize: 23, fontWeight: '700', letterSpacing: -0.4 },
  subheading: { color: colors.ink600, fontSize: 13, marginTop: 6, maxWidth: 275 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D6EBE0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A9D5C0' },
  avatarText: { color: colors.green800, fontWeight: '700', fontSize: 14 },
  notice: { flexDirection: 'row', backgroundColor: colors.green50, borderLeftWidth: 3, borderLeftColor: colors.green600, borderRadius: 8, padding: 13, marginBottom: 24 },
  noticeMark: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.green600, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  noticeMarkText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: colors.green800, fontWeight: '700', fontSize: 13, marginBottom: 3 },
  noticeBody: { color: colors.ink600, fontSize: 12, lineHeight: 17 },
  sectionTitle: { color: colors.ink900, fontSize: 17, fontWeight: '700', marginBottom: 11 },
  reportHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  digitalTime: { color: colors.ink400, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 11, fontVariant: ['tabular-nums'] },
  actionCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D5DADD', marginBottom: 25, shadowColor: '#14181A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  actionIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.green700, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  actionIconText: { color: colors.white, fontSize: 28, fontWeight: '300', marginTop: -2 },
  actionCopy: { flex: 1 },
  eyebrow: { color: colors.green700, fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginBottom: 3 },
  actionTitle: { color: colors.ink900, fontSize: 16, fontWeight: '700' },
  actionDescription: { color: colors.ink600, fontSize: 12, marginTop: 3 },
  chevron: { color: colors.green700, fontSize: 28, fontWeight: '300', paddingLeft: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { backgroundColor: colors.white, borderRadius: 11, padding: 15, flex: 1, borderWidth: 1, borderColor: '#D5DADD' },
  statValue: { color: colors.green700, fontSize: 25, fontWeight: '700' },
  statLabel: { color: colors.ink600, fontSize: 11, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: colors.green700, fontSize: 12, fontWeight: '700', marginBottom: 11 },
  reportCard: { backgroundColor: colors.white, borderRadius: 11, padding: 15, borderWidth: 1, borderColor: '#D5DADD', marginBottom: 11 },
  reportTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reportReference: { color: colors.ink400, fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  statusPill: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 9, backgroundColor: colors.ink100 },
  statusGreen: { backgroundColor: '#D6EBE0' },
  statusGold: { backgroundColor: '#F6EEDD' },
  statusText: { color: colors.ink600, fontSize: 10, fontWeight: '700' },
  reportTitle: { color: colors.ink900, fontSize: 14, fontWeight: '700' },
  reportMeta: { color: colors.ink600, fontSize: 11, marginTop: 4 },
  progressTrack: { height: 5, backgroundColor: colors.ink100, borderRadius: 3, marginTop: 14 },
  progressValue: { width: '48%', height: 5, backgroundColor: colors.gold500, borderRadius: 3 },
  progressLabel: { color: colors.ink600, fontSize: 11, marginTop: 7 },
  resolvedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  check: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.green600, color: colors.white, textAlign: 'center', lineHeight: 19, fontSize: 11, fontWeight: '700', marginRight: 7 },
  disclaimer: { alignItems: 'center', marginTop: 13, marginBottom: 4 },
  disclaimerText: { color: colors.ink400, fontSize: 10 },
  tabBar: { height: 70, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#D5DADD', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 4 },
  tab: { alignItems: 'center', justifyContent: 'center', minWidth: 55 },
  tabIcon: { color: colors.ink400, fontSize: 20, height: 25 },
  tabLabel: { color: colors.ink400, fontSize: 10, fontWeight: '500' },
  tabActive: { color: colors.green700, fontWeight: '700' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 20 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,41,26,0.46)' },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalEyebrow: { color: colors.green700, fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginBottom: 7 },
  modalTitle: { color: colors.ink900, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  modalBody: { color: colors.ink600, fontSize: 14, lineHeight: 21, marginBottom: 20 },
  modalButton: { backgroundColor: colors.green700, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  notificationPanel: { backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: colors.ink900, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 14 },
  notificationHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#C7D0D0', alignSelf: 'center', marginBottom: 16 },
  notificationPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  notificationPanelTitle: { color: colors.ink900, fontSize: 21, fontWeight: '700' },
  notificationEmpty: { color: colors.ink600, fontSize: 13, paddingVertical: 18 },
  notificationRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.ink100, paddingVertical: 13, gap: 10 },
  notificationMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.green50, alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1 },
  notificationTitle: { color: colors.ink900, fontSize: 13, fontWeight: '700' },
  notificationBody: { color: colors.ink600, fontSize: 11, marginTop: 3 },
  emptyHome: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink100, borderRadius: 11, padding: 20, alignItems: 'center' },
  emptyHomeTitle: { color: colors.ink900, fontSize: 14, fontWeight: '700', marginTop: 8 },
  emptyHomeText: { color: colors.ink400, fontSize: 11, marginTop: 4 },
  cancelText: { color: colors.green700, textAlign: 'center', fontWeight: '700', fontSize: 14, paddingTop: 17 },
});
