import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardStackParamList } from '../../navigation/types';
import { themeColors } from '../../utils/theme';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';
import { formatDate } from '../../utils/format';

type OnboardingDetailRouteProp = RouteProp<DashboardStackParamList, 'OnboardingDetail'>;
type OnboardingDetailNavProp = StackNavigationProp<DashboardStackParamList, 'OnboardingDetail'>;

interface CandidateProfile {
  id: string;
  name: string;
  role: string;
  dept: string;
  email: string;
  status: 'offer_released' | 'documents_submitted' | 'ready_to_join';
  bgv: 'initiated' | 'pending' | 'completed';
  date: string;
  orientationDate: string;
  orientationTime: string;
  facilitator: string;
  onboardingNotes: string;
}

export const OnboardingDetailScreen: React.FC = () => {
  const route = useRoute<OnboardingDetailRouteProp>();
  const navigation = useNavigation<OnboardingDetailNavProp>();
  const { candidateId } = route.params;

  // Mock candidates database mapping candidateId to high fidelity datasets
  const mockCandidates: Record<string, CandidateProfile> = {
    'c-1': {
      id: 'c-1',
      name: 'Maya Iyer',
      role: 'UX Designer',
      dept: 'Design',
      email: 'maya.iyer@demo.aurorahr.in',
      status: 'ready_to_join',
      bgv: 'completed',
      date: '2026-06-01',
      orientationDate: '2026-06-01',
      orientationTime: '10:00 AM',
      facilitator: 'Sarah Johnson',
      onboardingNotes: 'UX portfolio approved by Design head. BGV cleared cleanly.',
    },
    'c-2': {
      id: 'c-2',
      name: 'Rajesh Kumar',
      role: 'Node Developer',
      dept: 'Engineering',
      email: 'rajesh.kumar@demo.aurorahr.in',
      status: 'documents_submitted',
      bgv: 'pending',
      date: '2026-06-15',
      orientationDate: '2026-06-15',
      orientationTime: '11:00 AM',
      facilitator: 'Sarah Johnson',
      onboardingNotes: 'Waiting for academic checks references response.',
    },
    'c-3': {
      id: 'c-3',
      name: 'Elena Rostova',
      role: 'Product Manager',
      dept: 'Operations',
      email: 'elena.rostova@demo.aurorahr.in',
      status: 'offer_released',
      bgv: 'initiated',
      date: '2026-07-01',
      orientationDate: '',
      orientationTime: '',
      facilitator: '',
      onboardingNotes: 'Offer released. Candidate has signed, uploading documentation.',
    },
  };

  const candidateData = mockCandidates[candidateId] || mockCandidates['c-1'];

  // Candidate Data State Engine
  const [candidate, setCandidate] = useState<CandidateProfile>(candidateData);

  // Background Verification State
  const [bgvChecks, setBgvChecks] = useState([
    { id: '1', name: 'Identity & Address Check', details: 'Aadhaar Card, PAN Card, and Address verify', status: candidateData.bgv === 'completed' ? 'cleared' : 'cleared' },
    { id: '2', name: 'Academic Record Check', details: 'B.Tech/M.Tech Graduation Degree check', status: candidateData.bgv === 'completed' ? 'cleared' : 'pending' },
    { id: '3', name: 'Prior Employment Check', details: 'Past 2 employers reference response verify', status: candidateData.bgv === 'completed' ? 'cleared' : 'pending' },
    { id: '4', name: 'Criminal Registry Check', details: 'National police record verification database', status: candidateData.bgv === 'completed' ? 'cleared' : 'initiated' },
  ]);

  // Uploaded Candidate Credentials State
  const [documents, setDocuments] = useState([
    { id: 'd-1', name: 'Signed_Offer_Letter.pdf', type: 'OFFER LETTER', size: '340 KB', status: 'verified', date: '2026-05-20' },
    { id: 'd-2', name: 'Aadhaar_ID_Card.pdf', type: 'IDENTITY PROOF', size: '190 KB', status: 'verified', date: '2026-05-21' },
    { id: 'd-3', name: 'Graduation_Degree.pdf', type: 'ACADEMIC PROOF', size: '480 KB', status: candidateData.bgv === 'completed' ? 'verified' : 'pending_review', date: '2026-05-22' },
    { id: 'd-4', name: 'Relieving_Letter_Prev.pdf', type: 'EMPLOYMENT PROOF', size: '280 KB', status: 'pending_review', date: '2026-05-24' },
  ]);

  // Edit / Input States
  const [notesEditing, setNotesEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(candidate.onboardingNotes);

  const [schedEditing, setSchedEditing] = useState(false);
  const [tempDate, setTempDate] = useState(candidate.orientationDate);
  const [tempTime, setTempTime] = useState(candidate.orientationTime);
  const [tempFacil, setTempFacil] = useState(candidate.facilitator);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('ACADEMIC PROOF');

  // Dynamic Metrics
  const clearedBgvCount = bgvChecks.filter(c => c.status === 'cleared').length;
  const totalBgvCount = bgvChecks.length;
  const bgvPct = Math.round((clearedBgvCount / totalBgvCount) * 100);

  const verifiedDocsCount = documents.filter(d => d.status === 'verified').length;
  const totalDocsCount = documents.length;

  const handleToggleBgvCheck = (id: string) => {
    setBgvChecks(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'cleared' ? 'pending' : 'cleared';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleDocumentVerify = (id: string, action: 'verify' | 'reject') => {
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: action === 'verify' ? 'verified' : 'rejected' };
      }
      return d;
    }));
  };

  const handleSaveNotes = () => {
    setCandidate(prev => ({ ...prev, onboardingNotes: tempNotes }));
    setNotesEditing(false);
    Alert.alert('Saved', 'Candidate onboarding notes updated.');
  };

  const handleSaveSchedule = () => {
    setCandidate(prev => ({
      ...prev,
      orientationDate: tempDate,
      orientationTime: tempTime,
      facilitator: tempFacil,
    }));
    setSchedEditing(false);
    Alert.alert('Scheduled', `Orientation session successfully assigned to candidate for ${tempDate} at ${tempTime}.`);
  };

  const handleAddDocument = () => {
    if (!newDocName) {
      Alert.alert('Error', 'Please provide a file name.');
      return;
    }
    const suffix = newDocName.toLowerCase().endsWith('.pdf') ? '' : '.pdf';
    const newDoc = {
      id: `d-${Date.now()}`,
      name: `${newDocName}${suffix}`,
      type: newDocType,
      size: '180 KB',
      status: 'pending_review',
      date: new Date().toISOString().split('T')[0],
    };
    setDocuments(prev => [...prev, newDoc]);
    setNewDocName('');
    setUploadModalVisible(false);
    Alert.alert('Success', `Mock document "${newDoc.name}" uploaded to candidate credentials folder.`);
  };

  const handleConfirmOnboard = () => {
    Alert.alert(
      'Complete Onboarding',
      `Mark candidate ${candidate.name} as successfully joined the organization?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Joining',
          onPress: () => {
            setCandidate(prev => ({ ...prev, status: 'ready_to_join', bgv: 'completed' }));
            Alert.alert('Joined!', `${candidate.name} is now onboarded. Corporate credentials will be dispatched.`);
          },
        },
      ]
    );
  };

  // Timeline Progress Nodes (5 states)
  const steps = [
    { label: 'Offer Released', comp: true },
    { label: 'Doc Upload', comp: candidate.status !== 'offer_released' },
    { label: 'BGV Check', comp: candidate.bgv === 'completed', active: candidate.status === 'documents_submitted' },
    { label: 'Orientation', comp: candidate.bgv === 'completed' && candidate.orientationDate !== '', active: candidate.bgv === 'completed' && candidate.orientationDate === '' },
    { label: 'Joined', comp: candidate.status === 'ready_to_join' && candidate.bgv === 'completed', locked: candidate.status !== 'ready_to_join' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs for 3D glass look */}
      <View style={styles.bgBlobLeft} />
      <View style={styles.bgBlobRight} />

      {/* Header Frosted Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Onboarding</Text>
        <View style={styles.badgeContainer}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: candidate.status === 'ready_to_join' ? 'rgba(16, 185, 129, 0.08)' : candidate.status === 'documents_submitted' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: candidate.status === 'ready_to_join' ? '#10b981' : candidate.status === 'documents_submitted' ? '#3b82f6' : '#f59e0b'
            }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              { color: candidate.status === 'ready_to_join' ? '#10b981' : candidate.status === 'documents_submitted' ? '#3b82f6' : '#f59e0b' }
            ]}>
              {candidate.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Candidate Profile Summary */}
        <CommonCard style={styles.profileSummary} variant="glass">
          <View style={styles.profileRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{candidate.name.split(' ').map(n => n[0]).join('')}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{candidate.name}</Text>
              <Text style={styles.profileSubtitle}>{candidate.role} • {candidate.dept}</Text>
              <Text style={styles.profileDetailMeta}>Email: {candidate.email} • Join Date: {formatDate(candidate.date, 'dd/MM/yyyy')}</Text>
            </View>
          </View>
        </CommonCard>

        {/* 5-State Horizontal Progress Tracker */}
        <View style={styles.trackerWrapper}>
          <Text style={styles.sectionTitle}>Onboarding Phase Progress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackerScroll}>
            {steps.map((st, idx) => (
              <View key={idx} style={styles.trackerNode}>
                <View style={styles.trackerConnectorRow}>
                  {idx > 0 && <View style={[styles.trackerLine, st.comp && styles.trackerLineComp]} />}
                  <View style={[
                    styles.trackerIndicator,
                    st.comp && styles.trackerIndicatorComp,
                    st.active && styles.trackerIndicatorActive,
                  ]}>
                    {st.comp ? (
                      <MaterialCommunityIcons name="check" size={12} color="#ffffff" />
                    ) : (
                      <Text style={[styles.trackerNumText, (st.active || !st.locked) && styles.trackerNumTextActive]}>{idx + 1}</Text>
                    )}
                  </View>
                  {idx < steps.length - 1 && <View style={[styles.trackerLine, steps[idx + 1].comp && styles.trackerLineComp]} />}
                </View>
                <Text style={[
                  styles.trackerLabel,
                  st.comp && styles.trackerLabelComp,
                  st.active && styles.trackerLabelActive
                ]}>{st.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Key KPI Stats Grid */}
        <View style={styles.metricRow}>
          <CommonCard style={styles.metricCard} variant="glass">
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>BGV Checks</Text>
              <MaterialCommunityIcons name="shield-check" size={18} color="#0A66C2" />
            </View>
            <Text style={styles.metricValue}>{bgvPct}%</Text>
            <Text style={styles.metricSubtitle}>{clearedBgvCount}/{totalBgvCount} Cleared</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${bgvPct}%`, backgroundColor: '#0A66C2' }]} />
            </View>
          </CommonCard>

          <CommonCard style={styles.metricCard} variant="glass">
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Doc Verification</Text>
              <MaterialCommunityIcons name="folder-outline" size={18} color="#10b981" />
            </View>
            <Text style={styles.metricValue}>{verifiedDocsCount}/{totalDocsCount}</Text>
            <Text style={styles.metricSubtitle}>Documents Approved</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.round((verifiedDocsCount / totalDocsCount) * 100)}%`, backgroundColor: '#10b981' }]} />
            </View>
          </CommonCard>
        </View>

        {/* BGV Checks List */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Background Verification Checklist</Text>
          <Text style={styles.sectionSubtitleText}>Tap a checklist item to verify or revoke its clearance.</Text>
          <View style={{ marginTop: 12 }}>
            {bgvChecks.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.checklistRow, c.status === 'cleared' && styles.checklistRowCleared]}
                onPress={() => handleToggleBgvCheck(c.id)}
                activeOpacity={0.75}
              >
                <View style={styles.checklistLeft}>
                  <View style={[
                    styles.checkboxRing,
                    c.status === 'cleared' && styles.checkboxRingCleared
                  ]}>
                    {c.status === 'cleared' && <MaterialCommunityIcons name="check" size={12} color="#ffffff" />}
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.checkTitle, c.status === 'cleared' && styles.checkTitleCleared]}>{c.name}</Text>
                    <Text style={styles.checkDesc}>{c.details}</Text>
                  </View>
                </View>
                <View style={[
                  styles.miniBadge,
                  { backgroundColor: c.status === 'cleared' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)' }
                ]}>
                  <Text style={[
                    styles.miniBadgeText,
                    { color: c.status === 'cleared' ? '#10b981' : '#f59e0b' }
                  ]}>
                    {c.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </CommonCard>

        {/* Candidate Documents Verification */}
        <CommonCard style={styles.detailBox} variant="glass">
          <View style={styles.docsHeader}>
            <Text style={styles.detailBoxTitle}>Credentials & Uploads</Text>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => setUploadModalVisible(true)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
              <Text style={styles.uploadBtnText}>Add Document</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            {documents.map(d => (
              <View key={d.id} style={styles.docRow}>
                <View style={styles.docRowLeft}>
                  <View style={styles.docIconWrapper}>
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color="#ef4444" />
                  </View>
                  <View style={styles.docInfoGroup}>
                    <Text style={styles.docName} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.docMeta}>{d.type} • {d.size} • {d.date}</Text>
                  </View>
                </View>
                <View style={styles.docActionsCol}>
                  <View style={[
                    styles.docStatusBadge,
                    {
                      backgroundColor: d.status === 'verified' ? 'rgba(16, 185, 129, 0.06)' : d.status === 'rejected' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                      borderColor: d.status === 'verified' ? '#10b981' : d.status === 'rejected' ? '#ef4444' : '#f59e0b'
                    }
                  ]}>
                    <Text style={[
                      styles.docStatusText,
                      { color: d.status === 'verified' ? '#10b981' : d.status === 'rejected' ? '#ef4444' : '#f59e0b' }
                    ]}>
                      {d.status.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>

                  {d.status === 'pending_review' && (
                    <View style={styles.docActionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.smallDocBtn, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                        onPress={() => handleDocumentVerify(d.id, 'verify')}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="check" size={14} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallDocBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                        onPress={() => handleDocumentVerify(d.id, 'reject')}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </CommonCard>

        {/* Orientation & Onboarding Scheduler */}
        <CommonCard style={styles.detailBox} variant="glass">
          <View style={styles.notesHeader}>
            <Text style={styles.detailBoxTitle}>Day-1 Orientation Session</Text>
            <TouchableOpacity onPress={() => {
              if (schedEditing) {
                handleSaveSchedule();
              } else {
                setTempDate(candidate.orientationDate);
                setTempTime(candidate.orientationTime);
                setTempFacil(candidate.facilitator);
                setSchedEditing(true);
              }
            }} activeOpacity={0.7}>
              <MaterialCommunityIcons name={schedEditing ? "content-save-outline" : "pencil-outline"} size={20} color="#0A66C2" />
            </TouchableOpacity>
          </View>

          {schedEditing ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={styles.formLabel}>Orientation Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.notesInput} value={tempDate} onChangeText={setTempDate} placeholder="e.g. 2026-06-01" />

              <Text style={styles.formLabel}>Orientation Time</Text>
              <TextInput style={styles.notesInput} value={tempTime} onChangeText={setTempTime} placeholder="e.g. 10:00 AM" />

              <Text style={styles.formLabel}>Session Facilitator</Text>
              <TextInput style={styles.notesInput} value={tempFacil} onChangeText={setTempFacil} placeholder="e.g. Sarah Johnson" />
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled Date</Text>
                <Text style={styles.infoValue}>{candidate.orientationDate || 'Not Scheduled'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled Time</Text>
                <Text style={styles.infoValue}>{candidate.orientationTime || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Facilitator</Text>
                <Text style={styles.infoValue}>{candidate.facilitator || 'N/A'}</Text>
              </View>
            </View>
          )}
        </CommonCard>

        {/* HR Operations Notes */}
        <CommonCard style={styles.detailBox} variant="glass">
          <View style={styles.notesHeader}>
            <Text style={styles.detailBoxTitle}>Onboarding Comments</Text>
            <TouchableOpacity onPress={() => {
              if (notesEditing) {
                handleSaveNotes();
              } else {
                setTempNotes(candidate.onboardingNotes);
                setNotesEditing(true);
              }
            }} activeOpacity={0.7}>
              <MaterialCommunityIcons name={notesEditing ? "content-save-outline" : "pencil-outline"} size={20} color="#0A66C2" />
            </TouchableOpacity>
          </View>

          {notesEditing ? (
            <TextInput
              style={styles.notesInput}
              value={tempNotes}
              onChangeText={setTempNotes}
              multiline={true}
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.notesText}>{candidate.onboardingNotes || 'No notes compiled for this candidate.'}</Text>
          )}
        </CommonCard>

        {/* Final Boarding Confirmation Trigger */}
        <CommonButton
          title="Confirm Joining & Onboard"
          onPress={handleConfirmOnboard}
          variant="success"
          style={{ height: 48, borderRadius: 14, marginTop: 12, marginBottom: 20 }}
          disabled={candidate.status === 'ready_to_join' && candidate.bgv === 'completed'}
        />
      </ScrollView>

      {/* Upload Document Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setUploadModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Mock Credential</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Credential Type</Text>
            <View style={styles.selectorContainer}>
              {['ACADEMIC PROOF', 'IDENTITY PROOF', 'EMPLOYMENT PROOF'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.selectorOption, newDocType === t && styles.selectorOptionActive]}
                  onPress={() => setNewDocType(t)}
                >
                  <Text style={[styles.selectorText, newDocType === t && styles.selectorTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Document File Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Master_Degree_Verification"
                placeholderTextColor="#94a3b8"
                value={newDocName}
                onChangeText={setNewDocName}
              />
            </View>

            <CommonButton
              title="Add Mock File"
              onPress={handleAddDocument}
              variant="primary"
              style={{ marginTop: 24, height: 48, borderRadius: 12 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 12,
    flex: 1,
  },
  badgeContainer: {
    justifyContent: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  profileSummary: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 16,
    fontWeight: '800',
    color: themeColors.primary,
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  profileSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  profileDetailMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  trackerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  trackerScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trackerNode: {
    alignItems: 'center',
    width: 90,
  },
  trackerConnectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  trackerLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
  },
  trackerLineComp: {
    backgroundColor: '#10b981',
  },
  trackerIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerIndicatorComp: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  trackerIndicatorActive: {
    borderColor: '#3b82f6',
    borderWidth: 2.5,
  },
  trackerNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  trackerNumTextActive: {
    color: '#3b82f6',
  },
  trackerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  trackerLabelComp: {
    color: '#10b981',
  },
  trackerLabelActive: {
    color: '#3b82f6',
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  metricSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  detailBox: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionSubtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -8,
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'space-between',
  },
  checklistRowCleared: {
    backgroundColor: 'rgba(16, 185, 129, 0.01)',
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRingCleared: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  checkTitleCleared: {
    color: '#64748B',
    textDecorationLine: 'none',
  },
  checkDesc: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  miniBadge: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
  },
  miniBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  docsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'space-between',
  },
  docRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfoGroup: {
    marginLeft: 12,
    flex: 1,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  docMeta: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  docActionsCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  docStatusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  docStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  docActionButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  smallDocBtn: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  notesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 16,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  selectorOption: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  selectorOptionActive: {
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
    borderColor: '#0A66C2',
  },
  selectorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  selectorTextActive: {
    color: '#0A66C2',
  },
  inputContainer: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    marginTop: 8,
  },
  input: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  bgBlobLeft: {
    position: 'absolute',
    top: 60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(10, 102, 194, 0.05)',
    zIndex: -1,
  },
  bgBlobRight: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    zIndex: -1,
  },
});
