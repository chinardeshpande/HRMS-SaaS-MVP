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

type ExitDetailRouteProp = RouteProp<DashboardStackParamList, 'ExitDetail'>;
type ExitDetailNavProp = StackNavigationProp<DashboardStackParamList, 'ExitDetail'>;

export const ExitDetailScreen: React.FC = () => {
  const route = useRoute<ExitDetailRouteProp>();
  const navigation = useNavigation<ExitDetailNavProp>();
  const { exitId: _exitId } = route.params;

  // Premium State Engine reflecting high fidelity screenshot data
  const [employeeInfo, setEmployeeInfo] = useState({
    name: 'Pooja Raman',
    code: 'DEMO012',
    email: 'pooja.raman.demo@aurorahr.in',
    dept: 'Finance & Operations',
    designation: 'People Operations Associate',
    resignationType: 'VOLUNTARY',
    noticePeriod: '30 days',
    resignationSubmitted: '2026-04-23',
    lastWorkingDate: '2026-05-25',
    reason: 'Relocation',
    reasonDetails: 'Moving to another city for family reasons.',
    rehireEligible: true,
    rehireReason: 'Good exit, maintained professional standards',
    hrNotes: 'Demo exit lifecycle case in clearance stage',
  });

  // Track clearances check-offs
  const [clearances, setClearances] = useState([
    { id: '1', dept: 'IT Clearance', details: 'MacBook, Charger & Access Card returned', status: 'cleared' },
    { id: '2', dept: 'Finance Clearance', details: 'Pending final dues and loan settlement calculations', status: 'pending' },
    { id: '3', dept: 'HR Operations', details: 'Exit Interview form and documentation complete', status: 'cleared' },
    { id: '4', dept: 'Legal & Compliance', details: 'NDA sign-off verification', status: 'pending' },
    { id: '5', dept: 'Admin & Operations', details: 'Desk clearance & keys returned', status: 'cleared' },
  ]);

  // Track assets check-offs
  const [assets, setAssets] = useState([
    { id: 'a-1', name: 'MacBook Pro 16"', serial: 'C02F2345Q05D', status: 'returned' },
    { id: 'a-2', name: 'Apple Magic Mouse', serial: 'M-520352', status: 'returned' },
    { id: 'a-3', name: 'Company RFID Access Card', serial: 'RFID-94280', status: 'pending' },
  ]);

  // Track documents
  const [documents, setDocuments] = useState([
    { id: 'd-1', name: 'Resignation_Letter.pdf', type: 'RESIGNATION LETTER', size: '245 KB', uploadedBy: 'Pooja Raman', date: '2026-04-23' },
    { id: 'd-2', name: 'No_Dues_Certificate.pdf', type: 'NO DUES CERTIFICATE', size: '180 KB', uploadedBy: 'HR Department', date: '2026-05-27' },
    { id: 'd-3', name: 'Experience_Letter.pdf', type: 'EXPERIENCE LETTER', size: '320 KB', uploadedBy: 'HR Department', date: '2026-05-27' },
  ]);

  // Modal UI States
  const [notesEditing, setNotesEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(employeeInfo.hrNotes);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  // Document Upload Form
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('NO DUES CERTIFICATE');

  // Interactive Live Calculation
  const totalClearances = clearances.length;
  const clearedCount = clearances.filter(c => c.status === 'cleared').length;
  const clearancePct = Math.round((clearedCount / totalClearances) * 100);

  const totalAssets = assets.length;
  const returnedAssetsCount = assets.filter(a => a.status === 'returned').length;

  const handleClearItem = (clearanceId: string) => {
    Alert.alert(
      'Department Sign-off',
      'Confirm clearance approval for this department?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setClearances(prev => prev.map(c => {
              if (c.id === clearanceId) {
                return { ...c, status: c.status === 'cleared' ? 'pending' : 'cleared' };
              }
              return c;
            }));
          }
        }
      ]
    );
  };

  const handleAssetReturn = (assetId: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const nextStatus = a.status === 'returned' ? 'pending' : 'returned';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleSaveNotes = () => {
    setEmployeeInfo(prev => ({ ...prev, hrNotes: tempNotes }));
    setNotesEditing(false);
    Alert.alert('Saved', 'HR Notes updated successfully!');
  };

  const handleAddDocument = () => {
    if (!newDocName) {
      Alert.alert('Error', 'Please provide a file name.');
      return;
    }
    const suffix = newDocName.endsWith('.pdf') ? '' : '.pdf';
    const newDoc = {
      id: `d-${Date.now()}`,
      name: `${newDocName}${suffix}`,
      type: newDocType,
      size: '150 KB',
      uploadedBy: 'HR Department',
      date: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [...prev, newDoc]);
    setNewDocName('');
    setUploadModalVisible(false);
    Alert.alert('Document Uploaded', `Document "${newDoc.name}" uploaded successfully.`);
  };

  const handleDeleteDocument = (docId: string, name: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(d => d.id !== docId));
          }
        }
      ]
    );
  };

  const handleRehireToggle = () => {
    setEmployeeInfo(prev => ({
      ...prev,
      rehireEligible: !prev.rehireEligible
    }));
  };

  // Steps for Exit Progress Tracker
  const steps = [
    { label: 'Resignation', comp: true },
    { label: 'Notice Period', comp: true },
    { label: 'Clearance', active: true },
    { label: 'Asset Return', locked: true },
    { label: 'Exit Interview', locked: true },
    { label: 'Settlement', locked: true }
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
        <Text style={styles.headerTitle}>Offboarding Details</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: '#e0f2fe', borderColor: '#3b82f6' }]}>
            <Text style={[styles.statusBadgeText, { color: '#3b82f6' }]}>Clearance In Progress</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card Summary */}
        <CommonCard style={styles.profileSummary} variant="glass">
          <View style={styles.profileRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>PR</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{employeeInfo.name}</Text>
              <Text style={styles.profileSubtitle}>{employeeInfo.code} • {employeeInfo.email}</Text>
            </View>
          </View>
        </CommonCard>

        {/* 6-State Horizontal Progress Tracker (Screenshot 3) */}
        <View style={styles.trackerWrapper}>
          <Text style={styles.sectionTitle}>Exit Progress Tracker</Text>
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

        {/* Metric KPI row (Screenshot 3) */}
        <View style={styles.metricRow}>
          <CommonCard style={styles.metricCard} variant="glass">
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Clearance Progress</Text>
              <MaterialCommunityIcons name="shield-check" size={20} color="#0A66C2" />
            </View>
            <Text style={styles.metricValue}>{clearancePct}%</Text>
            <Text style={styles.metricSubtitle}>{clearedCount}/{totalClearances} Cleared</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${clearancePct}%`, backgroundColor: '#0A66C2' }]} />
            </View>
          </CommonCard>

          <CommonCard style={styles.metricCard} variant="glass">
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Days Remaining</Text>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.metricValue, { color: '#ef4444' }]}>-2</Text>
            <Text style={styles.metricSubtitle}>Until 25/05/2026</Text>
            <View style={[styles.redAlertBadge, { marginTop: 8 }]}>
              <Text style={styles.redAlertText}>OVERDUE</Text>
            </View>
          </CommonCard>

          <CommonCard style={styles.metricCard} variant="glass">
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Assets Returned</Text>
              <MaterialCommunityIcons name="cube-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.metricValue}>{returnedAssetsCount}/{totalAssets}</Text>
            <Text style={styles.metricSubtitle}>Hardware returned</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.round((returnedAssetsCount/totalAssets)*100)}%`, backgroundColor: '#f59e0b' }]} />
            </View>
          </CommonCard>
        </View>

        {/* Employee & Timeline Info Box */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Employee Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{employeeInfo.dept}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Designation</Text>
              <Text style={styles.infoValue}>{employeeInfo.designation}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resignation Type</Text>
              <Text style={styles.infoValue}>{employeeInfo.resignationType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notice Period</Text>
              <Text style={styles.infoValue}>{employeeInfo.noticePeriod}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.detailBoxTitle}>Timeline & Dates</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resignation Submitted</Text>
              <Text style={styles.infoValue}>{formatDate(employeeInfo.resignationSubmitted, 'dd/MM/yyyy')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Working Date</Text>
              <Text style={styles.infoValue}>{formatDate(employeeInfo.lastWorkingDate, 'dd/MM/yyyy')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notice Status</Text>
              <Text style={[styles.infoValue, { color: '#ef4444', fontWeight: '800' }]}>-2 Days Overdue</Text>
            </View>
          </View>
        </CommonCard>

        {/* Resignation Reason */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Resignation Reason</Text>
          <Text style={styles.reasonPrimary}>Primary Reason: {employeeInfo.reason}</Text>
          <Text style={styles.reasonDesc}>{employeeInfo.reasonDetails}</Text>
        </CommonCard>

        {/* Clearance Checklist approvals board */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Department Clearances</Text>
          <Text style={styles.sectionSubtitleText}>Tap a pending item to mark it as Approved & Cleared.</Text>
          <View style={{ marginTop: 12 }}>
            {clearances.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.checklistRow, c.status === 'cleared' && styles.checklistRowCleared]}
                onPress={() => handleClearItem(c.id)}
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
                    <Text style={[styles.checkTitle, c.status === 'cleared' && styles.checkTitleCleared]}>{c.dept}</Text>
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

        {/* Hardware Assets Checklist */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Asset Return Checklist</Text>
          <View style={{ marginTop: 8 }}>
            {assets.map(a => (
              <View key={a.id} style={styles.assetRow}>
                <View style={styles.assetLeft}>
                  <MaterialCommunityIcons name="laptop" size={20} color="#64748B" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.assetName}>{a.name}</Text>
                    <Text style={styles.assetSerial}>S/N: {a.serial}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.assetActionBtn,
                    a.status === 'returned' ? styles.assetBtnReturned : styles.assetBtnPending
                  ]}
                  onPress={() => handleAssetReturn(a.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.assetBtnText,
                    { color: a.status === 'returned' ? '#10b981' : '#f59e0b' }
                  ]}>
                    {a.status === 'returned' ? 'Returned' : 'Mark Returned'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </CommonCard>

        {/* Rehire Eligibility */}
        <CommonCard style={styles.detailBox} variant="glass">
          <Text style={styles.detailBoxTitle}>Rehire Eligibility</Text>
          <TouchableOpacity
            style={styles.rehireRow}
            onPress={handleRehireToggle}
            activeOpacity={0.8}
          >
            <View style={[styles.checkboxRing, employeeInfo.rehireEligible && styles.checkboxRingCleared]}>
              {employeeInfo.rehireEligible && <MaterialCommunityIcons name="check" size={12} color="#ffffff" />}
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.rehireTitle}>Eligible for Rehire</Text>
              <Text style={styles.rehireDesc}>{employeeInfo.rehireReason}</Text>
            </View>
          </TouchableOpacity>
        </CommonCard>

        {/* HR Notes section */}
        <CommonCard style={styles.detailBox} variant="glass">
          <View style={styles.notesHeader}>
            <Text style={styles.detailBoxTitle}>HR Notes</Text>
            <TouchableOpacity onPress={() => {
              if (notesEditing) {
                handleSaveNotes();
              } else {
                setTempNotes(employeeInfo.hrNotes);
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
            <Text style={styles.notesText}>{employeeInfo.hrNotes || 'No notes compiled for this exit cycle.'}</Text>
          )}
        </CommonCard>

        {/* Exit Documents table */}
        <CommonCard style={styles.detailBox} variant="glass">
          <View style={styles.docsHeader}>
            <Text style={styles.detailBoxTitle}>Exit Documents</Text>
            <TouchableOpacity 
              style={styles.uploadBtn}
              onPress={() => setUploadModalVisible(true)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
              <Text style={styles.uploadBtnText}>Upload</Text>
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
                    <Text style={styles.docMeta}>{d.type} • {d.size} • By {d.uploadedBy}</Text>
                  </View>
                </View>
                <View style={styles.docActions}>
                  <TouchableOpacity 
                    style={styles.docActionBtn} 
                    onPress={() => Alert.alert('File View', `Displaying preview for ${d.name} natively...`)}
                  >
                    <MaterialCommunityIcons name="download" size={18} color="#0A66C2" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.docActionBtn}
                    onPress={() => handleDeleteDocument(d.id, d.name)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </CommonCard>
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
              <Text style={styles.modalTitle}>Upload Exit Document</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Document Type</Text>
            <View style={styles.selectorContainer}>
              {['RESIGNATION LETTER', 'NO DUES CERTIFICATE', 'EXPERIENCE LETTER'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.selectorOption, newDocType === t && styles.selectorOptionActive]}
                  onPress={() => setNewDocType(t)}
                >
                  <Text style={[styles.selectorText, newDocType === t && styles.selectorTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>File Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Clearance_Certificate"
                placeholderTextColor="#94a3b8"
                value={newDocName}
                onChangeText={setNewDocName}
              />
            </View>

            <CommonButton
              title="Confirm Upload"
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
  redAlertBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444',
    borderWidth: 0.8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  redAlertText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ef4444',
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  reasonPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  reasonDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  checklistRowCleared: {
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
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
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRingCleared: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  checkTitleCleared: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  checkDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  miniBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  miniBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  assetSerial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  assetActionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  assetBtnReturned: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  assetBtnPending: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  assetBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
  rehireRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rehireTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  rehireDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  notesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 18,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  uploadBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfoGroup: {
    marginLeft: 10,
    flex: 1,
  },
  docName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  docMeta: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
  },
  docActionBtn: {
    padding: 6,
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
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectorOption: {
    flex: 1,
    minWidth: '28%',
    height: 36,
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
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  selectorTextActive: {
    color: '#0A66C2',
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
