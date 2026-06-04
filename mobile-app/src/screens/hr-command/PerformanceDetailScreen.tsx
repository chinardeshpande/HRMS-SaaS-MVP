import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardStackParamList } from '../../navigation/types';
import { themeColors } from '../../utils/theme';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';

type PerformanceDetailRouteProp = RouteProp<DashboardStackParamList, 'PerformanceDetail'>;
type PerformanceDetailNavProp = StackNavigationProp<DashboardStackParamList, 'PerformanceDetail'>;

export const PerformanceDetailScreen: React.FC = () => {
  const route = useRoute<PerformanceDetailRouteProp>();
  const navigation = useNavigation<PerformanceDetailNavProp>();
  const { reviewId: _reviewId } = route.params;

  if (!__DEV__) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 }}>Access Restricted</Text>
        <Text style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
          This feature is currently unavailable on mobile for pilot users. Please use the Web Application to perform HR administration.
        </Text>
        <CommonButton title="Go Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'rating' | 'development'>('rating');

  // Premium State Engine reflecting high fidelity appraisal screenshot data
  const [reviewInfo, setReviewInfo] = useState({
    name: 'John Doe',
    code: 'EMP001',
    role: 'Senior Software Engineer',
    dept: 'Engineering',
    manager: 'Sarah Manager',
    cycle: '2026',
    status: 'Mid-Year Completed',
    
    // Ratings Screen Data
    managerRating: 4.5,
    normalizationRating: 4.3,
    finalRating: 4.4,
    ratingCategory: 'EXCEEDS EXPECTATIONS',
    promotionRecommended: true,
    incrementPct: 12,
    managerComments: 'Outstanding performance throughout the year.',

    // Development Screen Data
    skillGaps: ['Cloud Architecture', 'System Design at Scale'],
    trainingRecs: ['AWS Solutions Architect Certification', 'System Design Workshop'],
    careerAspirations: 'Technical Lead role within 2 years',
  });

  // Action Items List (Screenshot 2)
  const [actionItems, setActionItems] = useState([
    { id: 'ai-1', title: 'Complete AWS Certification', timeline: 'Q1 2027', status: 'PENDING' },
    { id: 'ai-2', title: 'Lead 1 major project', timeline: 'Q2 2027', status: 'PENDING' },
  ]);

  // Modal & Editing States
  const [ratingEditing, setRatingEditing] = useState(false);
  const [tempNormalization, setTempNormalization] = useState(reviewInfo.normalizationRating);
  const [tempFinal, setTempFinal] = useState(reviewInfo.finalRating);
  const [tempComments, setTempComments] = useState(reviewInfo.managerComments);
  const [tempIncrement, setTempIncrement] = useState(reviewInfo.incrementPct);
  const [tempPromotion, setTempPromotion] = useState(reviewInfo.promotionRecommended);

  const [actionItemModalVisible, setActionItemModalVisible] = useState(false);
  const [newActionItemTitle, setNewActionItemTitle] = useState('');
  const [newActionItemTimeline, setNewActionItemTimeline] = useState('Q3 2027');

  const [skillGapModalVisible, setSkillGapModalVisible] = useState(false);
  const [newSkillGap, setNewSkillGap] = useState('');

  const handleSaveRatings = () => {
    // Dynamic derivation of Rating Category based on Final Rating
    let category = 'MEETS EXPECTATIONS';
    if (tempFinal >= 4.5) category = 'OUTSTANDING';
    else if (tempFinal >= 4.0) category = 'EXCEEDS EXPECTATIONS';
    else if (tempFinal < 3.0) category = 'NEEDS IMPROVEMENT';

    setReviewInfo(prev => ({
      ...prev,
      normalizationRating: Number(tempNormalization),
      finalRating: Number(tempFinal),
      managerComments: tempComments,
      incrementPct: Number(tempIncrement),
      promotionRecommended: tempPromotion,
      ratingCategory: category
    }));
    setRatingEditing(false);
    Alert.alert('Success', 'Performance rating metrics successfully submitted & normalized.');
  };

  const handleAddActionItem = () => {
    if (!newActionItemTitle) {
      Alert.alert('Required Fields', 'Please specify action item description.');
      return;
    }
    const newItem = {
      id: `ai-${Date.now()}`,
      title: newActionItemTitle,
      timeline: newActionItemTimeline,
      status: 'PENDING'
    };
    setActionItems(prev => [...prev, newItem]);
    setNewActionItemTitle('');
    setActionItemModalVisible(false);
    Alert.alert('Action Item Added', `"${newItem.title}" has been appended to the Development Plan.`);
  };

  const handleDeleteActionItem = (itemId: string, title: string) => {
    Alert.alert(
      'Delete Action Item',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setActionItems(prev => prev.filter(i => i.id !== itemId));
          }
        }
      ]
    );
  };

  const handleToggleActionItemStatus = (itemId: string) => {
    setActionItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: item.status === 'PENDING' ? 'COMPLETED' : 'PENDING' };
      }
      return item;
    }));
  };

  const handleAddSkillGap = () => {
    if (!newSkillGap) return;
    setReviewInfo(prev => ({
      ...prev,
      skillGaps: [...prev.skillGaps, newSkillGap]
    }));
    setNewSkillGap('');
    setSkillGapModalVisible(false);
  };

  const handleDeleteSkillGap = (gap: string) => {
    setReviewInfo(prev => ({
      ...prev,
      skillGaps: prev.skillGaps.filter(g => g !== gap)
    }));
  };

  // Steps for PMS Cycle Progress Tracker
  const steps = [
    { label: 'Goal Setting', comp: true },
    { label: 'Mid-Year', comp: true },
    { label: 'Annual Review', active: activeSubTab === 'rating' },
    { label: 'Rating', active: activeSubTab === 'rating' },
    { label: 'Development', active: activeSubTab === 'development' }
  ];

  const renderRatingView = () => (
    <View style={{ gap: 16 }}>
      {/* 3 Metrics Rating Cards Row */}
      <View style={styles.ratingCardsRow}>
        <CommonCard style={styles.ratingBlockCard} variant="glass">
          <Text style={styles.ratingBlockLabel}>Manager Rating</Text>
          <Text style={styles.ratingBlockValue}>⭐ {reviewInfo.managerRating}</Text>
          <Text style={styles.ratingBlockSub}>Submitted</Text>
        </CommonCard>

        <CommonCard style={styles.ratingBlockCard} variant="glass">
          <Text style={styles.ratingBlockLabel}>Normalization</Text>
          <Text style={[styles.ratingBlockValue, { color: themeColors.primary }]}>⭐ {reviewInfo.normalizationRating}</Text>
          <Text style={styles.ratingBlockSub}>Committee</Text>
        </CommonCard>

        <CommonCard style={styles.ratingBlockCard} variant="glass">
          <Text style={styles.ratingBlockLabel}>Final Rating</Text>
          <Text style={[styles.ratingBlockValue, { color: '#10b981' }]}>⭐ {reviewInfo.finalRating}</Text>
          <Text style={styles.ratingBlockSub}>Authorized</Text>
        </CommonCard>
      </View>

      {/* Category Badge Card */}
      <CommonCard style={styles.detailCard} variant="glass">
        <Text style={styles.detailCardLabel}>Rating Category</Text>
        <View style={styles.categoryBadgeWrapper}>
          <View style={[styles.categoryBadge, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.06)' }]}>
            <Text style={styles.categoryBadgeText}>{reviewInfo.ratingCategory}</Text>
          </View>
        </View>
      </CommonCard>

      {/* Recommendations Card (Promotion & Increment) */}
      <CommonCard style={styles.detailCard} variant="glass">
        <Text style={styles.detailBoxTitle}>Recommendations</Text>
        <View style={styles.recommendationsGrid}>
          <View style={styles.recRow}>
            <Text style={styles.recLabel}>Promotion Recommendation</Text>
            <View style={[
              styles.recBadge,
              { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }
            ]}>
              <Text style={[styles.recBadgeText, { color: '#10b981' }]}>
                {reviewInfo.promotionRecommended ? 'Recommended' : 'Deferred'}
              </Text>
            </View>
          </View>
          <View style={styles.recRow}>
            <Text style={styles.recLabel}>Normalized Increment</Text>
            <Text style={styles.recValueText}>{reviewInfo.incrementPct}% Increment</Text>
          </View>
        </View>
      </CommonCard>

      {/* Manager Comments Card */}
      <CommonCard style={styles.detailCard} variant="glass">
        <Text style={styles.detailBoxTitle}>Manager Comments</Text>
        <Text style={styles.commentsText}>"{reviewInfo.managerComments}"</Text>
      </CommonCard>

      {/* Edit Trigger Panel */}
      {ratingEditing ? (
        <CommonCard style={styles.editCard} variant="glass">
          <Text style={styles.editCardTitle}>Normalize Review Metrics</Text>
          
          <Text style={styles.formLabel}>Normalization Rating (1.0 - 5.0)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(tempNormalization)}
              onChangeText={val => setTempNormalization(Number(val) || 0)}
            />
          </View>

          <Text style={styles.formLabel}>Final Authorized Rating (1.0 - 5.0)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(tempFinal)}
              onChangeText={val => setTempFinal(Number(val) || 0)}
            />
          </View>

          <Text style={styles.formLabel}>Increment Percentage (%)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(tempIncrement)}
              onChangeText={val => setTempIncrement(Number(val) || 0)}
            />
          </View>

          <Text style={styles.formLabel}>Promotion Recommended</Text>
          <View style={styles.selectorContainer}>
            <TouchableOpacity
              style={[styles.selectorOption, tempPromotion && styles.selectorOptionActive]}
              onPress={() => setTempPromotion(true)}
            >
              <Text style={[styles.selectorText, tempPromotion && styles.selectorTextActive]}>Recommended</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectorOption, !tempPromotion && styles.selectorOptionActive]}
              onPress={() => setTempPromotion(false)}
            >
              <Text style={[styles.selectorText, !tempPromotion && styles.selectorTextActive]}>Deferred</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Manager Feedback</Text>
          <TextInput
            style={styles.textArea}
            multiline={true}
            numberOfLines={3}
            value={tempComments}
            onChangeText={setTempComments}
          />

          <View style={styles.editActions}>
            <CommonButton
              title="Cancel"
              onPress={() => setRatingEditing(false)}
              variant="secondary"
              style={{ flex: 1, height: 44, borderRadius: 10 }}
            />
            <CommonButton
              title="Save & Submit"
              onPress={handleSaveRatings}
              variant="primary"
              style={{ flex: 1.5, height: 44, borderRadius: 10 }}
            />
          </View>
        </CommonCard>
      ) : (
        <CommonButton
          title="Tweak & Normalize Ratings"
          onPress={() => {
            setTempNormalization(reviewInfo.normalizationRating);
            setTempFinal(reviewInfo.finalRating);
            setTempComments(reviewInfo.managerComments);
            setTempIncrement(reviewInfo.incrementPct);
            setTempPromotion(reviewInfo.promotionRecommended);
            setRatingEditing(true);
          }}
          variant="primary"
          style={{ height: 48, borderRadius: 14, marginTop: 8 }}
        />
      )}
    </View>
  );

  const renderDevelopmentView = () => (
    <View style={{ gap: 16 }}>
      {/* Skill Gaps Card with custom visual bullets (Screenshot 2) */}
      <CommonCard style={styles.detailCard} variant="glass">
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.detailBoxTitle}>Skill Gaps</Text>
          <TouchableOpacity onPress={() => setSkillGapModalVisible(true)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={themeColors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.gapsList}>
          {reviewInfo.skillGaps.map((gap, idx) => (
            <View key={idx} style={styles.gapRow}>
              <View style={styles.gapLeft}>
                <View style={styles.redDot} />
                <Text style={styles.gapText}>{gap}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteSkillGap(gap)}>
                <MaterialCommunityIcons name="close-circle-outline" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </CommonCard>

      {/* Training Recommendations Card (Screenshot 2) */}
      <CommonCard style={styles.detailCard} variant="glass">
        <Text style={styles.detailBoxTitle}>Training Recommendations</Text>
        <View style={styles.recsList}>
          {reviewInfo.trainingRecs.map((rec, idx) => (
            <View key={idx} style={styles.recCheckRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#0A66C2" style={{ marginRight: 10 }} />
              <Text style={styles.recCheckText}>{rec}</Text>
            </View>
          ))}
        </View>
      </CommonCard>

      {/* Career Aspirations Card (Screenshot 2) */}
      <CommonCard style={styles.detailCard} variant="glass">
        <Text style={styles.detailBoxTitle}>Career Aspirations</Text>
        <View style={styles.aspirationsBox}>
          <Text style={styles.aspirationsText}>{reviewInfo.careerAspirations}</Text>
        </View>
      </CommonCard>

      {/* Action Items List with edit/delete (Screenshot 2) */}
      <CommonCard style={styles.detailCard} variant="glass">
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.detailBoxTitle}>Development Action Items</Text>
          <TouchableOpacity 
            style={styles.blueBtn} 
            onPress={() => setActionItemModalVisible(true)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.blueBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          {actionItems.map(item => (
            <View key={item.id} style={styles.actionItemRow}>
              <TouchableOpacity 
                style={styles.actionItemLeft}
                onPress={() => handleToggleActionItemStatus(item.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.statusIndicatorCircle,
                  item.status === 'COMPLETED' && styles.statusIndicatorCircleCompleted
                ]}>
                  {item.status === 'COMPLETED' && <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />}
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.actionItemTitle, item.status === 'COMPLETED' && styles.actionItemTitleCompleted]}>{item.title}</Text>
                  <Text style={styles.actionItemTimeline}>Timeline: {item.timeline}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.actionItemRight}>
                <View style={[
                  styles.itemStatusBadge,
                  { backgroundColor: item.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.08)' : '#F1F5F9' }
                ]}>
                  <Text style={[
                    styles.itemStatusBadgeText,
                    { color: item.status === 'COMPLETED' ? '#10b981' : '#64748B' }
                  ]}>
                    {item.status}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.actionItemIconBtn}
                  onPress={() => handleDeleteActionItem(item.id, item.title)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </CommonCard>
    </View>
  );

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
        <Text style={styles.headerTitle}>Review Details</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: '#e2fbe8', borderColor: '#10b981' }]}>
            <Text style={[styles.statusBadgeText, { color: '#10b981' }]}>Mid-Year Completed</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card Header */}
        <CommonCard style={styles.profileSummary} variant="glass">
          <View style={styles.profileRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>JD</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{reviewInfo.name}</Text>
              <Text style={styles.profileSubtitle}>{reviewInfo.code} • {reviewInfo.role} • {reviewInfo.dept}</Text>
              <Text style={styles.profileDetailMeta}>Reporting Mgr: {reviewInfo.manager} • Cycle: {reviewInfo.cycle}</Text>
            </View>
          </View>
        </CommonCard>

        {/* Appraisal Progress Tracker Timeline */}
        <View style={styles.trackerWrapper}>
          <Text style={styles.sectionTitle}>Appraisal Progress Tracker</Text>
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
                      <MaterialCommunityIcons name="check" size={14} color="#ffffff" />
                    ) : (
                      <Text style={[styles.trackerNumText, st.active && styles.trackerNumTextActive]}>{idx + 1}</Text>
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

        {/* Sub-Tab Navigation Bar */}
        <View style={styles.subTabStrip}>
          <TouchableOpacity
            style={[styles.subTabButton, activeSubTab === 'rating' && styles.subTabButtonActive]}
            onPress={() => setActiveSubTab('rating')}
            activeOpacity={0.8}
          >
            <Text style={[styles.subTabLabel, activeSubTab === 'rating' && styles.subTabLabelActive]}>Performance Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabButton, activeSubTab === 'development' && styles.subTabButtonActive]}
            onPress={() => setActiveSubTab('development')}
            activeOpacity={0.8}
          >
            <Text style={[styles.subTabLabel, activeSubTab === 'development' && styles.subTabLabelActive]}>Development Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Tab view controller */}
        <View style={{ marginTop: 12 }}>
          {activeSubTab === 'rating' ? renderRatingView() : renderDevelopmentView()}
        </View>
      </ScrollView>

      {/* Add Action Item Modal */}
      <Modal
        visible={actionItemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionItemModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setActionItemModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Action Item</Text>
              <TouchableOpacity onPress={() => setActionItemModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Action Item Title</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Lead AWS Cloud migration"
                placeholderTextColor="#94a3b8"
                value={newActionItemTitle}
                onChangeText={setNewActionItemTitle}
              />
            </View>

            <Text style={styles.formLabel}>Timeline</Text>
            <View style={styles.selectorContainer}>
              {['Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027'].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.selectorOption, newActionItemTimeline === q && styles.selectorOptionActive]}
                  onPress={() => setNewActionItemTimeline(q)}
                >
                  <Text style={[styles.selectorText, newActionItemTimeline === q && styles.selectorTextActive]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CommonButton
              title="Add to Plan"
              onPress={handleAddActionItem}
              variant="primary"
              style={{ marginTop: 24, height: 48, borderRadius: 12 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Skill Gap Modal */}
      <Modal
        visible={skillGapModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSkillGapModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setSkillGapModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Skill Gap</Text>
              <TouchableOpacity onPress={() => setSkillGapModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Skill Area</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kubernetes Cluster scale"
                placeholderTextColor="#94a3b8"
                value={newSkillGap}
                onChangeText={setNewSkillGap}
              />
            </View>

            <CommonButton
              title="Add Skill"
              onPress={handleAddSkillGap}
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
    fontWeight: '700',
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
  subTabStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTabButton: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  subTabButtonActive: {
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
  },
  subTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  subTabLabelActive: {
    color: themeColors.primary,
    fontWeight: '800',
  },
  ratingCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  ratingBlockCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  ratingBlockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  ratingBlockValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginVertical: 8,
  },
  ratingBlockSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  detailCard: {
    padding: 14,
    borderRadius: 16,
  },
  detailCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  categoryBadgeWrapper: {
    alignItems: 'flex-start',
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  recommendationsGrid: {
    gap: 8,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  recBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  recValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  commentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  editCard: {
    padding: 16,
    borderRadius: 16,
    borderColor: 'rgba(10, 102, 194, 0.25)',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  editCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A66C2',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  input: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorOption: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectorOptionActive: {
    borderColor: '#0A66C2',
    backgroundColor: 'rgba(10, 102, 194, 0.06)',
  },
  selectorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  selectorTextActive: {
    color: '#0A66C2',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    height: 70,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gapsList: {
    gap: 10,
    marginTop: 8,
  },
  gapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 10,
  },
  gapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  recsList: {
    gap: 8,
    marginTop: 4,
  },
  recCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recCheckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  aspirationsBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  aspirationsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d28d9',
  },
  blueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  blueBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicatorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicatorCircleCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  actionItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionItemTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  actionItemTimeline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  actionItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemStatusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  actionItemIconBtn: {
    padding: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
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
