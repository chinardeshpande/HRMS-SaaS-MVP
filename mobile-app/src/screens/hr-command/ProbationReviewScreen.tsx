import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardStackParamList } from '../../navigation/types';
import { themeColors } from '../../utils/theme';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';
import { formatDate } from '../../utils/format';

type ProbationReviewRouteProp = RouteProp<DashboardStackParamList, 'ProbationReview'>;
type ProbationReviewNavProp = StackNavigationProp<DashboardStackParamList, 'ProbationReview'>;

interface ProbationProfile {
  id: string;
  name: string;
  role: string;
  dept: string;
  manager: string;
  joinedDate: string;
  probationEnd: string;
  status: 'in_probation' | 'review_pending' | 'confirmed' | 'extended';
  durationMonths: number;
  managerFeedback: string;
  hrNotes: string;
}

export const ProbationReviewScreen: React.FC = () => {
  const route = useRoute<ProbationReviewRouteProp>();
  const navigation = useNavigation<ProbationReviewNavProp>();
  const { probationId } = route.params;

  // Mock database for probation profiles
  const mockProbationers: Record<string, ProbationProfile> = {
    'p-1': {
      id: 'p-1',
      name: 'Aarav Mehta',
      role: 'Node Developer',
      dept: 'Engineering',
      manager: 'Sarah Manager',
      joinedDate: '2026-02-25',
      probationEnd: '2026-05-25',
      status: 'review_pending',
      durationMonths: 3,
      managerFeedback: 'Excellent engineering skillset. Aarav took ownership of 3 microservices and has integrated well with the team. Strongly recommend confirmation.',
      hrNotes: 'Awaiting final verification of past payslips from prev employment BGV check before confirming.',
    },
    'p-2': {
      id: 'p-2',
      name: 'Meera Nair',
      role: 'UI Designer',
      dept: 'Design',
      manager: 'Sarah Manager',
      joinedDate: '2026-04-10',
      probationEnd: '2026-07-10',
      status: 'in_probation',
      durationMonths: 3,
      managerFeedback: 'Meera shows high creative promise but has minor communication delays. Let us review closely as we approach Q3.',
      hrNotes: 'BGV cleared. Day-1 orientation checklist closed.',
    },
  };

  const currentData = mockProbationers[probationId] || mockProbationers['p-1'];

  // State Engine
  const [probation, setProbation] = useState<ProbationProfile>(currentData);
  const [decision, setDecision] = useState<'confirm' | 'extend' | 'terminate'>('confirm');
  const [extensionMonths, setExtensionMonths] = useState<number>(3);

  // Skill assessments metrics
  const [ratings, setRatings] = useState([
    { id: '1', skill: 'Technical Capability', score: 4.5 },
    { id: '2', skill: 'Attendance & Diligence', score: 4.2 },
    { id: '3', skill: 'Team Collaboration', score: 4.6 },
    { id: '4', skill: 'Demeanor & Culture Fit', score: 4.5 },
  ]);

  // HR comments state
  const [hrNotesEditing, setHrNotesEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(probation.hrNotes);

  const handleUpdateRating = (id: string, newScore: number) => {
    setRatings(prev => prev.map(r => r.id === id ? { ...r, score: newScore } : r));
  };

  const handleSaveHrNotes = () => {
    setProbation(prev => ({ ...prev, hrNotes: tempNotes }));
    setHrNotesEditing(false);
    Alert.alert('Saved', 'Review feedback notes successfully committed.');
  };

  const handleSubmitAssessment = () => {
    if (decision === 'confirm') {
      Alert.alert(
        'Confirm Employment',
        `Are you sure you want to officially confirm ${probation.name} as a full-time employee?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Joining',
            onPress: () => {
              setProbation(prev => ({ ...prev, status: 'confirmed' }));
              Alert.alert('Success', `Employee confirmation issued! Welcome packet and FTI confirmation letters scheduled to compile.`);
            }
          }
        ]
      );
    } else if (decision === 'extend') {
      Alert.alert(
        'Extend Probation',
        `Extend probation period for ${probation.name} by another ${extensionMonths} months?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Extend',
            onPress: () => {
              setProbation(prev => ({ ...prev, status: 'extended' }));
              Alert.alert('Extended', `Probation duration successfully updated to +${extensionMonths} months. Revised timeline calculated.`);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Initiate Separation',
        `Are you sure you want to terminate the probationary contract for ${probation.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Discharge',
            style: 'destructive',
            onPress: () => {
              Alert.alert('Discharged', `Separation ticket created. HR clearance flow initiated.`);
            }
          }
        ]
      );
    }
  };

  // Timeline Progress Nodes
  const steps = [
    { label: 'Probation Active', comp: true },
    { label: 'Manager Review', comp: true },
    { label: 'HR Final Audit', comp: probation.status === 'confirmed', active: probation.status !== 'confirmed' },
    { label: 'Confirmed', comp: probation.status === 'confirmed', locked: probation.status !== 'confirmed' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs for 3D glass look */}
      <View style={styles.bgBlobLeft} />
      <View style={styles.bgBlobRight} />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Probation Assessment</Text>
        <View style={styles.badgeContainer}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: probation.status === 'confirmed' ? 'rgba(16, 185, 129, 0.08)' : probation.status === 'extended' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: probation.status === 'confirmed' ? '#10b981' : probation.status === 'extended' ? '#ef4444' : '#f59e0b'
            }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              { color: probation.status === 'confirmed' ? '#10b981' : probation.status === 'extended' ? '#ef4444' : '#f59e0b' }
            ]}>
              {probation.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Info card */}
        <CommonCard style={styles.profileSummary} variant="glass">
          <View style={styles.profileRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{probation.name.split(' ').map(n => n[0]).join('')}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{probation.name}</Text>
              <Text style={styles.profileSubtitle}>{probation.role} • {probation.dept}</Text>
              <Text style={styles.profileDetailMeta}>Joined: {formatDate(probation.joinedDate, 'dd/MM/yyyy')} • Duration: {probation.durationMonths} Months</Text>
            </View>
          </View>
        </CommonCard>

        {/* 4-State horizontal timeline tracker */}
        <View style={styles.trackerWrapper}>
          <Text style={styles.sectionTitle}>Confirmation Timeline Process</Text>
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

        {/* Manager feedback panel */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Manager Recommendation & Notes</Text>
          <View style={styles.managerProfileTinyRow}>
            <MaterialCommunityIcons name="account-tie-outline" size={18} color="#0A66C2" style={{ marginRight: 6 }} />
            <Text style={styles.managerNameTiny}>Evaluation by Sarah Manager</Text>
          </View>
          <Text style={styles.commentsText}>"{probation.managerFeedback}"</Text>
        </CommonCard>

        {/* Core skills competency scoring grid */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Core Competency Assessment</Text>
          <Text style={styles.sectionSubtitleText}>Tap stars to evaluate core parameters during review.</Text>
          
          <View style={{ marginTop: 12, gap: 12 }}>
            {ratings.map(r => (
              <View key={r.id} style={styles.ratingRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.skillLabel}>{r.skill}</Text>
                  <Text style={styles.skillScoreValue}>Score: {r.score} / 5</Text>
                </View>
                <View style={styles.starsWrapper}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => probation.status !== 'confirmed' && handleUpdateRating(r.id, star)}
                      activeOpacity={0.7}
                      disabled={probation.status === 'confirmed'}
                    >
                      <MaterialCommunityIcons 
                        name={star <= Math.round(r.score) ? "star" : "star-outline"} 
                        size={20} 
                        color={star <= Math.round(r.score) ? "#eab308" : "#cbd5e1"} 
                        style={{ marginRight: 2 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </CommonCard>

        {/* Decision Center Card */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>HR Decision Center</Text>
          <Text style={styles.sectionSubtitleText}>Select the final employment confirmation outcome below.</Text>
          
          <View style={styles.decisionStrip}>
            <TouchableOpacity
              style={[
                styles.decisionButton, 
                decision === 'confirm' && styles.decisionBtnActiveSuccess,
                probation.status === 'confirmed' && styles.disabledBtn
              ]}
              onPress={() => setDecision('confirm')}
              disabled={probation.status === 'confirmed'}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="account-check-outline" size={18} color={decision === 'confirm' ? '#ffffff' : '#64748B'} />
              <Text style={[styles.decisionBtnText, decision === 'confirm' && styles.decisionBtnTextActive]}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.decisionButton, 
                decision === 'extend' && styles.decisionBtnActiveWarn,
                probation.status === 'confirmed' && styles.disabledBtn
              ]}
              onPress={() => setDecision('extend')}
              disabled={probation.status === 'confirmed'}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="calendar-clock" size={18} color={decision === 'extend' ? '#ffffff' : '#64748B'} />
              <Text style={[styles.decisionBtnText, decision === 'extend' && styles.decisionBtnTextActive]}>Extend</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.decisionButton, 
                decision === 'terminate' && styles.decisionBtnActiveError,
                probation.status === 'confirmed' && styles.disabledBtn
              ]}
              onPress={() => setDecision('terminate')}
              disabled={probation.status === 'confirmed'}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="account-remove-outline" size={18} color={decision === 'terminate' ? '#ffffff' : '#64748B'} />
              <Text style={[styles.decisionBtnText, decision === 'terminate' && styles.decisionBtnTextActive]}>Discharge</Text>
            </TouchableOpacity>
          </View>

          {/* Extension selector */}
          {decision === 'extend' && (
            <View style={styles.extensionBox}>
              <Text style={styles.formLabel}>Select Extension Period</Text>
              <View style={styles.extensionSelectorRow}>
                {[1, 3, 6].map(months => (
                  <TouchableOpacity
                    key={months}
                    style={[styles.extensionOpt, extensionMonths === months && styles.extensionOptActive]}
                    onPress={() => setExtensionMonths(months)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.extensionOptText, extensionMonths === months && styles.extensionOptTextActive]}>{months} Month{months > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </CommonCard>

        {/* HR Notes comments card */}
        <CommonCard style={styles.detailBox} variant="glass">
          <View style={styles.notesHeader}>
            <Text style={styles.detailBoxTitle}>HR Audit & Decision Comments</Text>
            <TouchableOpacity onPress={() => {
              if (hrNotesEditing) {
                handleSaveHrNotes();
              } else {
                setTempNotes(probation.hrNotes);
                setHrNotesEditing(true);
              }
            }} activeOpacity={0.7}>
              <MaterialCommunityIcons name={hrNotesEditing ? "content-save-outline" : "pencil-outline"} size={20} color="#0A66C2" />
            </TouchableOpacity>
          </View>

          {hrNotesEditing ? (
            <TextInput
              style={styles.notesInput}
              value={tempNotes}
              onChangeText={setTempNotes}
              multiline={true}
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.notesText}>{probation.hrNotes || 'No HR audit remarks registered yet.'}</Text>
          )}
        </CommonCard>

        {/* Action submission trigger */}
        <CommonButton
          title={
            decision === 'confirm' ? 'Submit Confirmation' :
            decision === 'extend' ? `Confirm Extension (+${extensionMonths} Months)` : 'Process Separation'
          }
          onPress={handleSubmitAssessment}
          variant={decision === 'confirm' ? 'success' : decision === 'extend' ? 'primary' : 'danger'}
          style={{ height: 48, borderRadius: 14, marginTop: 12, marginBottom: 20 }}
          disabled={probation.status === 'confirmed'}
        />
      </ScrollView>
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
  managerProfileTinyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  managerNameTiny: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A66C2',
  },
  commentsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  skillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  skillScoreValue: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  starsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decisionStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  decisionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  decisionBtnActiveSuccess: {
    backgroundColor: '#10b981',
  },
  decisionBtnActiveWarn: {
    backgroundColor: '#f59e0b',
  },
  decisionBtnActiveError: {
    backgroundColor: '#ef4444',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  decisionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  decisionBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  extensionBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  extensionSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  extensionOpt: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extensionOptActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#f59e0b',
  },
  extensionOptText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  extensionOptTextActive: {
    color: '#f59e0b',
    fontWeight: '800',
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
  },
  notesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 16,
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
