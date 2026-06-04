import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppTabParamList, DirectoryStackParamList, DashboardStackParamList, ProfileStackParamList } from './types';
import { themeColors } from '../utils/theme';
import { CommonCard } from '../components/CommonCard';
import { CommonButton } from '../components/CommonButton';
import { useAuthStore } from '../context/useAuthStore';

// Import Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { LeaveScreen } from '../screens/leave/LeaveScreen';
import { EmployeeListScreen } from '../screens/employees/EmployeeListScreen';
import { EmployeeDetailScreen } from '../screens/employees/EmployeeDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { HRConnectScreen } from '../screens/hr-connect/HRConnectScreen';
import { DigitalVaultScreen } from '../screens/vault/DigitalVaultScreen';
import { HRCommandCenterScreen } from '../screens/hr-command/HRCommandCenterScreen';
import { ExitDetailScreen } from '../screens/hr-command/ExitDetailScreen';
import { PerformanceDetailScreen } from '../screens/hr-command/PerformanceDetailScreen';
import { OnboardingDetailScreen } from '../screens/hr-command/OnboardingDetailScreen';
import { ProbationReviewScreen } from '../screens/hr-command/ProbationReviewScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();
const DirectoryStack = createStackNavigator<DirectoryStackParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Nested Directory Stack to allow beautiful detail transitions
const DirectoryStackNavigator: React.FC = () => {
  return (
    <DirectoryStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#111827',
        },
        headerTintColor: '#0A66C2',
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <DirectoryStack.Screen
        name="DirectoryList"
        component={EmployeeListScreen}
        options={{ title: 'Company Directory' }}
      />
      <DirectoryStack.Screen
        name="EmployeeDetail"
        component={EmployeeDetailScreen}
        options={{ title: 'Employee Profile' }}
      />
    </DirectoryStack.Navigator>
  );
};

// Nested Dashboard Stack
const DashboardStackNavigator: React.FC = () => {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#111827',
        },
        headerTintColor: '#0A66C2',
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="Directory"
        component={DirectoryStackNavigator}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="DigitalVault"
        component={DigitalVaultScreen}
        options={{ title: 'Digital Vault', headerShown: true }}
      />
      <DashboardStack.Screen
        name="HRCommandCenter"
        component={HRCommandCenterScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="ExitDetail"
        component={ExitDetailScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="PerformanceDetail"
        component={PerformanceDetailScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="OnboardingDetail"
        component={OnboardingDetailScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="ProbationReview"
        component={ProbationReviewScreen}
        options={{ headerShown: false }}
      />
    </DashboardStack.Navigator>
  );
};

// Nested Profile Stack
const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#111827',
        },
        headerTintColor: '#0A66C2',
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <ProfileStack.Screen
        name="Directory"
        component={DirectoryStackNavigator}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="DigitalVault"
        component={DigitalVaultScreen}
        options={{ title: 'Digital Vault', headerShown: true }}
      />
    </ProfileStack.Navigator>
  );
};

