import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DirectoryStackParamList } from '../../navigation/types';
import { endpoints } from '../../api/endpoints';
import { EmployeeProfile } from '../../types';
import { CommonCard } from '../../components/CommonCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type DetailRouteProp = RouteProp<DirectoryStackParamList, 'EmployeeDetail'>;

export const EmployeeDetailScreen: React.FC = () => {
  const route = useRoute<DetailRouteProp>();
  const { employeeId } = route.params;
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'contact'>('profile');

  useEffect(() => {
    fetchDetail();
  }, [employeeId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await endpoints.employees.detail(employeeId);
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        // Fallback demo employee detail
        const mockProfiles: Record<string, EmployeeProfile> = {
          '1': {
            employeeId: '1', tenantId: 't1', employeeCode: 'EMP-001', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@acme.com', phone: '+91 98765 43210', status: 'active' as any, dateOfJoining: '2022-01-15', createdAt: '', updatedAt: '',
            designation: { designationId: 'd1', tenantId: 't1', name: 'Lead HR Specialist', createdAt: '', updatedAt: '' },
            department: { departmentId: 'dep1', tenantId: 't1', name: 'HR & Talent', createdAt: '', updatedAt: '' },
            manager: { employeeId: 'm1', tenantId: 't1', employeeCode: 'EMP-000', firstName: 'John', lastName: 'Doe', email: 'john.doe@acme.com', status: 'active' as any, dateOfJoining: '2020-01-01', createdAt: '', updatedAt: '' },
            attendanceSummary: { totalDays: 20, present: 18, absent: 1, halfDay: 1, lateMark: 2 },
            leaveBalance: { CL: 4, SL: 8, PL: 10 },
            performanceScore: 4.8
          },
          '2': {
            employeeId: '2', tenantId: 't1', employeeCode: 'EMP-002', firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@acme.com', phone: '+91 98765 43211', status: 'active' as any, dateOfJoining: '2023-03-10', createdAt: '', updatedAt: '',
            designation: { designationId: 'd2', tenantId: 't1', name: 'Senior Frontend Engineer', createdAt: '', updatedAt: '' },
            department: { departmentId: 'dep2', tenantId: 't1', name: 'Engineering', createdAt: '', updatedAt: '' },
            manager: { employeeId: 'm1', tenantId: 't1', employeeCode: 'EMP-000', firstName: 'John', lastName: 'Doe', email: 'john.doe@acme.com', status: 'active' as any, dateOfJoining: '2020-01-01', createdAt: '', updatedAt: '' },
            attendanceSummary: { totalDays: 20, present: 19, absent: 0, halfDay: 1, lateMark: 0 },
            leaveBalance: { CL: 6, SL: 9, PL: 12 },
            performanceScore: 4.5
          },
          '3': {
            employeeId: '3', tenantId: 't1', employeeCode: 'EMP-003', firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@acme.com', phone: '+91 98765 43212', status: 'active' as any, dateOfJoining: '2021-08-01', createdAt: '', updatedAt: '',
            designation: { designationId: 'd3', tenantId: 't1', name: 'VP of Marketing', createdAt: '', updatedAt: '' },
            department: { departmentId: 'dep3', tenantId: 't1', name: 'Marketing', createdAt: '', updatedAt: '' },
            manager: { employeeId: 'm1', tenantId: 't1', employeeCode: 'EMP-000', firstName: 'John', lastName: 'Doe', email: 'john.doe@acme.com', status: 'active' as any, dateOfJoining: '2020-01-01', createdAt: '', updatedAt: '' },
            attendanceSummary: { totalDays: 20, present: 17, absent: 2, halfDay: 1, lateMark: 1 },
            leaveBalance: { CL: 3, SL: 7, PL: 8 },
            performanceScore: 4.7
          },
          '4': {
            employeeId: '4', tenantId: 't1', employeeCode: 'EMP-004', firstName: 'David', lastName: 'Kim', email: 'david.kim@acme.com', phone: '+91 98765 43213', status: 'active' as any, dateOfJoining: '2024-02-18', createdAt: '', updatedAt: '',
            designation: { designationId: 'd4', tenantId: 't1', name: 'Sales Director', createdAt: '', updatedAt: '' },
            department: { departmentId: 'dep4', tenantId: 't1', name: 'Sales', createdAt: '', updatedAt: '' },
            manager: { employeeId: 'm1', tenantId: 't1', employeeCode: 'EMP-000', firstName: 'John', lastName: 'Doe', email: 'john.doe@acme.com', status: 'active' as any, dateOfJoining: '2020-01-01', createdAt: '', updatedAt: '' },
            attendanceSummary: { totalDays: 20, present: 20, absent: 0, halfDay: 0, lateMark: 0 },
            leaveBalance: { CL: 8, SL: 10, PL: 15 },
            performanceScore: 4.2
          }
        };

        setProfile(mockProfiles[employeeId] || mockProfiles['1']);
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch employee details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A66C2" />
        <Text style={styles.loadingText}>Fetching employee profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="account-alert" size={48} color="#ef4444" />
        <Text style={styles.emptyText}>Employee not found</Text>
      </View>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.avatarGlow}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0A66C2&color=fff&size=200&bold=true` }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.designation}>{profile.designation?.name || 'Associate'}</Text>
        <StatusBadge status={profile.status} style={styles.badge} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Metrics & Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.tabActive]}
          onPress={() => setActiveTab('contact')}
        >
          <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <CommonCard title="Job & Joining Information">
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="badge-account-horizontal-outline" size={20} color="#0A66C2" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Employee Code</Text>
                <Text style={styles.infoValue}>{profile.employeeCode}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="office-building" size={20} color="#0A66C2" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{profile.department?.name || 'General'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-range" size={20} color="#0A66C2" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Joining Date</Text>
                <Text style={styles.infoValue}>{formatDate(profile.dateOfJoining)}</Text>
              </View>
            </View>

            {profile.manager && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-tie-outline" size={20} color="#0A66C2" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Reporting Manager</Text>
                  <Text style={styles.infoValue}>{`${profile.manager.firstName} ${profile.manager.lastName}`}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="briefcase-outline" size={20} color="#0A66C2" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Employment Type</Text>
                <Text style={styles.infoValue}>{profile.employmentType ? profile.employmentType.toUpperCase() : 'FULL-TIME'}</Text>
              </View>
            </View>
          </View>
        </CommonCard>
      )}

      {activeTab === 'activity' && (
        <>
          {profile.attendanceSummary && (
            <CommonCard title="Attendance Summary" subtitle="Current period stats">
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: '#22c55e' }]}>{profile.attendanceSummary.present}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: '#ef4444' }]}>{profile.attendanceSummary.absent}</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>{profile.attendanceSummary.lateMark}</Text>
                  <Text style={styles.statLabel}>Late</Text>
                </View>
              </View>
            </CommonCard>
          )}

          {profile.leaveBalance && (
            <CommonCard title="Leave Balances">
              <View style={styles.leaveRow}>
                {Object.entries(profile.leaveBalance).map(([code, bal]) => (
                  <View key={code} style={styles.leaveItem}>
                    <Text style={styles.leaveCode}>{code}</Text>
                    <Text style={styles.leaveVal}>{bal} Days</Text>
                  </View>
                ))}
              </View>
            </CommonCard>
          )}

          {profile.performanceScore !== undefined && (
            <CommonCard title="PMS Review Rating">
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={24} color="#f59e0b" style={styles.starIcon} />
                <Text style={styles.ratingScore}>{profile.performanceScore.toFixed(1)}</Text>
                <Text style={styles.ratingMax}>/ 5.0 (Excellent)</Text>
              </View>
            </CommonCard>
          )}
        </>
      )}

      {activeTab === 'contact' && (
        <CommonCard title="Connect Directly">
          <View style={styles.contactPanel}>
            <TouchableOpacity 
              style={styles.contactBtn}
              onPress={() => handleEmail(profile.email)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="email-outline" size={24} color="#0A66C2" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactType}>Corporate Email</Text>
                <Text style={styles.contactValue}>{profile.email}</Text>
              </View>
            </TouchableOpacity>

            {profile.phone && (
              <TouchableOpacity 
                style={[styles.contactBtn, styles.borderTop]}
                onPress={() => handleCall(profile.phone)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="phone-outline" size={24} color="#22c55e" />
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactType}>Mobile Phone</Text>
                  <Text style={styles.contactValue}>{profile.phone}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </CommonCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarGlow: {
    padding: 4,
    borderRadius: 62,
    borderWidth: 3,
    borderColor: '#e8f4f8',
    backgroundColor: '#ffffff',
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  designation: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 3,
    marginVertical: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  infoGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 14,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 4,
  },
  leaveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  leaveItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  leaveCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A66C2',
  },
  leaveVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 8,
  },
  ratingScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  ratingMax: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  contactPanel: {
    marginTop: -4,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  contactTextContainer: {
    marginLeft: 12,
  },
  contactType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
});
