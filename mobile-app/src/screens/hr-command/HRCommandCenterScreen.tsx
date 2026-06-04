import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardStackParamList } from '../../navigation/types';
import { themeColors } from '../../utils/theme';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

type HRCommandCenterNavProp = StackNavigationProp<DashboardStackParamList, 'HRCommandCenter'>;

export const HRCommandCenterScreen: React.FC = () => {
  const navigation = useNavigation<HRCommandCenterNavProp>();

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

  const [activeTab, setActiveTab] = useState<'onboarding' | 'performance' | 'exits'>('onboarding');
  const [onboardingSubTab, setOnboardingSubTab] = useState<'pipeline' | 'probation'>('pipeline');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Onboarding pipeline states
  const [candidates, setCandidates] = useState<any[]>([]);
  const [probationers, setProbationers] = useState<any[]>([]);
  // 2. Performance cycle states
  const [reviews, setReviews] = useState<any[]>([]);
  // 3. Exit cases states
  const [exitCases, setExitCases] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock seed data matching high-fidelity SaaS web screenshots
      
      // Onboarding
      setCandidates([
        { id: 'c-1', name: 'Maya Iyer', role: 'UX Designer', dept: 'Design', status: 'ready_to_join', bgv: 'completed', date: '2026-06-01' },
        { id: 'c-2', name: 'Rajesh Kumar', role: 'Node Developer', dept: 'Engineering', status: 'documents_submitted', bgv: 'pending', date: '2026-06-15' },
        { id: 'c-3', name: 'Elena Rostova', role: 'Product Manager', dept: 'Operations', status: 'offer_released', bgv: 'initiated', date: '2026-07-01' },
      ]);

      setProbationers([
        { id: 'p-1', name: 'Aarav Mehta', role: 'Node Developer', dept: 'Engineering', status: 'review_pending', joinedDate: '2026-02-25', probationEnd: '2026-05-25', manager: 'Sarah Manager' },
        { id: 'p-2', name: 'Meera Nair', role: 'UI Designer', dept: 'Design', status: 'in_probation', joinedDate: '2026-04-10', probationEnd: '2026-07-10', manager: 'Sarah Manager' },
      ]);

      // Performance
      setReviews([
        { reviewId: 'r-1', employeeName: 'John Doe', role: 'Senior Software Engineer', managerName: 'Sarah Manager', rating: 4.4, cycle: '2026', status: 'mid_year_completed', selfRating: 4.5, managerRating: 4.5, normalizationRating: 4.3 },
        { reviewId: 'r-2', employeeName: 'Neha Shah', role: 'Quality Analyst', managerName: 'Sarah Manager', rating: 4.1, cycle: '2026', status: 'goals_setting', selfRating: 4.0, managerRating: 4.2, normalizationRating: 4.1 },
      ]);

      // Exits
      setExitCases([
        { id: 'e-1', employeeName: 'Pooja Raman', email: 'pooja.raman.demo@aurorahr.in', dept: 'Finance & Operations', resignationDate: '2026-04-23', lastWorkingDay: '2026-05-25', status: 'clearance_in_progress' },
        { id: 'e-2', employeeName: 'Neha Shah', email: 'neha.shah@aurorahr.in', dept: 'Engineering', resignationDate: '2026-05-11', lastWorkingDay: '2026-06-17', status: 'resignation_approved' },
      ]);
    } catch (err) {
      console.warn('⚠️ HR Command Hub load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExitCount = (status: string) => {
    if (status === 'total') return exitCases.length;
    if (status === 'pending') return exitCases.filter(c => c.status === 'resignation_approved').length; // Mock pending actions
    if (status === 'in_progress') return exitCases.filter(c => c.status === 'clearance_in_progress').length;
    if (status === 'completed') return exitCases.filter(c => c.status === 'settled').length;
    return 0;
  };

  const filteredCandidates = candidates.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProbationers = probationers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredReviews = reviews.filter(r => r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredExits = exitCases.filter(e => e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderOnboardingTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentScroll}>
      {/* Stats Pipeline Grid */}
      <View style={styles.statsGrid}>
        <CommonCard style={styles.statCard} variant="glass">
          <Text style={[styles.statValue, { color: '#0A66C2' }]}>3</Text>
          <Text style={styles.statLabel}>Offered</Text>
        </CommonCard>
        <CommonCard style={styles.statCard} variant="glass">
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>2</Text>
          <Text style={styles.statLabel}>BGV Initiated</Text>
        </CommonCard>
        <CommonCard style={styles.statCard} variant="glass">
          <Text style={[styles.statValue, { color: '#10b981' }]}>1</Text>
          <Text style={styles.statLabel}>Ready to Join</Text>
        </CommonCard>
      </View>

      {/* Sub-Tab Selector Bar for Hiring Pipeline vs Probation Tracker */}
      <View style={styles.subTabStrip}>
        <TouchableOpacity
          style={[styles.subTabButton, onboardingSubTab === 'pipeline' && styles.subTabButtonActive]}
          onPress={() => setOnboardingSubTab('pipeline')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabLabel, onboardingSubTab === 'pipeline' && styles.subTabLabelActive]}>Hiring Pipeline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabButton, onboardingSubTab === 'probation' && styles.subTabButtonActive]}
          onPress={() => setOnboardingSubTab('probation')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabLabel, onboardingSubTab === 'probation' && styles.subTabLabelActive]}>Probation Tracker</Text>
        </TouchableOpacity>
      </View>

      {onboardingSubTab === 'pipeline' ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Onboarding Pipeline</Text>
            <Text style={styles.countText}>{filteredCandidates.length} Active Candidates</Text>
          </View>

          {filteredCandidates.map(cand => (
            <TouchableOpacity
              key={cand.id}
              onPress={() => navigation.navigate('OnboardingDetail', { candidateId: cand.id })}
              activeOpacity={0.85}
            >
              <CommonCard style={styles.itemCard} variant="glass">
                <MaterialCommunityIcons name="account-plus" size={90} color="rgba(10, 102, 194, 0.022)" style={{ position: 'absolute', right: -15, bottom: -15, zIndex: -1 }} />
                <View style={styles.itemHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{cand.name.split(' ').map((n: string) => n[0]).join('')}</Text>
                  </View>
                  <View style={styles.itemTitleGroup}>
                    <Text style={styles.itemTitle}>{cand.name}</Text>
                    <Text style={styles.itemSubtitle}>{cand.role} • {cand.dept}</Text>
                  </View>
                  <StatusBadge status={cand.status === 'ready_to_join' ? 'completed' : 'pending'} />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} style={{ marginLeft: 6 }} />
                </View>

                <View style={styles.divider} />

                <View style={styles.candidateDetailsRow}>
                  <View style={styles.candDetailCol}>
                    <Text style={styles.candDetailLabel}>Expected Join Date</Text>
                    <Text style={styles.candDetailValue}>{formatDate(cand.date, 'MMMM dd, yyyy')}</Text>
                  </View>
                  <View style={styles.candDetailCol}>
                    <Text style={styles.candDetailLabel}>BGV Checklist Status</Text>
                    <View style={styles.bgvBadgeRow}>
                      <MaterialCommunityIcons 
                        name={cand.bgv === 'completed' ? 'check-circle' : 'clock-outline'} 
                        size={14} 
                        color={cand.bgv === 'completed' ? '#10b981' : '#f59e0b'} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.bgvText, { color: cand.bgv === 'completed' ? '#10b981' : '#f59e0b' }]}>
                        {cand.bgv.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </CommonCard>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Probation Reviews</Text>
            <Text style={styles.countText}>{filteredProbationers.length} Under Review</Text>
          </View>

          {filteredProbationers.map(prob => (
            <TouchableOpacity
              key={prob.id}
              onPress={() => navigation.navigate('ProbationReview', { probationId: prob.id })}
              activeOpacity={0.85}
            >
              <CommonCard style={styles.itemCard} variant="glass">
                <MaterialCommunityIcons name="account-check" size={90} color="rgba(10, 102, 194, 0.022)" style={{ position: 'absolute', right: -15, bottom: -15, zIndex: -1 }} />
                <View style={styles.itemHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: 'rgba(10, 102, 194, 0.08)' }]}>
                    <Text style={styles.avatarText}>{prob.name.split(' ').map((n: string) => n[0]).join('')}</Text>
                  </View>
                  <View style={styles.itemTitleGroup}>
                    <Text style={styles.itemTitle}>{prob.name}</Text>
                    <Text style={styles.itemSubtitle}>{prob.role} • {prob.dept}</Text>
                  </View>
                  <View style={[
                    styles.badgeOutline,
                    { borderColor: prob.status === 'review_pending' ? '#f59e0b' : '#3b82f6', backgroundColor: prob.status === 'review_pending' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)' }
                  ]}>
                    <Text style={[styles.badgeText, { color: prob.status === 'review_pending' ? '#f59e0b' : '#3b82f6', fontSize: 9, fontWeight: '800' }]}>
                      {prob.status === 'review_pending' ? 'Pending' : 'Active'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} style={{ marginLeft: 6 }} />
                </View>

                <View style={styles.divider} />

                <View style={styles.candidateDetailsRow}>
                  <View style={styles.candDetailCol}>
                    <Text style={styles.candDetailLabel}>Joined Date</Text>
                    <Text style={styles.candDetailValue}>{formatDate(prob.joinedDate, 'dd/MM/yyyy')}</Text>
                  </View>
                  <View style={styles.candDetailCol}>
                    <Text style={styles.candDetailLabel}>Probation End Date</Text>
                    <Text style={styles.candDetailValue}>{formatDate(prob.probationEnd, 'dd/MM/yyyy')}</Text>
                  </View>
                </View>
              </CommonCard>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentScroll}>
      {/* Appraisal Cycle overview banner */}
      <CommonCard variant="glass" style={styles.performanceBanner}>
        <View style={styles.perfBannerLeft}>
          <MaterialCommunityIcons name="trophy-outline" size={24} color="#0A66C2" />
          <View style={styles.perfBannerTextWrapper}>
            <Text style={styles.perfBannerTitle}>Active Appraisal Cycle: 2026</Text>
            <Text style={styles.perfBannerSubtitle}>Mid-Year Reviews completed. Preparing Performance Ratings.</Text>
          </View>
        </View>
      </CommonCard>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Employee Reviews</Text>
        <Text style={styles.countText}>{filteredReviews.length} Assigned</Text>
      </View>

      {filteredReviews.map(rev => (
        <TouchableOpacity
          key={rev.reviewId}
          onPress={() => navigation.navigate('PerformanceDetail', { reviewId: rev.reviewId })}
          activeOpacity={0.85}
        >
          <CommonCard style={styles.itemCard} variant="glass">
            <MaterialCommunityIcons name="trophy-outline" size={90} color="rgba(10, 102, 194, 0.022)" style={{ position: 'absolute', right: -15, bottom: -15, zIndex: -1 }} />
            <View style={styles.itemHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: '#e0f2fe' }]}>
                <Text style={[styles.avatarText, { color: '#0369a1' }]}>{rev.employeeName.split(' ').map((n: string) => n[0]).join('')}</Text>
              </View>
              <View style={styles.itemTitleGroup}>
                <Text style={styles.itemTitle}>{rev.employeeName}</Text>
                <Text style={styles.itemSubtitle}>{rev.role} • Mgr: {rev.managerName}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} />
            </View>

            <View style={styles.divider} />

            <View style={styles.ratingsRow}>
              <View style={styles.ratingCol}>
                <Text style={styles.ratingColLabel}>Self Rating</Text>
                <Text style={styles.ratingColValue}>⭐ {rev.selfRating}</Text>
              </View>
              <View style={styles.ratingCol}>
                <Text style={styles.ratingColLabel}>Manager Rating</Text>
                <Text style={styles.ratingColValue}>⭐ {rev.managerRating}</Text>
              </View>
              <View style={styles.ratingCol}>
                <Text style={styles.ratingColLabel}>Final (Normalized)</Text>
                <Text style={[styles.ratingColValue, { color: themeColors.primary, fontWeight: '800' }]}>⭐ {rev.normalizationRating}</Text>
              </View>
            </View>
          </CommonCard>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderExitsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentScroll}>
      {/* Metrics Card Deck from screenshot 5 */}
      <View style={styles.exitStatsGrid}>
        <CommonCard style={styles.exitStatCard} variant="glass">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <MaterialCommunityIcons name="chart-bar" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.exitStatValue}>{getExitCount('total')}</Text>
          <Text style={styles.exitStatLabel}>Total Exits</Text>
        </CommonCard>

        <CommonCard style={styles.exitStatCard} variant="glass">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.exitStatValue}>{getExitCount('pending')}</Text>
          <Text style={styles.exitStatLabel}>Pending</Text>
        </CommonCard>

        <CommonCard style={styles.exitStatCard} variant="glass">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.exitStatValue}>{getExitCount('in_progress')}</Text>
          <Text style={styles.exitStatLabel}>In Progress</Text>
        </CommonCard>

        <CommonCard style={styles.exitStatCard} variant="glass">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#10b981" />
          </View>
          <Text style={styles.exitStatValue}>{getExitCount('completed')}</Text>
          <Text style={styles.exitStatLabel}>Completed</Text>
        </CommonCard>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Exit Cases Tracker</Text>
        <Text style={styles.countText}>{filteredExits.length} Listed</Text>
      </View>

      {filteredExits.map(ex => (
        <TouchableOpacity
          key={ex.id}
          onPress={() => navigation.navigate('ExitDetail', { exitId: ex.id })}
          activeOpacity={0.85}
        >
          <CommonCard style={styles.itemCard} variant="glass">
            <MaterialCommunityIcons name="exit-run" size={90} color="rgba(239, 68, 68, 0.022)" style={{ position: 'absolute', right: -15, bottom: -15, zIndex: -1 }} />
            <View style={styles.itemHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                <Text style={[styles.avatarText, { color: '#ef4444' }]}>{ex.employeeName.split(' ').map((n: string) => n[0]).join('')}</Text>
              </View>
              <View style={styles.itemTitleGroup}>
                <Text style={styles.itemTitle}>{ex.employeeName}</Text>
                <Text style={styles.itemSubtitle}>{ex.dept} • {ex.email}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} />
            </View>

            <View style={styles.divider} />

            <View style={styles.exitDatesRow}>
              <View style={styles.exitDateCol}>
                <Text style={styles.exitDateLabel}>Resignation Date</Text>
                <Text style={styles.exitDateValue}>{formatDate(ex.resignationDate, 'dd/MM/yyyy')}</Text>
              </View>
              <View style={styles.exitDateCol}>
                <Text style={styles.exitDateLabel}>Last Working Date</Text>
                <Text style={styles.exitDateValue}>{formatDate(ex.lastWorkingDay, 'dd/MM/yyyy')}</Text>
              </View>
              <View style={styles.exitStatusBadgeCol}>
                <View style={[
                  styles.badgeOutline,
                  { borderColor: ex.status === 'clearance_in_progress' ? '#3b82f6' : '#10b981', backgroundColor: ex.status === 'clearance_in_progress' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)' }
                ]}>
                  <Text style={[styles.badgeText, { color: ex.status === 'clearance_in_progress' ? '#3b82f6' : '#10b981' }]}>
                    {ex.status === 'clearance_in_progress' ? 'Clearance In Progress' : 'Resignation Approved'}
                  </Text>
                </View>
              </View>
            </View>
          </CommonCard>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
        <Text style={styles.headerTitle}>HR Command Hub</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={22} color="#0A66C2" />
        </TouchableOpacity>
      </View>

      {/* Slide Tab Nav Strip */}
      <View style={styles.tabStrip}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'onboarding' && styles.tabButtonActive]}
          onPress={() => setActiveTab('onboarding')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="account-plus" 
            size={18} 
            color={activeTab === 'onboarding' ? themeColors.primary : '#64748B'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'onboarding' && styles.tabLabelActive]}>Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'performance' && styles.tabButtonActive]}
          onPress={() => setActiveTab('performance')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="star-box-multiple" 
            size={18} 
            color={activeTab === 'performance' ? themeColors.primary : '#64748B'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'performance' && styles.tabLabelActive]}>Performance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'exits' && styles.tabButtonActive]}
          onPress={() => setActiveTab('exits')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="exit-run" 
            size={18} 
            color={activeTab === 'exits' ? themeColors.primary : '#64748B'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'exits' && styles.tabLabelActive]}>Exits Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Global Filter Bar */}
      <View style={styles.searchBarWrapper}>
        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#0A66C2" />
          <Text style={styles.loaderText}>Loading Command Center metrics...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'onboarding' && renderOnboardingTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'exits' && renderExitsTab()}
        </View>
      )}
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
    justifyContent: 'space-between',
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
    letterSpacing: -0.2,
  },
  refreshBtn: {
    padding: 4,
  },
  tabStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(226, 232, 240, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(10, 102, 194, 0.15)',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: themeColors.primary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContentScroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  itemCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: themeColors.primary,
  },
  itemTitleGroup: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  candidateDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  candDetailCol: {
    flex: 1,
  },
  candDetailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  candDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  bgvBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bgvText: {
    fontSize: 11,
    fontWeight: '800',
  },
  performanceBanner: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 102, 194, 0.03)',
  },
  perfBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perfBannerTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  perfBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  perfBannerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingCol: {
    alignItems: 'center',
    flex: 1,
  },
  ratingColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  ratingColValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  exitStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  exitStatCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  exitStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  exitStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  exitDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitDateCol: {
    flex: 1.2,
  },
  exitDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  exitDateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  exitStatusBadgeCol: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  badgeOutline: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
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
    marginBottom: 16,
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
  bgBlobLeft: {
    position: 'absolute',
    top: 80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(10, 102, 194, 0.05)',
    zIndex: -1,
  },
  bgBlobRight: {
    position: 'absolute',
    bottom: 120,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    zIndex: -1,
  },
});
