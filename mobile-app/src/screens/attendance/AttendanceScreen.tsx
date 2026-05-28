import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { CommonCard } from '../../components/CommonCard';
import { CommonButton } from '../../components/CommonButton';
import { AnimatedTimer } from '../../components/AnimatedTimer';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, formatTime, formatDuration } from '../../utils/format';
import { AttendanceRecord } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const ACME_OFFICE_COORDS = { latitude: 12.9716, longitude: 77.5946 };
const MOCK_WFH_COORDS = { latitude: 12.9300, longitude: 77.6200 };
const GEOFENCE_THRESHOLD_METERS = 100;

function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // returns distance in meters
}

export const AttendanceScreen: React.FC = () => {
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [activePunch, setActivePunch] = useState<AttendanceRecord | null>(null);
  const [todaySummary, setTodaySummary] = useState({ totalHoursToday: 0 });
  const [remarks, setRemarks] = useState('');
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Geofencing & Location States
  const [locationMode, setLocationMode] = useState<'office' | 'wfh' | 'gps'>('office');
  const [_currentCoords, _setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(ACME_OFFICE_COORDS);
  const [distance, setDistance] = useState<number>(0);

  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(true);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayStatus();
    fetchLogs();
  }, []);

  useEffect(() => {
    updateLocationAndDistance();
  }, [locationMode]);

  const fetchTodayStatus = async () => {
    setLoading(true);
    try {
      const res = await endpoints.attendance.today();
      if (res.success && res.data) {
        setHasPunchedIn(res.data.hasPunchedIn);
        setActivePunch(res.data.activePunch || null);
        setTodaySummary({ totalHoursToday: res.data.totalHoursToday });
      }
    } catch (err) {
      console.warn('⚠️ Error getting today attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await endpoints.attendance.logs({ page: 1, limit: 10 });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.warn('⚠️ Error getting attendance logs:', err);
    }
  };

  const updateLocationAndDistance = async () => {
    setGpsError(null);
    
    if (locationMode === 'office') {
      _setCurrentCoords(ACME_OFFICE_COORDS);
      setDistance(0);
      setIsWithinGeofence(true);
    } else if (locationMode === 'wfh') {
      _setCurrentCoords(MOCK_WFH_COORDS);
      const dist = getHaversineDistance(
        MOCK_WFH_COORDS.latitude,
        MOCK_WFH_COORDS.longitude,
        ACME_OFFICE_COORDS.latitude,
        ACME_OFFICE_COORDS.longitude
      );
      setDistance(dist);
      setIsWithinGeofence(dist <= GEOFENCE_THRESHOLD_METERS);
    } else if (locationMode === 'gps') {
      setGpsLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsError('Permission to access location was denied');
          setIsWithinGeofence(false);
          setDistance(Infinity);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        _setCurrentCoords(coords);
        
        const dist = getHaversineDistance(
          coords.latitude,
          coords.longitude,
          ACME_OFFICE_COORDS.latitude,
          ACME_OFFICE_COORDS.longitude
        );
        
        setDistance(dist);
        setIsWithinGeofence(dist <= GEOFENCE_THRESHOLD_METERS);
      } catch (err: any) {
        console.warn('⚠️ GPS error:', err);
        setGpsError('Failed to get high-accuracy GPS position');
        setIsWithinGeofence(false);
      } finally {
        setGpsLoading(false);
      }
    }
  };

  const handlePunch = async () => {
    // Re-verify geofence status before punch
    await updateLocationAndDistance();

    if (!isWithinGeofence && locationMode !== 'wfh') {
      const distanceString = distance === Infinity ? 'Unknown' : `${(distance / 1000).toFixed(2)} km`;
      Alert.alert(
        'Geofence Blocked',
        `Punches are only allowed within ${GEOFENCE_THRESHOLD_METERS}m of Acme Office. Current distance: ${distanceString}.`,
        [{ text: 'Dismiss', style: 'cancel' }]
      );
      return;
    }

    if (locationMode === 'wfh') {
      // Prompt user WFH punches are restricted unless labeled
      if (!remarks.toLowerCase().includes('wfh') && !remarks.toLowerCase().includes('home')) {
        Alert.alert(
          'WFH Remarks Required',
          'You are outside the office geofence. To record a Work From Home punch, please add "WFH" to your remarks.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }

    const action = hasPunchedIn ? 'out' : 'in';
    
    Alert.alert(
      hasPunchedIn ? 'Confirm Clock Out' : 'Confirm Clock In',
      hasPunchedIn 
        ? 'Are you ready to clock out and end your active shift?'
        : 'Do you want to clock in and start your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: hasPunchedIn ? 'Clock Out' : 'Clock In',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await endpoints.attendance.punch({
                action,
                remarks: remarks.trim() || undefined,
                timestamp: new Date().toISOString()
              });

              if (res.success && res.data) {
                Alert.alert('Success', `Successfully clocked ${action}!`);
                setRemarks('');
                fetchTodayStatus();
                fetchLogs();
              }
            } catch (err: any) {
              console.warn('⚠️ Punch action failed:', err);
              Alert.alert('Punch Failed', err.message || 'An error occurred during punching.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A66C2" />
          <Text style={styles.loadingText}>Fetching shift status...</Text>
        </View>
      ) : (
        <>
          {/* Pulsing clock-in area */}
          <View style={styles.punchSection}>
            <AnimatedTimer
              startTime={activePunch?.punchIn}
              isActive={hasPunchedIn}
            />

            {/* Geofence Live Widget */}
            <View style={styles.geofenceWidget}>
              <View style={styles.geofenceHeader}>
                <MaterialCommunityIcons 
                  name={isWithinGeofence ? 'map-marker-radius' : 'map-marker-distance'} 
                  size={20} 
                  color={isWithinGeofence ? '#22c55e' : '#eab308'} 
                />
                <Text style={styles.geofenceTitle}>Office Geofence Status</Text>
                
                {gpsLoading && <ActivityIndicator size="small" color="#0A66C2" style={{ marginLeft: 6 }} />}
              </View>

              <View style={styles.geofenceStatusRow}>
                <View style={[
                  styles.geofenceBadge, 
                  isWithinGeofence ? styles.badgeGreen : styles.badgeYellow
                ]}>
                  <View style={[
                    styles.badgeDot, 
                    isWithinGeofence ? styles.dotGreen : styles.dotYellow
                  ]} />
                  <Text style={[
                    styles.badgeText, 
                    isWithinGeofence ? styles.textGreen : styles.textYellow
                  ]}>
                    {isWithinGeofence ? 'Within Premises' : 'Outside Bounds'}
                  </Text>
                </View>
                
                <Text style={styles.distanceMetric}>
                  {distance === 0 ? '0.0 m' : distance < 1000 ? `${distance.toFixed(1)} m away` : `${(distance / 1000).toFixed(2)} km away`}
                </Text>
              </View>

              {gpsError && (
                <Text style={styles.gpsErrorText}>
                  <MaterialCommunityIcons name="alert-outline" size={12} color="#ef4444" /> {gpsError}
                </Text>
              )}

              {/* Developer Coordinate Switchers */}
              <View style={styles.mockSelectorTitleRow}>
                <MaterialCommunityIcons name="xml" size={14} color="#6b7280" />
                <Text style={styles.mockSelectorTitle}>QA LOCATION MOCK CONTROLS</Text>
              </View>
              
              <View style={styles.mockContainer}>
                <TouchableOpacity 
                  style={[styles.mockTab, locationMode === 'office' && styles.mockTabActive]}
                  onPress={() => setLocationMode('office')}
                >
                  <MaterialCommunityIcons name="office-building" size={14} color={locationMode === 'office' ? '#ffffff' : '#6b7280'} />
                  <Text style={[styles.mockTabText, locationMode === 'office' && styles.mockTabTextActive]}>Office Desk</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.mockTab, locationMode === 'wfh' && styles.mockTabActive]}
                  onPress={() => setLocationMode('wfh')}
                >
                  <MaterialCommunityIcons name="home-outline" size={14} color={locationMode === 'wfh' ? '#ffffff' : '#6b7280'} />
                  <Text style={[styles.mockTabText, locationMode === 'wfh' && styles.mockTabTextActive]}>WFH (5.2km)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.mockTab, locationMode === 'gps' && styles.mockTabActive]}
                  onPress={() => setLocationMode('gps')}
                >
                  <MaterialCommunityIcons name="crosshairs-gps" size={14} color={locationMode === 'gps' ? '#ffffff' : '#6b7280'} />
                  <Text style={[styles.mockTabText, locationMode === 'gps' && styles.mockTabTextActive]}>Live GPS</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remarks Input */}
            <View style={styles.remarksCard}>
              <MaterialCommunityIcons name="note-text-outline" size={20} color="#6b7280" style={styles.remarksIcon} />
              <TextInput
                style={styles.remarksInput}
                placeholder="Where are you working from? (e.g. WFH, Office)"
                placeholderTextColor="#9ca3af"
                value={remarks}
                onChangeText={setRemarks}
                maxLength={100}
              />
            </View>

            {/* Action button */}
            <CommonButton
              title={hasPunchedIn ? 'CLOCK OUT' : 'CLOCK IN'}
              onPress={handlePunch}
              variant={hasPunchedIn ? 'danger' : 'success'}
              loading={actionLoading}
              icon={
                <MaterialCommunityIcons 
                  name={hasPunchedIn ? 'exit-to-app' : 'gesture-double-tap'} 
                  size={22} 
                  color="#ffffff" 
                />
              }
              style={styles.punchBtn}
            />
          </View>

          {/* Today's shift stats */}
          <CommonCard title="Today's Active Session">
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>IN TIME</Text>
                <Text style={styles.statVal}>{activePunch?.punchIn ? formatTime(activePunch.punchIn) : '--:--'}</Text>
              </View>
              <View style={[styles.statCol, styles.borderLeft]}>
                <Text style={styles.statLabel}>OUT TIME</Text>
                <Text style={styles.statVal}>{activePunch?.punchOut ? formatTime(activePunch.punchOut) : '--:--'}</Text>
              </View>
              <View style={[styles.statCol, styles.borderLeft]}>
                <Text style={styles.statLabel}>WORKED HOURS</Text>
                <Text style={styles.statVal}>
                  {hasPunchedIn ? 'Active...' : formatDuration(todaySummary.totalHoursToday)}
                </Text>
              </View>
            </View>
          </CommonCard>

          {/* Recent history list */}
          <Text style={styles.historyTitle}>Recent Attendance Logs</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-question" size={40} color="#9ca3af" />
              <Text style={styles.emptyText}>No attendance logs found</Text>
            </View>
          ) : (
            logs.map((log) => (
              <CommonCard 
                key={log.attendanceId} 
                title={formatDate(log.date, 'EEEE, MMM dd')}
                headerRight={<StatusBadge status={log.status || 'Present'} />}
              >
                <View style={styles.logBody}>
                  <View style={styles.logDetailRow}>
                    <View style={styles.logTimeCol}>
                      <MaterialCommunityIcons name="login" size={16} color="#22c55e" />
                      <Text style={styles.logTimeText}>In: {formatTime(log.punchIn)}</Text>
                    </View>
                    <View style={[styles.logTimeCol, { marginLeft: 16 }]}>
                      <MaterialCommunityIcons name="logout" size={16} color="#ef4444" />
                      <Text style={styles.logTimeText}>Out: {formatTime(log.punchOut)}</Text>
                    </View>
                  </View>
                  {log.remarks && (
                    <Text style={styles.logRemarks}>
                      <Text style={{ fontWeight: '600' }}>Note:</Text> {log.remarks}
                    </Text>
                  )}
                </View>
              </CommonCard>
            ))
          )}
        </>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  punchSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  punchBtn: {
    width: '100%',
    marginTop: 16,
    marginBottom: 12,
  },
  geofenceWidget: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  geofenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  geofenceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  geofenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeGreen: {
    backgroundColor: '#f0fdf4',
  },
  badgeYellow: {
    backgroundColor: '#fef9c3',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#22c55e',
  },
  dotYellow: {
    backgroundColor: '#ca8a04',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textGreen: {
    color: '#15803d',
  },
  textYellow: {
    color: '#854d0e',
  },
  distanceMetric: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1f2937',
  },
  gpsErrorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'left',
  },
  mockSelectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginBottom: 8,
  },
  mockSelectorTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  mockContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 3,
  },
  mockTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  mockTabActive: {
    backgroundColor: '#0A66C2',
  },
  mockTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginLeft: 4,
  },
  mockTabTextActive: {
    color: '#ffffff',
  },
  remarksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  remarksIcon: {
    marginRight: 8,
  },
  remarksInput: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.8,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 8,
  },
  logBody: {
    marginTop: -4,
  },
  logDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTimeCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  logRemarks: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
});
