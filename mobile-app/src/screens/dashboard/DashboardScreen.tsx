import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Alert, Modal, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { endpoints } from '../../api/endpoints';
import { CommonCard } from '../../components/CommonCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { AttendanceRecord, Goal } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppTabParamList, DashboardStackParamList } from '../../navigation/types';
import { themeColors } from '../../utils/theme';

type DashboardNavProp = CompositeNavigationProp<
  StackNavigationProp<DashboardStackParamList, 'DashboardHome'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export const DashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<DashboardNavProp>();
  const [attendanceToday, setAttendanceToday] = useState<{
    hasPunchedIn: boolean;
    todayPunchIn?: string;
    todayPunchOut?: string;
    totalHoursToday: number;
    activePunch?: AttendanceRecord;
  } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sprint 1 Approvals states
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Calendar Strip States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<{ date: Date; dayNum: string; dayName: string; month: string }[]>([]);
  const [alertsModalVisible, setAlertsModalVisible] = useState(false);

  useEffect(() => {
    // Generate 7 days centered around today (yesterday, today, and 5 future days)
    const days = [];
    const today = new Date();
    for (let i = -1; i <= 5; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dayNum = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      
      days.push({ date: d, dayNum, dayName, month });
    }
    setCalendarDays(days);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (attendanceToday?.hasPunchedIn && attendanceToday?.todayPunchIn) {
      const calculateElapsed = () => {
        const start = new Date(attendanceToday.todayPunchIn || '').getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        const hrsStr = hrs.toString().padStart(2, '0');
        const minsStr = mins.toString().padStart(2, '0');
        const secsStr = secs.toString().padStart(2, '0');
        
        setElapsedTime(`${hrsStr}:${minsStr}:${secsStr}`);
      };
      
      calculateElapsed(); // run immediately
      intervalId = setInterval(calculateElapsed, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [attendanceToday?.hasPunchedIn, attendanceToday?.todayPunchIn]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await fetchAllData();
    } catch (err) {
      console.warn('⚠️ Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
    } catch (err) {
      console.warn('⚠️ Dashboard refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAllData = async () => {
    if (!user) return;

    // Fetch today's attendance status
    const attRes = await endpoints.attendance.today().catch(() => null);
    if (attRes?.success && attRes.data) {
      setAttendanceToday(attRes.data);
    }

    // Fetch PMS goals

    // Fetch PMS goals
    if (user.employeeId) {
      const goalsRes = await endpoints.pms.goals({ employeeId: user.employeeId }).catch(() => null);
      if (goalsRes?.success && goalsRes.data) {
        setGoals(goalsRes.data);
      } else {
        // Fallback demo goals
        setGoals([
          { goalId: '1', tenantId: user.tenantId, employeeId: user.employeeId, cycleId: 'c1', title: 'Achieve 95% API uptime for SaaS platform', status: 'active', createdAt: '', updatedAt: '' },
          { goalId: '2', tenantId: user.tenantId, employeeId: user.employeeId, cycleId: 'c1', title: 'Complete mobile app MVP frontend routing', status: 'active', createdAt: '', updatedAt: '' }
        ]);
      }
    }

    // Fetch pending approvals for managers
    const isManager = user.role === 'manager' || user.role === 'hr_admin' || user.role === 'system_admin';
    if (isManager) {
      try {
        const [leavesRes, exitRes] = await Promise.all([
          endpoints.leaves.applications({ managerId: user.employeeId || 'e-current', status: 'pending' }).catch(() => null),
          __DEV__ ? endpoints.exit.pending().catch(() => null) : Promise.resolve(null)
        ]);
        
        const pendingItems: any[] = [];
        
        if (leavesRes?.success && leavesRes.data) {
          leavesRes.data.forEach((l: any) => {
            if (l.status === 'pending') {
              pendingItems.push({
                id: l.leaveId,
                type: 'leave',
                title: 'Leave Request',
                applicantName: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Team Member',
                description: `${l.days} days (${formatDate(l.startDate, 'MMM dd')} - ${formatDate(l.endDate, 'MMM dd')}) for "${l.reason || 'Personal Work'}"`,
                raw: l
              });
            }
          });
        }
        
        if (__DEV__ && exitRes?.success && exitRes.data) {
          exitRes.data.forEach((e: any) => {
            if (e.status === 'pending') {
              pendingItems.push({
                id: e.resignId,
                type: 'exit',
                title: 'Resignation Clearance',
                applicantName: e.employeeName || 'Exit Employee',
                description: `Notice LWD: ${formatDate(e.lastWorkingDay, 'MMM dd, yyyy')}. Reason: "${e.reason || 'Career Growth'}"`,
                raw: e
              });
            }
          });
        }
        
        // Seed high-fidelity mock approvals for beautiful demonstration if empty in development mode
        if (__DEV__ && pendingItems.length === 0) {
          pendingItems.push({
            id: 'mock-l-1',
            type: 'leave',
            title: 'Leave Request',
            applicantName: 'Emily Davis',
            description: '3 days (Jun 01 - Jun 03) for "Annual family reunion travel"',
            raw: { leaveId: 'mock-l-1' }
          });
          pendingItems.push({
            id: 'mock-e-1',
            type: 'exit',
            title: 'Resignation Clearance',
            applicantName: 'Michael Chang',
            description: 'Finance clearance checklist sign-off. Notice LWD: Jun 15, 2026',
            raw: { resignId: 'mock-e-1' }
          });
        }
        
        setPendingApprovals(pendingItems);
      } catch (err) {
        console.warn('⚠️ Approvals load error:', err);
      }
    }
  };

  const handleQuickPunch = async () => {
    if (!attendanceToday) return;

    const action = attendanceToday.hasPunchedIn ? 'out' : 'in';

    Alert.alert(
      action === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out',
      action === 'in'
        ? 'Do you want to clock in and start your shift?'
        : 'Are you ready to clock out and end your active shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'in' ? 'Clock In' : 'Clock Out',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await endpoints.attendance.punch({
                action,
                remarks: action === 'in' ? 'Clocked in via Quick Hub' : 'Clocked out via Quick Hub',
                timestamp: new Date().toISOString()
              });

              if (res.success) {
                Alert.alert('Success', `Successfully clocked ${action}!`);
                await fetchAllData();
              }
            } catch (err: any) {
              console.warn('⚠️ Quick punch action failed:', err);
              Alert.alert('Punch Failed', err.message || 'An error occurred during quick punching.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };



  const handleActiveGoalsPress = () => {
    const activeGoalsList = goals.filter(g => g.status === 'active');
    if (activeGoalsList.length === 0) {
      Alert.alert('PMS Objectives', 'You have no active goals assigned for this cycle.');
      return;
    }
    
    Alert.alert(
      'Active PMS Objectives',
      activeGoalsList.map((g, idx) => `🎯 ${idx + 1}. ${g.title}`).join('\n\n'),
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const activeAlerts = [];

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'hr_admin' || user?.role === 'system_admin';
  if (isManagerOrAdmin && pendingApprovals.length > 0) {
    activeAlerts.push({
      id: 'alert-approvals',
      type: 'approval',
      title: 'Action Required',
      description: __DEV__
        ? `${pendingApprovals.length} Pending Approval${pendingApprovals.length > 1 ? 's' : ''} (Leaves & Exit Clearances)`
        : `${pendingApprovals.length} Pending Leave Approval${pendingApprovals.length > 1 ? 's' : ''}`,
      icon: 'star-circle',
      color: '#f59e0b',
      badge: pendingApprovals.length,
      action: () => navigation.navigate('Leave', { activeTab: 'approvals' })
    });
  } else {
    activeAlerts.push({
      id: 'alert-goals',
      type: 'goal',
      title: 'PMS Objectives',
      description: `Track your ${goals.filter(g => g.status === 'active').length} active performance goals`,
      icon: 'target',
      color: '#0a66c2',
      action: handleActiveGoalsPress
    });
  }

  const getEventsForDate = (date: Date) => {
    const dayOffset = date.getDate() - new Date().getDate();
    if (dayOffset === 0) {
      return [
        { id: '1', title: 'Performance Goals Review Cycle', time: 'Active Due Date', type: 'due', desc: 'Q2 Objectives check-in with your reporting manager.' },
        { id: '2', title: 'Team Sync & Operations Check-in', time: '10:30 AM', type: 'meeting', desc: 'Virtual standup on SaaS features and deployment targets.' }
      ];
    } else if (dayOffset === 1) {
      return [
        { id: '3', title: "Sarah Johnson's Birthday Cake", time: '04:00 PM', type: 'celebration', desc: 'Announcements hub cafeteria celebration!' }
      ];
    } else if (dayOffset === -1) {
      return [
        { id: '4', title: 'Q2 Retrospective & SaaS Hotfix', time: 'Completed', type: 'task', desc: 'All tests verified and production updates successfully pushed.' }
      ];
    } else if (dayOffset === 3) {
      return [
        { id: '5', title: 'HR Gala Night & Annual Awards', time: '07:30 PM', type: 'event', desc: 'Main ballroom dinner and SaaS team recognition ceremony!' }
      ];
    }
    return [];
  };

  const renderSelectedDateEvents = () => {
    const dayEvents = getEventsForDate(selectedDate);
    
    return (
      <CommonCard variant="glass" style={styles.eventDrawerCard}>
        <View style={styles.eventDrawerHeader}>
          <Text style={styles.eventDrawerTitle}>
            Schedule for {formatDate(selectedDate.toISOString(), 'MMMM dd, yyyy')}
          </Text>
          {dayEvents.length > 0 ? (
            <View style={styles.eventCountBadge}>
              <Text style={styles.eventCountText}>{dayEvents.length} Active</Text>
            </View>
          ) : null}
        </View>

        {dayEvents.length === 0 ? (
          <View style={styles.emptyEventsRow}>
            <MaterialCommunityIcons name="calendar-blank" size={20} color={themeColors.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.emptyEventsText}>No events or action items scheduled for this date.</Text>
          </View>
        ) : (
          dayEvents.map((evt, idx) => (
            <View key={evt.id} style={[styles.eventItemRow, idx > 0 && styles.eventItemRowBorder]}>
              <View style={[
                styles.eventStatusIndicator,
                { backgroundColor: evt.type === 'due' ? themeColors.error : evt.type === 'meeting' ? themeColors.primary : evt.type === 'celebration' ? themeColors.warning : themeColors.success }
              ]} />
              <View style={styles.eventItemDetails}>
                <View style={styles.eventItemHeader}>
                  <Text style={styles.eventItemTitle} numberOfLines={1}>{evt.title}</Text>
                  <Text style={[
                    styles.eventItemTime,
                    { color: evt.type === 'due' ? themeColors.error : themeColors.textSecondary }
                  ]}>
                    {evt.time}
                  </Text>
                </View>
                <Text style={styles.eventItemDesc}>{evt.desc}</Text>
              </View>
            </View>
          ))
        )}
      </CommonCard>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Floating Glass Header Bar */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.customHeader}>
          {/* Left: Quick Profile Avatar Shortcut */}
          <TouchableOpacity
            style={styles.headerAvatarWrapper}
            onPress={() => navigation.navigate('ProfileStack')}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0A66C2&color=ffffff&size=100&bold=true` }}
              style={styles.headerAvatar as any}
            />
          </TouchableOpacity>

          {/* Center: Sleek Brand Logo */}
          <Image
            source={require('../../assets/AuroraHR-logo.png')}
            style={styles.headerLogoImage as any}
            resizeMode="contain"
          />

          {/* Right Controls: Quick Shift Pill & Alert Bell */}
          <View style={styles.headerControls}>
            {/* Quick Shift Pulse Pill */}
            <TouchableOpacity
              style={[
                styles.quickPunchPill,
                attendanceToday?.hasPunchedIn ? styles.quickPunchPillActive : styles.quickPunchPillInactive
              ]}
              onPress={handleQuickPunch}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons 
                name={attendanceToday?.hasPunchedIn ? 'exit-to-app' : 'fingerprint'} 
                size={14} 
                color="#ffffff" 
                style={{ marginRight: 4 }}
              />
              <Text style={styles.quickPunchPillText}>
                {attendanceToday?.hasPunchedIn ? elapsedTime : 'Off Duty'}
              </Text>
              <View style={[
                styles.quickPunchStatusDot,
                { backgroundColor: attendanceToday?.hasPunchedIn ? '#10b981' : '#9ca3af' }
              ]} />
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setAlertsModalVisible(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="bell" size={20} color={themeColors.textPrimary} />
              {pendingApprovals.length > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{pendingApprovals.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A66C2" />
          <Text style={styles.loadingText}>Initializing your dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A66C2']} />
          }
        >
          {/* HR Manager Command Center Portal Card */}
          {isManagerOrAdmin && __DEV__ && (
            <TouchableOpacity
              style={[styles.commandCenterBanner, { marginTop: 8 }]}
              onPress={() => navigation.navigate('HRCommandCenter')}
              activeOpacity={0.9}
            >
              <View style={styles.commandBannerLeft}>
                <View style={styles.commandIconWrapper}>
                  <MaterialCommunityIcons name="shield-account" size={24} color="#0A66C2" />
                </View>
                <View style={styles.commandTextWrapper}>
                  <Text style={styles.commandBannerTitle}>HR Command Center</Text>
                  <Text style={styles.commandBannerSubtitle}>Onboard candidates, normalise ratings & manage exits</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#0A66C2" />
            </TouchableOpacity>
          )}

          {/* Scrollable Calendar Hub Strip */}
          <View style={styles.calendarStripWrapper}>
            <View style={styles.calendarHeaderRow}>
              <View style={styles.calendarTitleGroup}>
                <MaterialCommunityIcons name="calendar-month" size={16} color={themeColors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.calendarSectionTitle}>Schedule Planner</Text>
              </View>
              <TouchableOpacity
                style={styles.calendarMoreBtn}
                onPress={() => Alert.alert('Corporate Planner', 'Accessing corporate planner schedule...')}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarMoreText}>Full Schedule ➔</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarScroll}
            >
              {calendarDays.map((day, idx) => {
                const isSelected = selectedDate.getDate() === day.date.getDate() && selectedDate.getMonth() === day.date.getMonth();
                const isToday = new Date().getDate() === day.date.getDate() && new Date().getMonth() === day.date.getMonth();
                const hasEvents = getEventsForDate(day.date).length > 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.calendarDayTile,
                      isToday && styles.calendarDayTileToday,
                      isSelected && styles.calendarDayTileSelected
                    ]}
                    onPress={() => setSelectedDate(day.date)}
                    activeOpacity={0.85}
                  >
                    {hasEvents && <View style={styles.calendarEventBadge} />}
                    <Text style={[styles.calendarDayMonth, isSelected && styles.calendarDayTextSelected]}>{day.month}</Text>
                    <Text style={[
                      styles.calendarDayNum,
                      isSelected && styles.calendarDayNumSelected,
                      isToday && !isSelected && styles.calendarDayNumToday
                    ]}>{day.dayNum}</Text>
                    <Text style={[
                      styles.calendarDayName,
                      isSelected && styles.calendarDayTextSelected,
                      isToday && !isSelected && styles.calendarDayTextToday
                    ]}>{day.dayName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Dynamic Agenda Details Drawer */}
          {renderSelectedDateEvents()}

          {/* Collaboration Radar Card */}
          <CommonCard variant="glass" style={styles.radarCard}>
            <View style={styles.radarHeader}>
              <View style={styles.radarStatusWrapper}>
                <View style={styles.radarPulsingDot} />
                <Text style={styles.radarHeaderTitle}>Collaboration Radar</Text>
              </View>
              <MaterialCommunityIcons name="broadcast" size={16} color={themeColors.primary} />
            </View>
            <Text style={styles.radarSubtitle}>Interact and collaborate in real-time with your team streams</Text>

            <View style={styles.radarStreams}>
              <TouchableOpacity
                style={styles.radarStreamRow}
                onPress={() => navigation.navigate('HRConnect', { activeTab: 'feed' })}
                activeOpacity={0.75}
              >
                <View style={[styles.radarStreamIconWrapper, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                  <View style={[styles.radarIconInner, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <MaterialCommunityIcons name="rss" size={16} color="#3b82f6" />
                  </View>
                  <View style={[styles.radarPulseRing, { borderColor: '#3b82f6' }]} />
                </View>
                <View style={styles.radarStreamDetails}>
                  <View style={styles.radarStreamTitleRow}>
                    <Text style={styles.radarStreamTitle}>Company Feeds</Text>
                    <View style={[styles.radarBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                      <Text style={[styles.radarBadgeText, { color: '#3b82f6' }]}>NEW POSTS</Text>
                    </View>
                  </View>
                  <Text style={styles.radarStreamDesc}>Check what is happening inside the organization</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radarStreamRow, styles.radarStreamRowBorder]}
                onPress={() => navigation.navigate('HRConnect', { activeTab: 'chats' })}
                activeOpacity={0.75}
              >
                <View style={[styles.radarStreamIconWrapper, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <View style={[styles.radarIconInner, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <MaterialCommunityIcons name="chat" size={16} color="#10b981" />
                  </View>
                  <View style={[styles.radarPulseRing, { borderColor: '#10b981' }]} />
                </View>
                <View style={styles.radarStreamDetails}>
                  <View style={styles.radarStreamTitleRow}>
                    <Text style={styles.radarStreamTitle}>Direct Messages</Text>
                    <View style={[styles.radarBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Text style={[styles.radarBadgeText, { color: '#10b981' }]}>ONLINE</Text>
                    </View>
                  </View>
                  <Text style={styles.radarStreamDesc}>1-on-1 private messaging with colleagues</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radarStreamRow, styles.radarStreamRowBorder]}
                onPress={() => navigation.navigate('HRConnect', { activeTab: 'chats' })}
                activeOpacity={0.75}
              >
                <View style={[styles.radarStreamIconWrapper, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                  <View style={[styles.radarIconInner, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                    <MaterialCommunityIcons name="forum" size={16} color="#8b5cf6" />
                  </View>
                  <View style={[styles.radarPulseRing, { borderColor: '#8b5cf6' }]} />
                </View>
                <View style={styles.radarStreamDetails}>
                  <View style={styles.radarStreamTitleRow}>
                    <Text style={styles.radarStreamTitle}>Group Chats</Text>
                    <View style={[styles.radarBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                      <Text style={[styles.radarBadgeText, { color: '#8b5cf6' }]}>2 NEW</Text>
                    </View>
                  </View>
                  <Text style={styles.radarStreamDesc}>Collaborate in group chat channels</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>
          </CommonCard>

          {/* Biometric Vault Quick Access Banner */}
          <TouchableOpacity
            style={styles.vaultBanner}
            onPress={() => navigation.navigate('DigitalVault')}
            activeOpacity={0.9}
          >
            <View style={styles.vaultBannerLeft}>
              <View style={styles.vaultIconWrapper}>
                <MaterialCommunityIcons name="shield-key" size={24} color="#ffffff" />
              </View>
              <View style={styles.vaultTextWrapper}>
                <Text style={styles.vaultBannerTitle}>Biometric Digital Vault</Text>
                <Text style={styles.vaultBannerSubtitle}>Access pay slips, contracts & certificates securely</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={themeColors.primary} />
          </TouchableOpacity>

          {/* PMS Active Goals Tracker */}
          <CommonCard variant="glass">
            <View style={styles.radarHeader}>
              <Text style={styles.radarHeaderTitle}>🎯 Active PMS Objectives</Text>
              <MaterialCommunityIcons name="target" size={18} color={themeColors.primary} />
            </View>
            <View style={styles.goalsContainer}>
              {goals.length === 0 ? (
                <Text style={styles.emptyGoals}>No active goals assigned for this cycle.</Text>
              ) : (
                goals.map((goal, idx) => (
                  <View key={goal.goalId} style={[styles.goalItem, idx > 0 && styles.borderTop]}>
                    <View style={styles.goalLeft}>
                      <MaterialCommunityIcons name="circle-double" size={12} color={themeColors.primary} style={styles.goalDot} />
                      <Text style={styles.goalTitle} numberOfLines={2}>{goal.title}</Text>
                    </View>
                    <View style={styles.goalBadge}>
                      <StatusBadge status={goal.status} />
                    </View>
                  </View>
                ))
              )}
            </View>
          </CommonCard>
        </ScrollView>
      )}

      {/* Slide-Up Alerts Modal Drawer */}
      <Modal
        visible={alertsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAlertsModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setAlertsModalVisible(false)} 
          />
          <View style={styles.modalContent}>
            {/* Grab handle indicator for slide visual */}
            <View style={styles.modalGrabHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="bell" size={24} color={themeColors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Attention & Alerts</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setAlertsModalVisible(false)}
                style={styles.modalCloseIconBtn}
              >
                <MaterialCommunityIcons name="close" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalSubtitleText}>
                You have {pendingApprovals.length} critical items requiring attention.
              </Text>

              {/* Approval Requests for Managers */}
              {user?.role === 'manager' || user?.role === 'hr_admin' || user?.role === 'system_admin' ? (
                <View style={styles.approvalsSection}>
                  <Text style={styles.sectionTitle}>Pending Team Approvals</Text>
                  {pendingApprovals.length === 0 ? (
                    <View style={styles.emptyApprovalsCard}>
                      <View style={styles.emptyApprovalsContent}>
                        <MaterialCommunityIcons name="check-decagram" size={24} color={themeColors.success} />
                        <Text style={styles.emptyApprovalsText}>All clear! No pending approvals.</Text>
                      </View>
                    </View>
                  ) : (
                    pendingApprovals.map((app) => (
                      <View key={app.id} style={styles.modalAlertItem}>
                        <View style={styles.modalAlertInner}>
                          <View style={[
                            styles.modalAlertIconWrapper, 
                            { backgroundColor: app.type === 'leave' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
                          ]}>
                            <MaterialCommunityIcons 
                              name={app.type === 'leave' ? 'calendar-minus' : 'exit-run'} 
                              size={20} 
                              color={app.type === 'leave' ? '#10b981' : '#f59e0b'} 
                            />
                          </View>
                          <View style={styles.modalAlertDetails}>
                            <View style={styles.modalAlertHeader}>
                              <Text style={styles.modalAlertTitle}>{app.applicantName}</Text>
                              <View style={[
                                styles.modalAlertBadge, 
                                { backgroundColor: app.type === 'leave' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)' }
                              ]}>
                                <Text style={[
                                  styles.modalAlertBadgeText, 
                                  { color: app.type === 'leave' ? '#10b981' : '#f59e0b' }
                                ]}>
                                  {app.title}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.modalAlertDesc}>{app.description}</Text>
                            <TouchableOpacity 
                              style={styles.modalAlertActionBtn}
                              onPress={() => {
                                setAlertsModalVisible(false);
                                navigation.navigate('Leave', { activeTab: 'approvals' });
                              }}
                            >
                              <Text style={styles.modalAlertActionText}>Review Approval ➔</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : null}

              {/* Objectives List Alert */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sectionTitle}>Objectives & Goal Due Dates</Text>
                {goals.filter(g => g.status === 'active').map((goal) => (
                  <View key={goal.goalId} style={styles.modalAlertItem}>
                    <View style={styles.modalAlertInner}>
                      <View style={[styles.modalAlertIconWrapper, { backgroundColor: 'rgba(10, 102, 194, 0.1)' }]}>
                        <MaterialCommunityIcons name="target" size={20} color={themeColors.primary} />
                      </View>
                      <View style={styles.modalAlertDetails}>
                        <View style={styles.modalAlertHeader}>
                          <Text style={styles.modalAlertTitle}>PMS Target</Text>
                          <View style={[styles.modalAlertBadge, { backgroundColor: 'rgba(10, 102, 194, 0.12)' }]}>
                            <Text style={[styles.modalAlertBadgeText, { color: themeColors.primary }]}>ACTIVE</Text>
                          </View>
                        </View>
                        <Text style={styles.modalAlertDesc}>{goal.title}</Text>
                        <TouchableOpacity 
                          style={styles.modalAlertActionBtn}
                          onPress={handleActiveGoalsPress}
                        >
                          <Text style={styles.modalAlertActionText}>Check Cycle Progress ➔</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setAlertsModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  customHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerLogoImage: {
    width: 100,
    height: 28,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickPunchPill: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickPunchPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  quickPunchPillInactive: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  quickPunchPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    marginRight: 6,
  },
  quickPunchStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 231, 235, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  radarCard: {
    marginBottom: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  radarStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarPulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 6,
    opacity: 0.85,
  },
  radarHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: themeColors.textPrimary,
    letterSpacing: -0.2,
  },
  radarSubtitle: {
    fontSize: 11,
    color: themeColors.textSecondary,
    marginBottom: 14,
  },
  radarStreams: {
    gap: 12,
  },
  radarStreamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radarStreamRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.45)',
  },
  radarStreamIconWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radarIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 22,
    borderWidth: 1,
    opacity: 0.25,
  },
  radarStreamDetails: {
    flex: 1,
    marginRight: 8,
  },
  radarStreamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarStreamTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  radarBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  radarBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  radarStreamDesc: {
    fontSize: 11,
    color: themeColors.textMuted,
    marginTop: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  serviceItem: {
    alignItems: 'center',
    width: '22%',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.textSecondary,
    textAlign: 'center',
  },
  goalsContainer: {
    marginTop: -4,
  },
  emptyGoals: {
    fontSize: 12,
    color: themeColors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  goalDot: {
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.textPrimary,
    flex: 1,
  },
  goalBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  commandCenterBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(10, 102, 194, 0.25)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  commandBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  commandIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 102, 194, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commandTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  commandBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  commandBannerSubtitle: {
    fontSize: 11,
    color: themeColors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  vaultBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(10, 102, 194, 0.25)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  vaultBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  vaultIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  vaultBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  vaultBannerSubtitle: {
    fontSize: 11,
    color: themeColors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  approvalsSection: {
    marginBottom: 8,
  },
  emptyApprovalsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: themeColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyApprovalsContent: {
    alignItems: 'center',
    gap: 6,
  },
  emptyApprovalsText: {
    fontSize: 12,
    color: themeColors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarStripWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: themeColors.textPrimary,
    letterSpacing: -0.2,
  },
  calendarMoreBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  calendarMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.primary,
  },
  calendarScroll: {
    paddingBottom: 4,
    gap: 10,
  },
  calendarDayTile: {
    width: 50,
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginRight: 6,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  calendarDayTileToday: {
    borderColor: themeColors.success,
    backgroundColor: '#ffffff',
  },
  calendarDayTileSelected: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.primary,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calendarDayMonth: {
    fontSize: 8,
    fontWeight: '800',
    color: themeColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calendarDayNum: {
    fontSize: 15,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginBottom: 2,
  },
  calendarDayName: {
    fontSize: 8,
    fontWeight: '800',
    color: themeColors.textMuted,
    letterSpacing: 0.5,
  },
  calendarDayTextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  calendarDayTextToday: {
    color: themeColors.success,
  },
  calendarDayNumSelected: {
    color: '#ffffff',
  },
  calendarDayNumToday: {
    color: themeColors.success,
  },
  calendarEventBadge: {
    position: 'absolute',
    top: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: themeColors.warning,
  },
  eventDrawerCard: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  eventDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.45)',
    paddingBottom: 8,
  },
  eventDrawerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: themeColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  eventCountText: {
    fontSize: 9,
    fontWeight: '900',
    color: themeColors.success,
  },
  emptyEventsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'center',
  },
  emptyEventsText: {
    fontSize: 12,
    color: themeColors.textMuted,
    fontWeight: '600',
  },
  eventItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  eventItemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.45)',
  },
  eventStatusIndicator: {
    width: 4,
    height: '100%',
    minHeight: 38,
    borderRadius: 2,
    marginRight: 12,
  },
  eventItemDetails: {
    flex: 1,
  },
  eventItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: themeColors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  eventItemTime: {
    fontSize: 10,
    fontWeight: '800',
  },
  eventItemDesc: {
    fontSize: 11,
    color: themeColors.textSecondary,
    marginTop: 4,
    lineHeight: 14,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalGrabHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalSubtitleText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    marginBottom: 16,
  },
  modalAlertItem: {
    backgroundColor: 'rgba(243, 244, 246, 0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },
  modalAlertInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalAlertIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAlertDetails: {
    flex: 1,
  },
  modalAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  modalAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  modalAlertBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalAlertBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalAlertDesc: {
    fontSize: 12,
    color: themeColors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  modalAlertActionBtn: {
    paddingVertical: 4,
  },
  modalAlertActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.primary,
  },
  modalCloseBtn: {
    backgroundColor: themeColors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
});

