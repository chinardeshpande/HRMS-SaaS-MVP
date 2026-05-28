import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Modal, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { endpoints } from '../../api/endpoints';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { LeaveBalance, LeaveApplication, UserRole } from '../../types';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppTabParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LeaveScreen: React.FC = () => {
  const { user } = useAuthStore();
  const route = useRoute<RouteProp<AppTabParamList, 'Leave'>>();
  const [balances, setBalances] = useState<LeaveBalance>({ CL: 8, SL: 10, PL: 12 });
  const [myApplications, setMyApplications] = useState<LeaveApplication[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_leaves' | 'approvals'>('my_leaves');

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState<'CL' | 'SL' | 'PL'>('CL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    fetchBalances();
    fetchMyLeaves();
    if (user?.role === UserRole.MANAGER || user?.role === UserRole.HR_ADMIN) {
      fetchPendingApprovals();
    }
  }, []);

  useEffect(() => {
    if (route?.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
    if (route?.params?.openApplyModal) {
      setModalVisible(true);
    }
  }, [route?.params]);

  const fetchBalances = async () => {
    try {
      const res = await endpoints.leaves.balance();
      if (res.success && res.data) {
        setBalances(res.data);
      }
    } catch (err) {
      console.warn('⚠️ Error getting leave balances:', err);
    }
  };

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await endpoints.leaves.applications({ employeeId: user?.employeeId });
      if (res.success && res.data) {
        setMyApplications(res.data);
      }
    } catch (err) {
      console.warn('⚠️ Error getting my leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await endpoints.leaves.applications({ status: 'pending', managerId: user?.employeeId });
      if (res.success && res.data) {
        setPendingApprovals(res.data);
      }
    } catch (err) {
      console.warn('⚠️ Error getting pending approvals:', err);
    }
  };

  const handleApplyLeave = async () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Required Fields', 'Please fill in all the input fields.');
      return;
    }

    setApplyLoading(true);
    try {
      // Map casual names CL, SL, PL to real Type IDs or send code
      const mockTypeId = leaveType === 'CL' ? 'casual-leave-uuid' : leaveType === 'SL' ? 'sick-leave-uuid' : 'earned-leave-uuid';
      
      const res = await endpoints.leaves.apply({
        leaveTypeId: mockTypeId,
        startDate,
        endDate,
        days: 1, // simplified calculator for test
        isHalfDay: false,
        reason
      });

      if (res.success) {
        Alert.alert('Success', 'Your leave application has been submitted successfully.');
        setModalVisible(false);
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchMyLeaves();
        fetchBalances();
      }
    } catch (err: any) {
      console.warn('⚠️ Leave application failed:', err);
      Alert.alert('Application Failed', err.message || 'An error occurred.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleReviewLeave = async (id: string, action: 'approve' | 'reject') => {
    const triggerReview = async (comments?: string) => {
      try {
        const res = action === 'approve'
          ? await endpoints.leaves.approve(id)
          : await endpoints.leaves.reject(id, comments || 'Rejected');

        if (res.success) {
          Alert.alert('Success', `Leave application has been ${action}d!`);
          fetchPendingApprovals();
          fetchMyLeaves();
        }
      } catch (err: any) {
        Alert.alert('Review Failed', err.message || 'Failed to review request.');
      }
    };

    if (action === 'approve') {
      Alert.alert('Approve Leave', 'Are you sure you want to approve this request?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => triggerReview() }
      ]);
    } else {
      Alert.prompt(
        'Reject Leave',
        'Please enter a reason for rejection:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reject', style: 'destructive', onPress: (comments) => triggerReview(comments) }
        ],
        'plain-text'
      );
    }
  };

  const balancesData = [
    { code: 'CL', name: 'Casual Leave', total: 12, balance: balances.CL || 8 },
    { code: 'SL', name: 'Sick Leave', total: 10, balance: balances.SL || 10 },
    { code: 'PL', name: 'Privilege/Paid Leave', total: 15, balance: balances.PL || 12 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Balances Grid */}
        <Text style={styles.sectionTitle}>Leave Balances</Text>
        <View style={styles.grid}>
          {balancesData.map((item) => {
            const used = item.total - item.balance;
            const pct = item.balance / item.total;
            return (
              <View key={item.code} style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceCode}>{item.code}</Text>
                  <Text style={styles.balanceVal}>{item.balance} Left</Text>
                </View>
                <Text style={styles.balanceName}>{item.name}</Text>
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${pct * 100}%` }]} />
                </View>
                <Text style={styles.balanceSub}>{used} / {item.total} Days Used</Text>
              </View>
            );
          })}
        </View>

        {/* Tab Selection */}
        {(user?.role === UserRole.MANAGER || user?.role === UserRole.HR_ADMIN) && (
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'my_leaves' && styles.tabActive]}
              onPress={() => setActiveTab('my_leaves')}
            >
              <Text style={[styles.tabText, activeTab === 'my_leaves' && styles.tabTextActive]}>My Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'approvals' && styles.tabActive]}
              onPress={() => setActiveTab('approvals')}
            >
              <View style={styles.tabLabelWithCount}>
                <Text style={[styles.tabText, activeTab === 'approvals' && styles.tabTextActive]}>Pending Approvals</Text>
                {pendingApprovals.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{pendingApprovals.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Content list */}
        {loading ? (
          <ActivityIndicator size="large" color="#0A66C2" style={{ marginTop: 40 }} />
        ) : activeTab === 'my_leaves' ? (
          <View style={styles.listSection}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.historyTitle}>Leave Applications</Text>
              <TouchableOpacity style={styles.applyTextBtn} onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus-circle" size={16} color="#0A66C2" />
                <Text style={styles.applyBtnText}>Apply New</Text>
              </TouchableOpacity>
            </View>

            {myApplications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="calendar-multiselect" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No leave requests recorded</Text>
              </View>
            ) : (
              myApplications.map((app) => (
                <CommonCard 
                  key={app.leaveId}
                  title={`${formatDate(app.startDate)} - ${formatDate(app.endDate)}`}
                  subtitle={app.reason}
                  headerRight={<StatusBadge status={app.status} />}
                >
                  <View style={styles.cardDetails}>
                    <Text style={styles.detailText}>
                      <Text style={{ fontWeight: '600' }}>Duration:</Text> {app.days} Day{app.days > 1 ? 's' : ''} {app.isHalfDay ? '(Half-Day)' : ''}
                    </Text>
                    {app.managerComments && (
                      <Text style={styles.commentsText}>
                        <Text style={{ fontWeight: '600' }}>Manager Remarks:</Text> {app.managerComments}
                      </Text>
                    )}
                  </View>
                </CommonCard>
              ))
            )}
          </View>
        ) : (
          <View style={styles.listSection}>
            <Text style={styles.historyTitle}>Pending Reviews ({pendingApprovals.length})</Text>
            {pendingApprovals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>Zero pending approvals! You are all caught up.</Text>
              </View>
            ) : (
              pendingApprovals.map((app) => (
                <CommonCard 
                  key={app.leaveId}
                  title={`Request by Employee`}
                  subtitle={`Reason: ${app.reason}`}
                >
                  <View style={styles.reviewBody}>
                    <Text style={styles.detailText}><Text style={{ fontWeight: '600' }}>Dates:</Text> {formatDate(app.startDate)} to {formatDate(app.endDate)} ({app.days} Days)</Text>
                    
                    <View style={styles.reviewBtnGroup}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleReviewLeave(app.leaveId, 'reject')}
                      >
                        <MaterialCommunityIcons name="close-circle-outline" size={16} color="#ef4444" />
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleReviewLeave(app.leaveId, 'approve')}
                      >
                        <MaterialCommunityIcons name="check-circle-outline" size={16} color="#22c55e" />
                        <Text style={[styles.actionBtnText, { color: '#22c55e' }]}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </CommonCard>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (Only show on My Leaves tab) */}
      {activeTab === 'my_leaves' && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="calendar-plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Leave Application Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <Text style={styles.formLabel}>Leave Category</Text>
            <View style={styles.typeSelector}>
              {['CL', 'SL', 'PL'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, leaveType === type && styles.typeOptionActive]}
                  onPress={() => setLeaveType(type as any)}
                >
                  <Text style={[styles.typeText, leaveType === type && styles.typeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Selection */}
            <Text style={styles.formLabel}>Start Date (YYYY-MM-DD)</Text>
            <View style={styles.formInputContainer}>
              <MaterialCommunityIcons name="calendar-range" size={20} color="#9ca3af" style={styles.formInputIcon} />
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 2026-06-01"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            <Text style={styles.formLabel}>End Date (YYYY-MM-DD)</Text>
            <View style={styles.formInputContainer}>
              <MaterialCommunityIcons name="calendar-range" size={20} color="#9ca3af" style={styles.formInputIcon} />
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 2026-06-02"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>

            {/* Reason */}
            <Text style={styles.formLabel}>Reason for Leave</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Provide context for approval"
              multiline={true}
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />

            {/* Apply Action */}
            <CommonButton
              title="Submit Request"
              onPress={handleApplyLeave}
              loading={applyLoading}
              style={styles.submitApplyBtn}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  balanceCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A66C2',
    backgroundColor: '#e8f4f8',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  balanceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  balanceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginVertical: 4,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0A66C2',
    borderRadius: 3,
  },
  balanceSub: {
    fontSize: 10,
    color: '#9ca3af',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  tabLabelWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  listSection: {
    flex: 1,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  applyTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#0A66C2',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cardDetails: {
    marginTop: -4,
  },
  detailText: {
    fontSize: 13,
    color: '#4b5563',
  },
  commentsText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 8,
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  reviewBody: {
    marginTop: -4,
  },
  reviewBtnGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectBtn: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  approveBtn: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a66c2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 6,
    marginTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#0A66C2',
    backgroundColor: '#e8f4f8',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4b5563',
  },
  typeTextActive: {
    color: '#0A66C2',
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  formInputIcon: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  submitApplyBtn: {
    marginTop: 24,
  },
});