// Re-engineered Curved Floating Tab Bar Component
const CustomTabBar = ({ state, _descriptors, navigation, onCenterPress }: any) => {
  const { user } = useAuthStore();
  const centerPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(centerPulse, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }, []);

  const renderTab = (routeName: string) => {
    const index = state.routes.findIndex((r: any) => r.name === routeName);
    if (index === -1) return null;

    const route = state.routes[index];
    const isFocused = state.index === index;
    const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'hr_admin' || user?.role === 'system_admin';

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        if (route.name === 'Dashboard') {
          navigation.navigate('Dashboard', { screen: 'DashboardHome' });
        } else if (route.name === 'ProfileStack') {
          if (isManagerOrAdmin && __DEV__) {
            navigation.navigate('Dashboard', { screen: 'HRCommandCenter' });
          } else {
            navigation.navigate('ProfileStack', { screen: 'ProfileHome' });
          }
        } else {
          navigation.navigate({ name: route.name, merge: true });
        }
      }
    };

    let iconName: any = 'home';
    let label = '';

    if (routeName === 'Dashboard') {
      iconName = isFocused ? 'view-dashboard' : 'view-dashboard-outline';
      label = 'Home';
    } else if (routeName === 'DocumentHub') {
      iconName = isFocused ? 'file-document' : 'file-document-outline';
      label = 'Doc Hub';
    } else if (routeName === 'HRConnect') {
      iconName = isFocused ? 'forum' : 'forum-outline';
      label = 'Connect';
    } else if (routeName === 'ProfileStack') {
      if (isManagerOrAdmin && __DEV__) {
        iconName = isFocused ? 'shield-account' : 'shield-account-outline';
        label = 'HR Hub';
      } else {
        iconName = isFocused ? 'account-circle' : 'account-circle-outline';
        label = 'Profile';
      }
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={20}
          color={isFocused ? themeColors.primary : themeColors.textMuted}
        />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabBarWrapper}>
      {/* Left side tabs */}
      <View style={styles.sideTabsGroup}>
        {renderTab('Dashboard')}
        {renderTab('DocumentHub')}
      </View>

      {/* Pulsing Central Action Portal Button */}
      <View style={styles.centerPortalContainer}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: centerPulse }] }]} />
        <TouchableOpacity
          style={styles.centerButton}
          onPress={onCenterPress}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Right side tabs */}
      <View style={styles.sideTabsGroup}>
        {renderTab('HRConnect')}
        {renderTab('ProfileStack')}
      </View>
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  const { user } = useAuthStore();
  const [portalVisible, setPortalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabNavigationRef = useRef<any>(null);

  // Modal Visibility States
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [regularisationModalVisible, setRegularisationModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  // 1. Add Event Form States
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'Meeting' | 'Townhall' | 'Team Outing' | 'Training'>('Meeting');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // 2. Request Regularisation Form States
  const [regDate, setRegDate] = useState('');
  const [regPunchIn, setRegPunchIn] = useState('');
  const [regPunchOut, setRegPunchOut] = useState('');
  const [regReason, setRegReason] = useState<'Forgot to Punch' | 'Client Visit' | 'Network Issue' | 'Device Error'>('Forgot to Punch');
  const [regNotes, setRegNotes] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // 3. Raise Support Ticket Form States
  const [ticketCategory, setTicketCategory] = useState<'IT Support' | 'HR Query' | 'Payroll' | 'Admin'>('IT Support');
  const [ticketUrgency, setTicketUrgency] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  const handleCreateEvent = () => {
    if (!eventTitle || !eventDate || !eventTime) {
      Alert.alert('Required Fields', 'Please fill in Event Title, Date, and Time.');
      return;
    }
    setEventSubmitting(true);
    setTimeout(() => {
      setEventSubmitting(false);
      Alert.alert('Success', `Event "${eventTitle}" has been scheduled successfully for ${eventDate} at ${eventTime}.`);
      setEventTitle('');
      setEventDate('');
      setEventTime('');
      setEventDescription('');
      setEventModalVisible(false);
    }, 1200);
  };

  const handleSubmitRegularisation = () => {
    if (!regDate || !regPunchIn || !regPunchOut) {
      Alert.alert('Required Fields', 'Please fill in Date, Punch In Time, and Punch Out Time.');
      return;
    }
    setRegSubmitting(true);
    setTimeout(() => {
      setRegSubmitting(false);
      Alert.alert('Correction Submitted', `Your attendance correction request for ${regDate} (${regPunchIn} - ${regPunchOut}) has been submitted for manager approval.`);
      setRegDate('');
      setRegPunchIn('');
      setRegPunchOut('');
      setRegNotes('');
      setRegularisationModalVisible(false);
    }, 1200);
  };

  const handleRaiseTicket = () => {
    if (!ticketSubject || !ticketDescription) {
      Alert.alert('Required Fields', 'Please provide a Subject and Description.');
      return;
    }
    setTicketSubmitting(true);
    setTimeout(() => {
      setTicketSubmitting(false);
      Alert.alert('Ticket Created', `HR Support Ticket #SR-84920 has been registered successfully. You will receive updates via push notifications.`);
      setTicketSubject('');
      setTicketDescription('');
      setTicketModalVisible(false);
    }, 1200);
  };

  const togglePortal = (visible: boolean) => {
    setPortalVisible(visible);
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 45,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePortalAction = (screenName: string, params?: any) => {
    togglePortal(false);
    if (tabNavigationRef.current) {
      tabNavigationRef.current.navigate(screenName, params);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => {
          tabNavigationRef.current = props.navigation;
          return <CustomTabBar {...props} onCenterPress={() => togglePortal(true)} />;
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardStackNavigator}
          options={{ title: 'Home' }}
        />
        <Tab.Screen
          name="DocumentHub"
          component={DigitalVaultScreen}
          options={{ title: 'Document Hub', headerShown: true }}
        />
        {/* Hidden from tab bar rendering logic but available in navigator routes */}
        <Tab.Screen
          name="Leave"
          component={LeaveScreen}
          options={{ title: 'Leave Tracker', headerShown: true }}
        />
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{ title: 'Attendance Punch', headerShown: true }}
        />
        <Tab.Screen
          name="HRConnect"
          component={HRConnectScreen}
          options={{ title: 'HR Connect', headerShown: true }}
        />
        <Tab.Screen
          name="ProfileStack"
          component={ProfileStackNavigator}
          options={{ title: 'My Profile' }}
        />
      </Tab.Navigator>

      {/* Floating Action Portal Frosted Overlay Container */}
      {portalVisible && (
        <Animated.View style={[styles.portalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.portalBackdrop}
            onPress={() => togglePortal(false)}
            activeOpacity={1}
          />
          <Animated.View style={[styles.portalTray, { transform: [{ translateY: slideAnim }] }]}>
            <CommonCard variant="glass" style={styles.portalCard}>
              <Text style={styles.portalTitle}>Quick Creation Hub</Text>
              <Text style={styles.portalSubtitle}>Initiate a new entry or request HR services securely</Text>
              
              <View style={styles.portalGrid}>
                {/* 1. Apply Leave */}
                <TouchableOpacity 
                  style={styles.portalItem}
                  onPress={() => handlePortalAction('Leave', { openApplyModal: true })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.portalIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
                    <MaterialCommunityIcons name="calendar-multiselect" size={26} color={themeColors.warning} />
                  </View>
                  <Text style={styles.portalItemText}>Apply Leave</Text>
                </TouchableOpacity>

                {/* 2. Add Event */}
                <TouchableOpacity 
                  style={styles.portalItem}
                  onPress={() => {
                    togglePortal(false);
                    setEventModalVisible(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.portalIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                    <MaterialCommunityIcons name="calendar-plus" size={26} color={themeColors.success} />
                  </View>
                  <Text style={styles.portalItemText}>Add Event</Text>
                </TouchableOpacity>

                {/* 3. Request Regularisation */}
                <TouchableOpacity 
                  style={styles.portalItem}
                  onPress={() => {
                    togglePortal(false);
                    setRegularisationModalVisible(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.portalIconCircle, { backgroundColor: 'rgba(10, 102, 194, 0.08)', borderColor: 'rgba(10, 102, 194, 0.25)' }]}>
                    <MaterialCommunityIcons name="clipboard-edit-outline" size={26} color={themeColors.primary} />
                  </View>
                  <Text style={styles.portalItemText}>Request Regularisation</Text>
                </TouchableOpacity>

                {/* 4. Raise Support Ticket */}
                <TouchableOpacity 
                  style={styles.portalItem}
                  onPress={() => {
                    togglePortal(false);
                    setTicketModalVisible(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.portalIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={26} color={themeColors.error} />
                  </View>
                  <Text style={styles.portalItemText}>Raise Ticket</Text>
                </TouchableOpacity>

                {/* 5. HR Command Hub */}
                {(user?.role === 'manager' || user?.role === 'hr_admin' || user?.role === 'system_admin') && __DEV__ && (
                  <TouchableOpacity 
                    style={styles.portalItem}
                    onPress={() => handlePortalAction('HRCommandCenter')}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.portalIconCircle, { backgroundColor: 'rgba(10, 102, 194, 0.08)', borderColor: 'rgba(10, 102, 194, 0.25)' }]}>
                      <MaterialCommunityIcons name="shield-account-outline" size={26} color={themeColors.primary} />
                    </View>
                    <Text style={styles.portalItemText}>HR Command Hub ➔</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={styles.closePortalBtn} 
                onPress={() => togglePortal(false)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={26} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </CommonCard>
          </Animated.View>
        </Animated.View>
      )}

      {/* 1. Add Event Modal */}
      <Modal
        visible={eventModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEventModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setEventModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="calendar-plus" size={24} color={themeColors.success} style={styles.modalTitleIcon} />
                <Text style={styles.modalTitle}>Schedule Event</Text>
              </View>
              <TouchableOpacity onPress={() => setEventModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Event Title</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="format-title" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Townhall Meeting"
                  placeholderTextColor="#9ca3af"
                  value={eventTitle}
                  onChangeText={eventSubmitting ? undefined : setEventTitle}
                  editable={!eventSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Event Type</Text>
              <View style={styles.selectorContainer}>
                {(['Meeting', 'Townhall', 'Team Outing', 'Training'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.selectorOption,
                      eventType === type && styles.selectorOptionActiveSuccess,
                    ]}
                    onPress={() => !eventSubmitting && setEventType(type)}
                    disabled={eventSubmitting}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        eventType === type && styles.selectorTextActiveSuccess,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Event Date (YYYY-MM-DD)</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="calendar-range" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 2026-06-15"
                  placeholderTextColor="#9ca3af"
                  value={eventDate}
                  onChangeText={eventSubmitting ? undefined : setEventDate}
                  editable={!eventSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Event Time (HH:MM)</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 15:30"
                  placeholderTextColor="#9ca3af"
                  value={eventTime}
                  onChangeText={eventSubmitting ? undefined : setEventTime}
                  editable={!eventSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Details of the event..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={4}
                value={eventDescription}
                onChangeText={eventSubmitting ? undefined : setEventDescription}
                editable={!eventSubmitting}
              />

              <CommonButton
                title="Create Event"
                onPress={handleCreateEvent}
                loading={eventSubmitting}
                variant="success"
                style={styles.submitBtn}
              />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Request Regularisation Modal */}
      <Modal
        visible={regularisationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRegularisationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setRegularisationModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color={themeColors.primary} style={styles.modalTitleIcon} />
                <Text style={styles.modalTitle}>Fix Attendance</Text>
              </View>
              <TouchableOpacity onPress={() => setRegularisationModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Date to Correct (YYYY-MM-DD)</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="calendar" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 2026-05-25"
                  placeholderTextColor="#9ca3af"
                  value={regDate}
                  onChangeText={regSubmitting ? undefined : setRegDate}
                  editable={!regSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Correct Punch-In (HH:MM)</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="login" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 09:00"
                  placeholderTextColor="#9ca3af"
                  value={regPunchIn}
                  onChangeText={regSubmitting ? undefined : setRegPunchIn}
                  editable={!regSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Correct Punch-Out (HH:MM)</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="logout" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 18:00"
                  placeholderTextColor="#9ca3af"
                  value={regPunchOut}
                  onChangeText={regSubmitting ? undefined : setRegPunchOut}
                  editable={!regSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Reason for Correction</Text>
              <View style={styles.selectorContainerGrid}>
                {(['Forgot to Punch', 'Client Visit', 'Network Issue', 'Device Error'] as const).map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.selectorOptionGrid,
                      regReason === reason && styles.selectorOptionActivePrimary,
                    ]}
                    onPress={() => !regSubmitting && setRegReason(reason)}
                    disabled={regSubmitting}
                  >
                    <Text
                      style={[
                        styles.selectorGridText,
                        regReason === reason && styles.selectorTextActivePrimary,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Additional Notes</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Explain the reason for regularisation..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={4}
                value={regNotes}
                onChangeText={regSubmitting ? undefined : setRegNotes}
                editable={!regSubmitting}
              />

              <CommonButton
                title="Submit Request"
                onPress={handleSubmitRegularisation}
                loading={regSubmitting}
                variant="primary"
                style={styles.submitBtn}
              />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 3. Raise Support Ticket Modal */}
      <Modal
        visible={ticketModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTicketModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setTicketModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color={themeColors.error} style={styles.modalTitleIcon} />
                <Text style={styles.modalTitle}>Raise HR/IT Ticket</Text>
              </View>
              <TouchableOpacity onPress={() => setTicketModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Ticket Category</Text>
              <View style={styles.selectorContainer}>
                {(['IT Support', 'HR Query', 'Payroll', 'Admin'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.selectorOption,
                      ticketCategory === cat && styles.selectorOptionActiveError,
                    ]}
                    onPress={() => !ticketSubmitting && setTicketCategory(cat)}
                    disabled={ticketSubmitting}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        ticketCategory === cat && styles.selectorTextActiveError,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Urgency Level</Text>
              <View style={styles.selectorContainer}>
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((urg) => (
                  <TouchableOpacity
                    key={urg}
                    style={[
                      styles.selectorOption,
                      ticketUrgency === urg && styles.selectorOptionActiveError,
                    ]}
                    onPress={() => !ticketSubmitting && setTicketUrgency(urg)}
                    disabled={ticketSubmitting}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        ticketUrgency === urg && styles.selectorTextActiveError,
                      ]}
                    >
                      {urg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Subject</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="ticket-outline" size={20} color="#9ca3af" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Laptop screen flickering"
                  placeholderTextColor="#9ca3af"
                  value={ticketSubject}
                  onChangeText={ticketSubmitting ? undefined : setTicketSubject}
                  editable={!ticketSubmitting}
                />
              </View>

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Provide details about the issue..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={4}
                value={ticketDescription}
                onChangeText={ticketSubmitting ? undefined : setTicketDescription}
                editable={!ticketSubmitting}
              />

              <CommonButton
                title="Submit Ticket"
                onPress={handleRaiseTicket}
                loading={ticketSubmitting}
                variant="danger"
                style={styles.submitBtn}
              />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  sideTabsGroup: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: themeColors.textMuted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: themeColors.primary,
  },
  centerPortalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  pulseRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(10, 102, 194, 0.15)',
    top: -26,
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: themeColors.primary,
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  portalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 99999,
  },
  portalBackdrop: {
    flex: 1,
  },
  portalTray: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  portalCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  portalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  portalSubtitle: {
    fontSize: 12,
    color: 'rgba(15, 23, 42, 0.6)',
    marginTop: 4,
    fontWeight: '600',
  },
  portalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
    gap: 16,
  },
  portalItem: {
    width: '45%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  portalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  portalItemText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  closePortalBtn: {
    marginTop: 4,
  },
  // Frosted Creation Modals Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: Dimensions.get('window').height * 0.9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  formInputIcon: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    height: 96,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  selectorOption: {
    flex: 1,
    minWidth: '22%',
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectorOptionActiveSuccess: {
    borderColor: themeColors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  selectorOptionActivePrimary: {
    borderColor: themeColors.primary,
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
  },
  selectorOptionActiveError: {
    borderColor: themeColors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  selectorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  selectorTextActiveSuccess: {
    color: themeColors.success,
  },
  selectorTextActivePrimary: {
    color: themeColors.primary,
  },
  selectorTextActiveError: {
    color: themeColors.error,
  },
  selectorContainerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  selectorOptionGrid: {
    width: '48%',
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectorGridText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  submitBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 14,
  },
});
