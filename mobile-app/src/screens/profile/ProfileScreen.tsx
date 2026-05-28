import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Alert, Switch } from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';
import { StatusBadge } from '../../components/StatusBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../utils/format';
import { endpoints } from '../../api/endpoints';
import { EmployeeProfile, ExitClearance } from '../../types';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppTabParamList, ProfileStackParamList } from '../../navigation/types';
import * as LocalAuthentication from 'expo-local-authentication';
import { sendLocalNotification } from '../../utils/notifications';

type ProfileNavProp = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList, 'ProfileHome'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export const ProfileScreen: React.FC = () => {
  const { user, logout, biometricsEnabled, setBiometricsEnabled } = useAuthStore();
  const navigation = useNavigation<ProfileNavProp>();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [clearances, setClearances] = useState<ExitClearance[]>([]);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    fetchProfileData();
    checkBiometricsSupport();
  }, [user]);

  const checkBiometricsSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(hasHardware && isEnrolled);
    } catch (e) {
      console.warn('⚠️ Biometrics capability check failed:', e);
      setIsBiometricSupported(false);
    }
  };

  const handleToggleBiometrics = async (newValue: boolean) => {
    if (newValue) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm FaceID / Fingerprint to enable secure login',
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          await setBiometricsEnabled(true);
          Alert.alert(
            'Biometrics Enrolled',
            'You can now bypass manual credentials and login securely with a quick touch or glance!'
          );
        } else {
          // Reset toggle if cancelled
          await setBiometricsEnabled(false);
        }
      } catch (e) {
        console.warn('⚠️ Biometrics toggle verification failed:', e);
        Alert.alert('Enrollment Error', 'Could not register biometric credentials on this device.');
        await setBiometricsEnabled(false);
      }
    } else {
      await setBiometricsEnabled(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification(
        'AuroraHR System Alert',
        '🚨 Sarah Johnson, your monthly attendance report for May has been generated. Please review it.'
      );
    } catch (e) {
      console.warn('⚠️ Notification trigger error:', e);
    }
  };

  const fetchProfileData = async () => {
    if (!user?.employeeId) return;
    try {
      const response = await endpoints.employees.detail(user.employeeId);
      if (response.success && response.data) {
        setProfile(response.data);
        
        // Mock clearances exit checklist
        setClearances([
          { clearanceId: '1', tenantId: user.tenantId, resignId: '1', departmentCategory: 'IT Assets', status: 'cleared', remarks: 'MacBook & Keycard returned', createdAt: '', updatedAt: '' },
          { clearanceId: '2', tenantId: user.tenantId, resignId: '1', departmentCategory: 'Finance & Accounts', status: 'pending', remarks: 'Pending final settlement calculation', createdAt: '', updatedAt: '' },
          { clearanceId: '3', tenantId: user.tenantId, resignId: '1', departmentCategory: 'HR & Administration', status: 'cleared', remarks: 'Exit interview form submitted', createdAt: '', updatedAt: '' },
        ]);
      }
    } catch (err) {
      console.warn('⚠️ Error loading profile data:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of AuroraHR?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatarGlow}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0A66C2&color=fff&size=200&bold=true` }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <StatusBadge status={profile?.status || 'Active'} style={styles.badge} />
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.designation?.name && (
          <Text style={styles.roleText}>{profile.designation.name} • {profile?.department?.name || 'Department'}</Text>
        )}

        {/* Secure Keychain Indicator */}
        <View style={styles.secureBadgeContainer}>
          <MaterialCommunityIcons name="shield-lock" size={13} color="#059669" />
          <Text style={styles.secureBadgeText}>Stored in Secure Enclave</Text>
        </View>
      </View>

      {/* Core Profile Card */}
      <CommonCard title="Job & Joining Information">
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="badge-account-horizontal-outline" size={20} color="#0A66C2" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Employee Code</Text>
              <Text style={styles.infoValue}>{profile?.employeeCode || 'E-0021'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-range" size={20} color="#0A66C2" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Joined Date</Text>
              <Text style={styles.infoValue}>{formatDate(profile?.dateOfJoining)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-tie-outline" size={20} color="#0A66C2" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Reporting Manager</Text>
              <Text style={styles.infoValue}>{profile?.manager?.firstName ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'No manager assigned'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color="#0A66C2" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{profile?.phone || '+91 98765 43210'}</Text>
            </View>
          </View>
        </View>
      </CommonCard>

      {/* Offboarding Exit Checklist Widget */}
      {(profile?.status === 'exited' || clearances.length > 0) && (
        <CommonCard title="Exit Offboarding Clearance Tracker" subtitle="Checklist for pending resignations">
          <View style={styles.checklistContainer}>
            {clearances.map((item) => (
              <View key={item.clearanceId} style={styles.checkItem}>
                <View style={styles.checkLeft}>
                  <View style={[
                    styles.checkDot, 
                    { backgroundColor: item.status === 'cleared' ? '#22c55e' : '#f59e0b' }
                  ]} />
                  <View style={styles.checkTextContainer}>
                    <Text style={styles.checkCategory}>{item.departmentCategory}</Text>
                    {item.remarks && <Text style={styles.checkRemarks}>{item.remarks}</Text>}
                  </View>
                </View>
                <StatusBadge status={item.status} style={styles.checkBadge} />
              </View>
            ))}
          </View>
        </CommonCard>
      )}

      {/* App Settings list */}
      <CommonCard title="Preferences & Settings">
        <TouchableOpacity 
          style={styles.settingsRow} 
          onPress={() => navigation.navigate('Directory')}
          activeOpacity={0.7}
        >
          <View style={styles.settingsLabelContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#0A66C2" style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Company Directory</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {isBiometricSupported && (
          <View style={[styles.settingsRow, styles.borderTop]}>
            <View style={styles.settingsLabelContainer}>
              <MaterialCommunityIcons name="fingerprint" size={22} color="#0A66C2" style={styles.settingsIcon} />
              <Text style={styles.settingsText}>Biometric Sign In</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#d1d5db', true: '#a3d3e3' }}
              thumbColor={biometricsEnabled ? '#0A66C2' : '#f3f4f6'}
            />
          </View>
        )}

        <View style={[styles.settingsRow, styles.borderTop]}>
          <View style={styles.settingsLabelContainer}>
            <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#4b5563" style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Push Alerts & Reminders</Text>
          </View>
          <Switch
            value={isNotificationsEnabled}
            onValueChange={setIsNotificationsEnabled}
            trackColor={{ false: '#d1d5db', true: '#a3d3e3' }}
            thumbColor={isNotificationsEnabled ? '#0A66C2' : '#f3f4f6'}
          />
        </View>

        {/* Send Test Alert Trigger */}
        <TouchableOpacity 
          style={[styles.settingsRow, styles.borderTop]} 
          onPress={handleTestNotification}
          activeOpacity={0.7}
        >
          <View style={styles.settingsLabelContainer}>
            <MaterialCommunityIcons name="bell-alert-outline" size={22} color="#ca8a04" style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Send Test Local Alert</Text>
          </View>
          <MaterialCommunityIcons name="gesture-tap" size={18} color="#9ca3af" />
        </TouchableOpacity>

        <View style={[styles.settingsRow, styles.borderTop]}>
          <View style={styles.settingsLabelContainer}>
            <MaterialCommunityIcons name="theme-light-dark" size={22} color="#4b5563" style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Modern Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#d1d5db', true: '#a3d3e3' }}
            thumbColor={isDarkMode ? '#0A66C2' : '#f3f4f6'}
          />
        </View>
      </CommonCard>

      {/* Log out Action */}
      <CommonButton
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        icon={<MaterialCommunityIcons name="logout" size={20} color="#ffffff" />}
        style={styles.logoutBtn}
      />
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
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarGlow: {
    padding: 4,
    borderRadius: 72,
    borderWidth: 3,
    borderColor: '#e8f4f8',
    backgroundColor: '#ffffff',
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  badge: {
    marginVertical: 6,
  },
  email: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#47a7c7',
    marginTop: 4,
  },
  secureBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 10,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 4,
  },
  infoGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 2,
  },
  checklistContainer: {
    marginTop: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  checkTextContainer: {
    flex: 1,
  },
  checkCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  checkRemarks: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  checkBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  settingsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  logoutBtn: {
    marginTop: 24,
    shadowColor: '#ef4444',
  },
});
